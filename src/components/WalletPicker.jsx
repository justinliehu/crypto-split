import { useLocale } from '../contexts/LocaleContext';

export default function WalletPicker({ wallets, onSelect, onClose }) {
  const { t } = useLocale();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-base-200 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        <h3 className="font-bold text-lg mb-4">{t('connect_wallet')}</h3>
        {wallets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-base-content/60 mb-3">{t('wallet_not_detected')}</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://phantom.app/download"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm gap-2"
              >
                👻 {t('wallet_install_phantom')}
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {wallets.map((w) => (
              <button
                key={w.id}
                className="btn btn-outline btn-lg justify-start gap-3"
                onClick={() => onSelect(w.id)}
              >
                <span className="text-2xl">{w.icon}</span>
                <span>{w.name}</span>
                <span className="badge badge-sm ml-auto">{w.type.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button className="btn" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}
