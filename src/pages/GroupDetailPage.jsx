import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, getExpenses, deleteExpense, calculateBalances } from '../utils/storage';
import { shortAddress } from '../utils/wallet';
import QRInvite from '../components/QRInvite';

export default function GroupDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { address } = useWallet();
  const { t } = useLocale();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [showInvite, setShowInvite] = useState(false);

  const reload = () => {
    const g = getGroup(id);
    if (!g) { nav('/groups'); return; }
    setGroup(g);
    setExpenses(getExpenses(id));
    setBalances(calculateBalances(id));
  };

  useEffect(reload, [id]);

  const memberName = (addr) => {
    if (!group) return shortAddress(addr);
    const m = group.members.find((m) => m.address.toLowerCase() === addr.toLowerCase());
    return m?.nickname || shortAddress(addr);
  };

  const handleDeleteExpense = (expId) => {
    if (!confirm(t('expense_delete_confirm'))) return;
    deleteExpense(expId);
    reload();
  };

  if (!group) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/groups')}>&larr; {t('back')}</button>
      </div>

      <div className="flex items-start justify-between mb-1">
        <h2 className="text-2xl font-bold">{group.name}</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowInvite(true)}
          title={t('invite_title')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t('invite_title')}
        </button>
      </div>
      <p className="text-sm text-base-content/60 mb-6">
        {group.members.map((m) => m.nickname || shortAddress(m.address)).join(', ')}
      </p>

      {/* 余额卡片 */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body py-4">
          <h3 className="card-title text-base">{t('balances_title')}</h3>
          {Object.keys(balances).length === 0 ? (
            <p className="text-base-content/50">{t('balances_settled')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(balances).map(([currency, net]) => (
                <div key={currency}>
                  <p className="text-xs font-bold text-base-content/40 mb-1">{currency}</p>
                  {Object.entries(net).map(([addr, amount]) => {
                    const isYou = addr.toLowerCase() === address?.toLowerCase();
                    return (
                      <div key={addr} className="flex justify-between text-sm">
                        <span className={isYou ? 'font-bold' : ''}>
                          {memberName(addr)} {isYou ? t('group_you') : ''}
                        </span>
                        <span className={amount >= 0 ? 'text-success' : 'text-error'}>
                          {amount >= 0 ? '+' : ''}{amount.toFixed(6)} {currency}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 mb-6">
        <Link to={`/group/${id}/add-expense`} className="btn btn-primary btn-sm flex-1">
          + {t('expense_add')}
        </Link>
        <Link to={`/group/${id}/settle`} className="btn btn-secondary btn-sm flex-1">
          {t('settle_title')}
        </Link>
      </div>

      {/* 账单列表 */}
      <h3 className="font-bold mb-3">{t('expenses_title')}</h3>
      {expenses.length === 0 ? (
        <p className="text-center py-8 text-base-content/50">{t('expenses_empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.sort((a, b) => b.createdAt - a.createdAt).map((exp) => (
            <motion.div
              key={exp.id}
              className="card bg-base-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="card-body py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{exp.description}</p>
                    <p className="text-sm text-base-content/60">
                      {t('expense_paid_by')}: {memberName(exp.paidBy)}
                    </p>
                    <p className="text-xs text-base-content/40">
                      {t('expense_split_among')}: {exp.splitAmong.map(memberName).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{exp.amount} {exp.currency}</p>
                    <p className="text-xs text-base-content/40">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      className="btn btn-ghost btn-xs text-error mt-1"
                      onClick={() => handleDeleteExpense(exp.id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showInvite && <QRInvite group={group} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
