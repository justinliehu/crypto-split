import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  detectAvailableWallets,
  connectWalletById,
  disconnectWallet,
  getConnectedAddress,
  shortAddress,
  handlePhantomDeeplinkResponse,
} from '../utils/wallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableWallets, setAvailableWallets] = useState([]);

  // 初始化：处理 deeplink 回调 + 检测已连接钱包
  useEffect(() => {
    (async () => {
      // 先检查是否是 Phantom deeplink 回调
      const dlResult = await handlePhantomDeeplinkResponse();
      if (dlResult) {
        setAddress(dlResult.address);
        setWalletId(dlResult.walletId);
        const wallets = await detectAvailableWallets();
        setAvailableWallets(wallets);
        setLoading(false);
        return;
      }

      const wallets = await detectAvailableWallets();
      setAvailableWallets(wallets);
      const connected = await getConnectedAddress();
      if (connected) {
        setAddress(connected.address);
        setWalletId(connected.walletId);
      }
      setLoading(false);
    })();
  }, []);

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (accounts) => {
      if (accounts.length > 0) setAddress(accounts[0]);
      else { setAddress(null); setWalletId(null); }
    };
    window.ethereum.on('accountsChanged', handler);
    return () => window.ethereum.removeListener('accountsChanged', handler);
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
