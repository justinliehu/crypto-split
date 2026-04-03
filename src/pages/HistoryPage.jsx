import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getTransactions } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

export default function HistoryPage() {
  const { address } = useWallet();
  const { t } = useLocale();
  const nav = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all | sent | received

  useEffect(() => {
    if (!address) return;
    const all = getTransactions();
    const mine = all.filter(
      (tx) =>
        tx.from?.toLowerCase() === address.toLowerCase() ||
        tx.to?.toLowerCase() === address.toLowerCase()
    );
    setTransactions(mine.sort((a, b) => b.timestamp - a.timestamp));
  }, [address]);

  const filtered = transactions.filter((tx) => {
    if (filter === 'sent') return tx.from?.toLowerCase() === address?.toLowerCase();
    if (filter === 'received') return tx.to?.toLowerCase() === address?.toLowerCase();
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}>&larr; {t('back')}</button>
        <h2 className="text-xl font-bold">{t('history_title')}</h2>
      </div>

      {/* 筛选 */}
      <div className="tabs tabs-boxed mb-4">
        {['all', 'sent', 'received'].map((f) => (
          <button
            key={f}
            className={`tab ${filter === f ? 'tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {t(`history_${f}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/50">
          <p className="text-5xl mb-4">📜</p>
          <p>{t('history_empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((tx) => {
            const isSent = tx.from?.toLowerCase() === address?.toLowerCase();
            return (
              <motion.div
                key={tx.id}
                className="card bg-base-200"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="card-body py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-sm ${isSent ? 'badge-error' : 'badge-success'}`}>
                          {isSent ? t('history_sent_badge') : t('history_received_badge')}
                        </span>
                        <span className="text-sm font-semibold">{tx.groupName || ''}</span>
                      </div>
                      <p className="text-sm mt-1">
                        {isSent ? t('settle_to') : t('settle_from')}:{' '}
                        <span className="font-mono">{shortAddress(isSent ? tx.to : tx.from)}</span>
                      </p>
                      {tx.txHash && (
                        <p className="text-xs text-base-content/40 font-mono mt-1 break-all">
                          TX: {tx.txHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isSent ? 'text-error' : 'text-success'}`}>
                        {isSent ? '-' : '+'}{tx.amount} {tx.currency}
                      </p>
                      <p className="text-xs text-base-content/40">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-base-content/40">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
