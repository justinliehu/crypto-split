/**
 * 钱包连接工具
 * 支持：MetaMask (EVM) · Phantom (Solana) · Solflare (Solana) · WalletConnect v2 (EVM QR码)
 */

let _wcProvider = null;

export function shortAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const s = address.trim();
  if (s.length <= 10) return s;
  return s.slice(0, 6) + '…' + s.slice(-4);
}

export function hasWallet() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export function hasWalletConnect() {
  return Boolean(import.meta.env.VITE_WC_PROJECT_ID);
}

async function waitForInjection() {
  if (hasWallet() || window.phantom?.solana || window.solflare) return;
  await new Promise((r) => setTimeout(r, 1200));
}

export async function detectAvailableWallets() {
  await waitForInjection();
  const wallets = [];

  if (window.ethereum?.isMetaMask) {
    wallets.push({ id: 'metamask', name: 'MetaMask', icon: '🦊', type: 'evm' });
  } else if (window.ethereum) {
    wallets.push({ id: 'metamask', name: 'Browser Wallet', icon: '🌐', type: 'evm' });
  }

  const phantomSolana = window.phantom?.solana ?? window.solana;
  if (phantomSolana?.isPhantom) {
    wallets.push({ id: 'phantom', name: 'Phantom', icon: '👻', type: 'solana' });
  }

  if (window.solflare?.isSolflare) {
    wallets.push({ id: 'solflare', name: 'Solflare', icon: '☀️', type: 'solana' });
  }

  if (hasWalletConnect()) {
    wallets.push({ id: 'walletconnect', name: 'WalletConnect', icon: '🔗', type: 'evm' });
  }

  return wallets;
}

async function connectMetaMask() {
  const { ethers } = await import('ethers');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const account = accounts?.[0];
  if (!account) throw new Error('未获取到账户，请在钱包弹窗中授权连接');
  return account;
}

async function connectPhantom() {
  const provider = window.phantom?.solana ?? window.solana;
  if (!provider?.isPhantom) throw new Error('未检测到 Phantom 钱包，请先安装');
  const resp = await provider.connect();
  const address = resp.publicKey?.toString();
  if (!address) throw new Error('Phantom 未返回公钥');
  return address;
}

async function connectSolflare() {
  const provider = window.solflare;
  if (!provider?.isSolflare) throw new Error('未检测到 Solflare 钱包，请先安装');
  await provider.connect();
  const address = provider.publicKey?.toString();
  if (!address) throw new Error('Solflare 未返回公钥');
  return address;
}

async function connectWalletConnect() {
  const projectId = import.meta.env.VITE_WC_PROJECT_ID;
  if (!projectId) throw new Error('未配置 WalletConnect Project ID');

  const { EthereumProvider } = await import('@walletconnect/ethereum-provider');

  if (_wcProvider) {
    try { await _wcProvider.disconnect(); } catch (_) {}
    _wcProvider = null;
  }

  const wcProvider = await EthereumProvider.init({
    projectId,
    chains: [1],
    optionalChains: [137, 56, 43114],
    showQrModal: true,
    metadata: {
      name: 'CryptoSplit',
      description: 'Split expenses with crypto',
      url: window.location.origin,
      icons: [window.location.origin + '/pwa-192x192.png'],
    },
  });

  await wcProvider.connect();
  const accounts = await wcProvider.request({ method: 'eth_accounts' });
  const account = accounts?.[0];
  if (!account) throw new Error('WalletConnect 未获取到账户');

  _wcProvider = wcProvider;
  return account;
}

export async function connectWalletById(walletId) {
  switch (walletId) {
    case 'metamask':      return connectMetaMask();
    case 'phantom':       return connectPhantom();
    case 'solflare':      return connectSolflare();
    case 'walletconnect': return connectWalletConnect();
    default: throw new Error(`未知钱包: ${walletId}`);
  }
}

export async function disconnectWallet(walletId) {
  if (walletId === 'walletconnect' && _wcProvider) {
    try { await _wcProvider.disconnect(); } catch (_) {}
    _wcProvider = null;
  }
  if (walletId === 'phantom') {
    try { (window.phantom?.solana ?? window.solana)?.disconnect(); } catch (_) {}
  }
  if (walletId === 'solflare') {
    try { window.solflare?.disconnect(); } catch (_) {}
  }
}

export async function getConnectedAddress() {
  await waitForInjection();

  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts?.[0]) return { address: accounts[0], walletId: 'metamask' };
    } catch (_) {}
  }

  const phantomSolana = window.phantom?.solana ?? window.solana;
  if (phantomSolana?.isPhantom && phantomSolana.isConnected) {
    const address = phantomSolana.publicKey?.toString();
    if (address) return { address, walletId: 'phantom' };
  }

  if (window.solflare?.isSolflare && window.solflare.isConnected) {
    const address = window.solflare.publicKey?.toString();
    if (address) return { address, walletId: 'solflare' };
  }

  if (_wcProvider?.connected) {
    try {
      const accounts = await _wcProvider.request({ method: 'eth_accounts' });
      if (accounts?.[0]) return { address: accounts[0], walletId: 'walletconnect' };
    } catch (_) {}
  }

  return null;
}

/**
 * 发送 ETH 转账
 * @param {string} toAddress 收款地址
 * @param {string} amountEth ETH 数量（字符串）
 * @returns {Promise<string>} 交易哈希
 */
export async function sendETH(toAddress, amountEth) {
  const { ethers } = await import('ethers');

  if (!window.ethereum) throw new Error('需要 EVM 钱包来发送交易');

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });

  return tx.hash;
}
