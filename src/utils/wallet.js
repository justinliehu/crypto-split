/**
 * 钱包连接工具
 * 支持：Phantom (Solana) · Solflare (Solana)
 */

export function shortAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const s = address.trim();
  if (s.length <= 10) return s;
  return s.slice(0, 6) + '…' + s.slice(-4);
}

async function waitForInjection() {
  if (window.phantom?.solana || window.solflare) return;
  await new Promise((r) => setTimeout(r, 1200));
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function detectAvailableWallets() {
  await waitForInjection();
  const wallets = [];

  const phantomSolana = window.phantom?.solana ?? window.solana;
  if (phantomSolana?.isPhantom) {
    wallets.push({ id: 'phantom', name: 'Phantom', icon: '👻', type: 'solana' });
  }

  if (window.solflare?.isSolflare) {
    wallets.push({ id: 'solflare', name: 'Solflare', icon: '☀️', type: 'solana' });
  }

  // 手机端没检测到钱包时，添加 deeplink 选项
  if (isMobile() && wallets.length === 0) {
    wallets.push({ id: 'phantom-deeplink', name: 'Phantom', icon: '👻', type: 'solana' });
  }

  return wallets;
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

// ─── Wallet Deeplink（在钱包内置浏览器中打开网站）─────────────────────────────

/**
 * Phantom deeplink — 在 Phantom 内置浏览器中打开当前页面
 */
function connectPhantomDeeplink() {
  const url = encodeURIComponent(window.location.href);
  const browseLink = `https://phantom.app/ul/browse/${url}`;
  const phantomScheme = `phantom://browse/${url}`;

  let navigated = false;
  window.addEventListener('blur', () => { navigated = true; }, { once: true });

  window.location.href = phantomScheme;

  setTimeout(() => {
    if (navigated || document.hidden) return;
    const intentUrl = `intent://browse/${url}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=${encodeURIComponent(browseLink)};end`;
    window.location.href = intentUrl;

    setTimeout(() => {
      if (navigated || document.hidden) return;
      window.open(browseLink, '_blank');
    }, 500);
  }, 400);

  throw new Error('DEEPLINK_REDIRECT');
}

export async function connectWalletById(walletId) {
  switch (walletId) {
    case 'phantom':           return connectPhantom();
    case 'solflare':          return connectSolflare();
    case 'phantom-deeplink':  return connectPhantomDeeplink();
    default: throw new Error(`未知钱包: ${walletId}`);
  }
}

export async function disconnectWallet(walletId) {
  if (walletId === 'phantom') {
    try { (window.phantom?.solana ?? window.solana)?.disconnect(); } catch (_) {}
  }
  if (walletId === 'solflare') {
    try { window.solflare?.disconnect(); } catch (_) {}
  }
}

export async function getConnectedAddress() {
  await waitForInjection();

  const phantomSolana = window.phantom?.solana ?? window.solana;
  if (phantomSolana?.isPhantom && phantomSolana.isConnected) {
    const address = phantomSolana.publicKey?.toString();
    if (address) return { address, walletId: 'phantom' };
  }

  if (window.solflare?.isSolflare && window.solflare.isConnected) {
    const address = window.solflare.publicKey?.toString();
    if (address) return { address, walletId: 'solflare' };
  }

  return null;
}

/**
 * 发送 SOL 转账
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

// ─── SKR (Seeker Token) ─────────────────────────────────────────────────────
export const SKR_MINT = 'SKRtBrVfGE3JwCrBaKBahGHLhRGyNb5G1xQNjduJkwb';
export const SKR_DECIMALS = 9;

export async function sendSKR(toAddress, amount) {
  return sendSPLToken(toAddress, amount, SKR_MINT, SKR_DECIMALS);
}

/**
 * 根据币种发送对应的加密货币
 */
export async function sendCrypto(currency, toAddress, amount) {
  switch (currency) {
    case 'SOL':
      return sendSOL(toAddress, amount);
    case 'SKR':
      return sendSKR(toAddress, amount);
    default:
      throw new Error(`不支持的币种: ${currency}`);
  }
}
