import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  detectAvailableWallets,
  connectWalletById,
  disconnectWallet,
  getConnectedAddress,
  shortAddress,
} from '../utils/wallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableWallets, setAvailableWallets] = useState([]);

  // 初始化 + 聚焦时重新检测已连接钱包
  // 场景：手机端通过 deeplink 跳 Phantom 签名后回来，页面需要重新确认连接状态
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const wallets = await detectAvailableWallets();
      if (cancelled) return;
      setAvailableWallets(wallets);
      const connected = await getConnectedAddress();
      if (cancelled) return;
      if (connected) {
        setAddress(connected.address);
        setWalletId(connected.walletId);
      }
      setLoading(false);
    };

    refresh();

    // 回到页面时重新检测（用户从钱包 App 签完名切回来）
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);

    // 监听 Phantom/Solflare 本身的 connect/disconnect 事件
    const phantom = window.phantom?.solana ?? window.solana;
    const onPhantomConnect = (publicKey) => {
      const addr = publicKey?.toString?.() || phantom?.publicKey?.toString?.();
      if (addr) { setAddress(addr); setWalletId('phantom'); }
    };
    const onPhantomDisconnect = () => {
      setAddress(null); setWalletId(null);
    };
    phantom?.on?.('connect', onPhantomConnect);
    phantom?.on?.('disconnect', onPhantomDisconnect);

    const sol = window.solflare;
    const onSolflareConnect = () => {
      const addr = sol?.publicKey?.toString?.();
      if (addr) { setAddress(addr); setWalletId('solflare'); }
    };
    sol?.on?.('connect', onSolflareConnect);
    sol?.on?.('disconnect', onPhantomDisconnect);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      try { phantom?.off?.('connect', onPhantomConnect); } catch (_) {}
      try { phantom?.off?.('disconnect', onPhantomDisconnect); } catch (_) {}
      try { sol?.off?.('connect', onSolflareConnect); } catch (_) {}
      try { sol?.off?.('disconnect', onPhantomDisconnect); } catch (_) {}
    };
  }, []);


  const connect = useCallback(async (id) => {
    const addr = await connectWalletById(id);
    setAddress(addr);
    setWalletId(id);
    return addr;
  }, []);

  const disconnect = useCallback(async () => {
    if (walletId) await disconnectWallet(walletId);
    setAddress(null);
    setWalletId(null);
  }, [walletId]);

  return (
    <WalletContext.Provider
      value={{
        address,
        walletId,
        loading,
        availableWallets,
        shortAddr: shortAddress(address),
        connect,
        disconnect,
        isConnected: !!address,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}
