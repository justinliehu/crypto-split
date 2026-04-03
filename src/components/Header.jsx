import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import WalletPicker from './WalletPicker';

export default function Header() {
  const { address, shortAddr, isConnected, disconnect, availableWallets, connect } = useWallet();
  const { locale, setLocale, t } = useLocale();
  const { installable, promptInstall } = usePWAInstall();
  const [showPicker, setShowPicker] = useState(false);

  const handleConnect = async (walletId) => {
    try {
      await connect(walletId);
      setShowPicker(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <header className="navbar bg-base-200 shadow-lg px-4">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold text-primary">
            CryptoSplit
          </Link>
        </div>
        <div className="flex-none gap-2">
          {installable && (
            <button className="btn btn-sm btn-outline" onClick={promptInstall}>
              {t('install_app')}
            </button>
          )}

          <select
            className="select select-sm select-bordered"
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
    </>
  );
}
