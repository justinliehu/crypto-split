import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, simplifyDebts, addTransaction } from '../utils/storage';
import { shortAddress, sendCrypto } from '../utils/wallet';

export default function SettlePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { address } = useWallet();
  const { t } = useLocale();
  const [group, setGroup] = useState(null);
  const [debts, setDebts] = useState([]);
  const [sending, setSending] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    const g = getGroup(id);
    if (!g) { nav('/groups'); return; }
    setGroup(g);
    setDebts(simplifyDebts(id));
  }, [id]);

  const memberName = (addr) => {
    if (!group) return shortAddress(addr);
    const m = group.members.find((m) => m.address.toLowerCase() === addr.toLowerCase());
    return m?.nickname || shortAddress(addr);
  };

  const handleSend = async (debt) => {
    try {
      setSending(debt.from + debt.to);
      setTxHash(null);
      const hash = await sendCrypto(debt.currency, debt.to, debt.amount.toString());
      setTxHash(hash);
      // 记录交易
      addTransaction({
        from: debt.from,
        to: debt.to,
        amount: debt.amount,
        currency: debt.currency,
        txHash: hash,
        groupId: id,
        groupName: group?.name || '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(null);
    }
  };

  if (!group) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(`/group/${id}`)}>&larr; {t('back')}</button>
        <h2 className="text-xl font-bold">{t('settle_title')}</h2>
      </div>

      <p className="text-sm text-base-content/60 mb-6">{t('settle_desc')}</p>

      {txHash && (
        <div className="alert alert-success mb-4">
          <div>
            <p className="font-bold">{t('settle_tx_sent')}</p>
            <p className="text-xs font-mono break-all">{t('settle_tx_hash')}: {txHash}</p>
          </div>
        </div>
      )}

      {debts.length === 0 ? (
        <div className="text-center py-16 text-base-content/50">
          <p className="text-5xl mb-4">🎉</p>
          <p>{t('settle_empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {debts.map((debt, i) => {
            const isYouPaying = debt.from.toLowerCase() === address?.toLowerCase();
            return (
              <div key={i} className="card bg-base-200 shadow-sm">
                <div className="card-body py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <p className="text-sm font-semibold">{memberName(debt.from)}</p>
                        <p className="text-xs text-base-content/40">{t('settle_from')}</p>
                      </div>
                      <span className="text-2xl">→</span>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{memberName(debt.to)}</p>
                        <p className="text-xs text-base-content/40">{t('settle_to')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{debt.amount} {debt.currency}</p>
                      {isYouPaying && (
                        <button
                          className="btn btn-primary btn-xs mt-1"
                          disabled={sending === debt.from + debt.to}
                          onClick={() => handleSend(debt)}
                        >
                          {sending === debt.from + debt.to ? '...' : `${t('settle_pay')} ${debt.currency}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
