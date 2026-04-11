import { useEffect, useRef } from 'react';
import { useLocale } from '../contexts/LocaleContext';

export default function WalletPicker({ wallets, onSelect, onClose }) {
  const { t } = useLocale();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{t('connect_wallet')}</h3>
        {wallets.length === 0 ? (
          <p className="text-base-content/60">No wallets detected. Please install MetaMask or another wallet.</p>
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
        <div className="modal-action">
          <button className="btn" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
