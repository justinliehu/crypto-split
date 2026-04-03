import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getDebtsOwedToYou } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

export default function NotificationBell() {
  const { address } = useWallet();
  const { t } = useLocale();
  const nav = useNavigate();
  const [debts, setDebts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!address) return;
    setDebts(getDebtsOwedToYou(address));
  }, [address]);

  // 定时刷新
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      setDebts(getDebtsOwedToYou(address));
    }, 10000);
    return () => clearInterval(interval);
  }, [address]);

  const total = debts.reduce((sum, d) => sum + d.debts.length, 0);

  if (!address) return null;

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle relative" onClick={() => setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {total > 0 && (
          <span className="badge badge-xs badge-error absolute -top-1 -right-1">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </label>

      {open && (
        <div tabIndex={0} className="dropdown-content z-50 shadow-lg bg-base-200 rounded-box w-72 mt-2">
          <div className="p-3">
            <h4 className="font-bold text-sm mb-2">{t('notif_title')}</h4>

            {debts.length === 0 || total === 0 ? (
              <p className="text-sm text-base-content/50 py-2">{t('notif_empty')}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {debts.map((group) =>
                  group.debts.map((debt, i) => (
                    <div
                      key={`${group.groupId}-${i}`}
                      className="flex justify-between items-center text-sm p-2 rounded-lg bg-base-300 cursor-pointer hover:bg-base-100"
                      onClick={() => { setOpen(false); nav(`/group/${group.groupId}/settle`); }}
                    >
                      <div>
                        <p className="font-semibold text-xs">{group.groupName}</p>
                        <p className="text-xs text-base-content/60">
                          {shortAddress(debt.from)} {t('notif_owes_you')}
                        </p>
                      </div>
                      <span className="text-success font-bold text-xs">
                        +{debt.amount} {debt.currency}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
