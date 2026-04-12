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

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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

  // 手机端没检测到钱包时，添加 deeplink 选项
  if (isMobile() && wallets.length === 0) {
    wallets.push({ id: 'phantom-deeplink', name: 'Phantom', icon: '👻', type: 'solana' });
    wallets.push({ id: 'metamask-deeplink', name: 'MetaMask', icon: '🦊', type: 'evm' });
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

/**
 * Phantom deeplink 连接（手机浏览器无钱包扩展时使用）
 * 三层 fallback: phantom:// → intent:// → https://phantom.app/ul/
 */
function connectPhantomDeeplink() {
  const currentUrl = window.location.href;
  const redirectUrl = encodeURIComponent(currentUrl);
  const appUrl = encodeURIComponent(window.location.origin);

  // Layer 1: phantom:// scheme
  const phantomScheme = `phantom://v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}`;

  // Layer 2: Android intent
  const intentUrl = `intent://v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}#Intent;scheme=phantom;package=app.phantom;end;`;

  // Layer 3: Universal link
  const universalLink = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}`;

  // Try scheme first
  window.location.href = phantomScheme;

  // If scheme didn't work (no app), try intent after 300ms
  setTimeout(() => {
    if (document.hidden) return; // App opened successfully
    window.location.href = intentUrl;
  }, 300);

  // Last resort: universal link after 800ms
  setTimeout(() => {
    if (document.hidden) return;
    window.open(universalLink, '_blank');
  }, 800);

  throw new Error('DEEPLINK_REDIRECT');
}

/**
 * MetaMask deeplink 连接
 */
function connectMetaMaskDeeplink() {
  const currentUrl = window.location.href.replace('https://', '').replace('http://', '');

  // MetaMask deep link opens the current page inside MetaMask's browser
  const metamaskDeeplink = `https://metamask.app.link/dapp/${currentUrl}`;

  window.location.href = metamaskDeeplink;

  throw new Error('DEEPLINK_REDIRECT');
}

export async function connectWalletById(walletId) {
  switch (walletId) {
    case 'metamask':          return connectMetaMask();
    case 'phantom':           return connectPhantom();
    case 'solflare':          return connectSolflare();
    case 'walletconnect':     return connectWalletConnect();
    case 'phantom-deeplink':  return connectPhantomDeeplink();
    case 'metamask-deeplink': return connectMetaMaskDeeplink();
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

/**
 * 发送 SOL 转账（通过 Phantom / Solflare）
 * @param {string} toAddress 收款地址（Solana base58 公钥）
 * @param {string} amountSol SOL 数量（字符串）
 * @returns {Promise<string>} 交易签名
 */
export async function sendSOL(toAddress, amountSol) {
  const provider = window.phantom?.solana ?? window.solana ?? window.solflare;
  if (!provider) throw new Error('需要 Solana 钱包（Phantom / Solflare）来发送交易');

  if (!provider.isConnected) await provider.connect();

  const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } =
    await import('@solana/web3.js');

  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const fromPubkey = provider.publicKey;
  const toPubkey = new PublicKey(toAddress);
  const lamports = Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
  );

  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const { signature } = await provider.signAndSendTransaction(transaction);
  return signature;
}

/**
 * 发送 SPL Token 转账（用于 SKR 等 Solana 上的代币）
 * @param {string} toAddress 收款地址
 * @param {string} amount 数量（字符串）
 * @param {string} mintAddress 代币 mint 地址
 * @param {number} decimals 代币精度
 * @returns {Promise<string>} 交易签名
 */
export async function sendSPLToken(toAddress, amount, mintAddress, decimals) {
  const provider = window.phantom?.solana ?? window.solana ?? window.solflare;
  if (!provider) throw new Error('需要 Solana 钱包来发送代币');

  if (!provider.isConnected) await provider.connect();

  const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
  const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    getAccount,
  } = await import('@solana/spl-token');

  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const fromPubkey = provider.publicKey;
  const toPubkey = new PublicKey(toAddress);
  const mint = new PublicKey(mintAddress);

  const fromATA = await getAssociatedTokenAddress(mint, fromPubkey);
  const toATA = await getAssociatedTokenAddress(mint, toPubkey);

  const transaction = new Transaction();

  // 如果收款方还没有该代币账户，先创建
  try {
    await getAccount(connection, toATA);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(fromPubkey, toATA, toPubkey, mint)
    );
  }

  const rawAmount = BigInt(Math.round(parseFloat(amount) * 10 ** decimals));
  transaction.add(
    createTransferInstruction(fromATA, toATA, fromPubkey, rawAmount)
  );

  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const { signature } = await provider.signAndSendTransaction(transaction);
  return signature;
}

// ─── SKR (Seeker Token) 配置 ─────────────────────────────────────────────────
// TODO: 替换为 SKR 正式的 mint 地址和精度
export const SKR_MINT = 'SKRtBrVfGE3JwCrBaKBahGHLhRGyNb5G1xQNjduJkwb';
export const SKR_DECIMALS = 9;

/**
 * 发送 SKR 代币
 */
export async function sendSKR(toAddress, amount) {
  return sendSPLToken(toAddress, amount, SKR_MINT, SKR_DECIMALS);
}

// ─── ERC-20 代币支持 ──────────────────────────────────────────────────────────

// 主网合约地址
const ERC20_TOKENS = {
  USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
};

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

/**
 * 发送 ERC-20 代币
 * @param {string} toAddress 收款地址
 * @param {string} amount 数量（人类可读，如 "10.5"）
 * @param {string} tokenSymbol 代币符号 (USDT/USDC)
 * @returns {Promise<string>} 交易哈希
 */
export async function sendERC20(toAddress, amount, tokenSymbol) {
  const { ethers } = await import('ethers');

  if (!window.ethereum) throw new Error('需要 EVM 钱包来发送代币');

  const tokenInfo = ERC20_TOKENS[tokenSymbol];
  if (!tokenInfo) throw new Error(`未知 ERC-20 代币: ${tokenSymbol}`);

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, signer);

  const rawAmount = ethers.parseUnits(amount, tokenInfo.decimals);
  const tx = await contract.transfer(toAddress, rawAmount);

  return tx.hash;
}

/**
 * 根据币种发送对应的加密货币
 * @param {string} currency 币种 (ETH/SOL/SKR/USDT/USDC/...)
 * @param {string} toAddress 收款地址
 * @param {string} amount 数量
 * @returns {Promise<string>} 交易哈希/签名
 */
export async function sendCrypto(currency, toAddress, amount) {
  switch (currency) {
    case 'ETH':
    case 'MATIC':
    case 'BNB':
      return sendETH(toAddress, amount);
    case 'SOL':
      return sendSOL(toAddress, amount);
    case 'SKR':
      return sendSKR(toAddress, amount);
    case 'USDT':
    case 'USDC':
      return sendERC20(toAddress, amount, currency);
    default:
      throw new Error(`不支持的币种: ${currency}`);
  }
}
