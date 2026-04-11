import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import WalletPicker from './WalletPicker';
import QRScanner from './QRScanner';
import NotificationBell from './NotificationBell';
import SyncButton from './SyncButton';

export default function Header() {
  const { address, shortAddr, isConnected, disconnect, availableWallets, connect } = useWallet();
  const { locale, setLocale, t } = useLocale();
  const { installable, promptInstall } = usePWAInstall();
  const [showPicker, setShowPicker] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const nav = useNavigate();

  const handleConnect = async (walletId) => {
    try {
      await connect(walletId);
      setShowPicker(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleScanResult = useCallback((value) => {
    setShowScanner(false);
    // Extract hash route from scanned URL or pasted link
    try {
      const url = new URL(value);
      const hash = url.hash || '';
      if (hash.startsWith('#/join/')) {
        // Navigate including query string (has invite data)
        const route = hash.slice(1); // remove leading #
        nav(route);
        return;
      }
    } catch (_) {}
    // If it's a raw path like /join/xxx
    if (value.startsWith('/join/')) {
      nav(value);
      return;
    }
    alert(t('scan_invalid') || 'Invalid QR code');
  }, [nav, t]);

  return (
    <>
      <header className="navbar bg-base-200 shadow-lg px-4">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold text-primary">
            CryptoSplit
          </Link>
        </div>
        <div className="flex-none gap-1">
          {installable && (
            <button className="btn btn-sm btn-outline" onClick={promptInstall}>
              {t('install_app')}
            </button>
          )}

          {/* 扫码按钮 — 始终显示 */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            title={t('scan_title') || 'Scan QR'}
            onClick={() => setShowScanner(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>

          {isConnected && (
            <>
              <SyncButton />
              <NotificationBell />
              <Link to="/history" className="btn btn-ghost btn-sm btn-circle" title={t('history_title')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </>
          )}

          <select
            className="select select-sm select-bordered w-20"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value="zh">{t('lang_zh')}</option>
            <option value="en">{t('lang_en')}</option>
          </select>

          {isConnected ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-sm btn-primary">
                {shortAddr}
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-40 z-50">
                <li>
                  <button onClick={disconnect} className="text-error">
                    {t('disconnect')}
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                if (availableWallets.length === 1) handleConnect(availableWallets[0].id);
                else setShowPicker(true);
              }}
            >
              {t('connect_wallet')}
            </button>
          )}
        </div>
      </header>

      {showPicker && (
        <WalletPicker
          wallets={availableWallets}
          onSelect={handleConnect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showScanner && (
        <QRScanner
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
