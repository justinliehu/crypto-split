/**
 * Wallet utility — Phantom (Solana) · Solflare (Solana)
 */

// ─── Solana RPC endpoints with failover ──────────────────────────────────────
// Override via VITE_SOLANA_RPC in .env (comma-separated list supported)
const DEFAULT_SOLANA_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://solana.drpc.org',
  'https://api.mainnet-beta.solana.com',
];

function getSolanaRpcList() {
  const envRpc = import.meta.env.VITE_SOLANA_RPC;
  if (envRpc) {
    const list = envRpc.split(',').map((s) => s.trim()).filter(Boolean);
    return [...list, ...DEFAULT_SOLANA_RPCS];
  }
  return DEFAULT_SOLANA_RPCS;
}

async function createResilientConnection() {
  const { Connection } = await import('@solana/web3.js');
  const rpcs = getSolanaRpcList();
  let lastErr;
  for (const rpc of rpcs) {
    try {
      const conn = new Connection(rpc, 'confirmed');
      await conn.getLatestBlockhash();
      return conn;
    } catch (e) {
      lastErr = e;
      console.warn('[Solana RPC] ' + rpc + ' unavailable, trying next:', e && e.message ? e.message : e);
    }
  }
  throw new Error(
    'All Solana RPC nodes are unavailable. Set VITE_SOLANA_RPC in .env or retry later. Last error: ' +
      (lastErr && lastErr.message ? lastErr.message : lastErr)
  );
}

export function shortAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const s = address.trim();
  if (s.length <= 10) return s;
  return s.slice(0, 6) + '...' + s.slice(-4);
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
    wallets.push({ id: 'phantom', name: 'Phantom', icon: 'P', type: 'solana' });
  }

  if (window.solflare?.isSolflare) {
    wallets.push({ id: 'solflare', name: 'Solflare', icon: 'S', type: 'solana' });
  }

  if (isMobile() && wallets.length === 0) {
    wallets.push({ id: 'phantom-deeplink', name: 'Phantom', icon: 'P', type: 'solana' });
  }

  return wallets;
}

async function connectPhantom() {
  const provider = window.phantom?.solana ?? window.solana;
  if (!provider?.isPhantom) throw new Error('Phantom not detected, please install it first');
  const resp = await provider.connect();
  const address = resp.publicKey?.toString();
  if (!address) throw new Error('Phantom did not return a public key');
  return address;
}

async function connectSolflare() {
  const provider = window.solflare;
  if (!provider?.isSolflare) throw new Error('Solflare not detected, please install it first');
  await provider.connect();
  const address = provider.publicKey?.toString();
  if (!address) throw new Error('Solflare did not return a public key');
  return address;
}

function connectPhantomDeeplink() {
  const url = encodeURIComponent(window.location.href);
  const browseLink = 'https://phantom.app/ul/browse/' + url;
  const phantomScheme = 'phantom://browse/' + url;

  let navigated = false;
  window.addEventListener('blur', () => { navigated = true; }, { once: true });

  window.location.href = phantomScheme;

  setTimeout(() => {
    if (navigated || document.hidden) return;
    const intentUrl = 'intent://browse/' + url + '#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=' + encodeURIComponent(browseLink) + ';end';
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
    default: throw new Error('Unknown wallet: ' + walletId);
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

/**
 * On page load: detect current wallet state, and silently restore the
 * previously authorized connection (onlyIfTrusted) so the user does not
 * have to re-connect after every refresh.
 */
export async function getConnectedAddress() {
  await waitForInjection();

  const phantomSolana = window.phantom?.solana ?? window.solana;
  if (phantomSolana?.isPhantom) {
    if (phantomSolana.isConnected && phantomSolana.publicKey) {
      return { address: phantomSolana.publicKey.toString(), walletId: 'phantom' };
    }
    try {
      const resp = await phantomSolana.connect({ onlyIfTrusted: true });
      const address = resp?.publicKey?.toString();
      if (address) return { address, walletId: 'phantom' };
    } catch (_) { /* not previously authorized */ }
  }

  if (window.solflare?.isSolflare) {
    if (window.solflare.isConnected && window.solflare.publicKey) {
      return { address: window.solflare.publicKey.toString(), walletId: 'solflare' };
    }
    try {
      await window.solflare.connect({ onlyIfTrusted: true });
      const address = window.solflare.publicKey?.toString();
      if (address) return { address, walletId: 'solflare' };
    } catch (_) { /* not previously authorized */ }
  }

  return null;
}

export async function sendSOL(toAddress, amountSol) {
  const provider = window.phantom?.solana ?? window.solana ?? window.solflare;
  if (!provider) throw new Error('A Solana wallet (Phantom / Solflare) is required');

  if (!provider.isConnected) await provider.connect();

  const { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } =
    await import('@solana/web3.js');

  const connection = await createResilientConnection();
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

export async function sendSPLToken(toAddress, amount, mintAddress, decimals) {
  const provider = window.phantom?.solana ?? window.solana ?? window.solflare;
  if (!provider) throw new Error('A Solana wallet is required');

  if (!provider.isConnected) await provider.connect();

  const { PublicKey, Transaction } = await import('@solana/web3.js');
  const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    getAccount,
  } = await import('@solana/spl-token');

  const connection = await createResilientConnection();
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

export const SKR_MINT = 'SKRtBrVfGE3JwCrBaKBahGHLhRGyNb5G1xQNjduJkwb';
export const SKR_DECIMALS = 9;

export async function sendSKR(toAddress, amount) {
  return sendSPLToken(toAddress, amount, SKR_MINT, SKR_DECIMALS);
}

export async function sendCrypto(currency, toAddress, amount) {
  switch (currency) {
    case 'SOL':
      return sendSOL(toAddress, amount);
    case 'SKR':
      return sendSKR(toAddress, amount);
    default:
      return sendSOL(toAddress, amount);
  }
}
