import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, getExpenses, deleteExpense, calculateBalances, simplifyDebts, updateGroup, mergeRemoteExpenses } from '../utils/storage';
import { shortAddress } from '../utils/wallet';
import QRInvite from '../components/QRInvite';

const COLORS = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];

function Avatar({ name, size = 'w-8 h-8', textSize = 'text-xs' }) {
  const initial = (name || '?')[0].toUpperCase();
  const colorIdx = name ? name.charCodeAt(0) % COLORS.length : 0;
  return (
    <div className={`${size} ${COLORS[colorIdx]} rounded-full flex items-center justify-center text-white font-bold ${textSize} shrink-0`}>
      {initial}
    </div>
  );
}

function formatDate(ts, locale) {
  const d = new Date(ts);
  if (locale === 'zh') {
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { address } = useWallet();
  const { t, locale } = useLocale();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [debts, setDebts] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses'); // expenses | balances
  const reload = () => {
    const g = getGroup(id);
    if (!g) { nav('/groups'); return; }
    setGroup(g);
    setExpenses(getExpenses(id));
    setBalances(calculateBalances(id));
    setDebts(simplifyDebts(id));
  };

  useEffect(() => {
    reload();
    // Auto-sync: push local data, pull & merge remote
    const local = getGroup(id);
    if (!local) return;
    fetch(`${window.location.origin}/api/sync/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: local.name,
        createdBy: local.createdBy,
        members: local.members,
        expenses: getExpenses(id),
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((remote) => {
        if (!remote) return;
        let changed = false;
        const current = getGroup(id);
        if (current && remote.members) {
          const localAddrs = new Set(current.members.map((m) => m.address?.toLowerCase()));
          const newMembers = remote.members.filter((m) => !localAddrs.has(m.address?.toLowerCase()));
          if (newMembers.length > 0) {
            updateGroup(id, { members: [...current.members, ...newMembers] });
            changed = true;
          }
        }
        if (remote.expenses) {
          const added = mergeRemoteExpenses(remote.expenses);
          if (added > 0) changed = true;
        }
        if (changed) reload();
      })
      .catch(() => {});
  }, [id]);

  const memberName = (addr) => {
    if (!group) return shortAddress(addr);
    if (addr?.toLowerCase() === address?.toLowerCase()) return t('group_you_label');
    const m = group.members.find((m) => m.address?.toLowerCase() === addr?.toLowerCase());
    return m?.nickname || shortAddress(addr);
  };

  const isYou = (addr) => addr?.toLowerCase() === address?.toLowerCase();

  const handleDeleteExpense = (expId) => {
    if (!confirm(t('expense_delete_confirm'))) return;
    deleteExpense(expId);
    reload();
  };

  if (!group) return null;

  // 按币种统计
  const statsByCurrency = {};
  for (const e of expenses) {
    const cur = e.currency || 'SOL';
    if (!statsByCurrency[cur]) statsByCurrency[cur] = { total: 0, youPaid: 0, yourShare: 0 };
    const amt = parseFloat(e.amount || 0);
    statsByCurrency[cur].total += amt;
    if (e.paidBy?.toLowerCase() === address?.toLowerCase()) statsByCurrency[cur].youPaid += amt;
    if (e.splitAmong.some((a) => a?.toLowerCase() === address?.toLowerCase())) {
      statsByCurrency[cur].yourShare += amt / e.splitAmong.length;
    }
  }

  // 按月份分组账单
  const groupedExpenses = {};
  expenses.sort((a, b) => b.createdAt - a.createdAt).forEach((exp) => {
    const d = new Date(exp.createdAt);
    const key = locale === 'zh'
      ? `${d.getFullYear()}年${d.getMonth() + 1}月`
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!groupedExpenses[key]) groupedExpenses[key] = [];
    groupedExpenses[key].push(exp);
  });

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => nav('/groups')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{group.name}</h2>
          <div className="flex items-center gap-1 mt-0.5">
            {group.members.map((m, i) => (
              <span key={i} className="text-xs text-base-content/50">
                {isYou(m.address) ? t('group_you_label') : (m.nickname || shortAddress(m.address))}
                {i < group.members.length - 1 ? '、' : ''}
              </span>
            ))}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowInvite(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
      </div>

      {/* 统计摘要卡片 — 按币种分行 */}
      <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-base-content/50 mb-1">
            <div></div>
            <div>{t('summary_total')}</div>
            <div>{t('summary_you_paid')}</div>
            <div>{t('summary_your_share')}</div>
          </div>
          {Object.entries(statsByCurrency).map(([cur, s]) => (
            <div key={cur} className="grid grid-cols-4 gap-2 text-center items-center">
              <span className="badge badge-outline badge-sm font-mono">{cur}</span>
              <p className="text-sm font-bold">{s.total.toFixed(4)}</p>
              <p className="text-sm font-bold text-primary">{s.youPaid.toFixed(4)}</p>
              <p className="text-sm font-bold">{s.yourShare.toFixed(4)}</p>
            </div>
          ))}
          {Object.keys(statsByCurrency).length === 0 && (
            <p className="text-center text-sm text-base-content/40">-</p>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 mb-4">
        <Link to={`/group/${id}/add-expense`} className="btn btn-primary btn-sm flex-1 gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('expense_add')}
        </Link>
        <Link to={`/group/${id}/settle`} className="btn btn-secondary btn-sm flex-1 gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {t('settle_title')}
        </Link>
      </div>

      {/* Tab 切换 */}
      <div className="tabs tabs-boxed mb-4">
        <button className={`tab ${activeTab === 'expenses' ? 'tab-active' : ''}`} onClick={() => setActiveTab('expenses')}>
          {t('expenses_title')} ({expenses.length})
        </button>
        <button className={`tab ${activeTab === 'balances' ? 'tab-active' : ''}`} onClick={() => setActiveTab('balances')}>
          {t('balances_title')}
        </button>
      </div>

      {/* 余额 Tab */}
      {activeTab === 'balances' && (
        <div className="flex flex-col gap-3">
          {debts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-base-content/50">{t('balances_settled')}</p>
            </div>
          ) : (
            debts.map((debt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                <Avatar name={memberName(debt.from)} />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className={`font-semibold ${isYou(debt.from) ? 'text-error' : ''}`}>
                      {memberName(debt.from)}
                    </span>
                    {' '}{t('settle_owes')}{' '}
                    <span className={`font-semibold ${isYou(debt.to) ? 'text-success' : ''}`}>
                      {memberName(debt.to)}
                    </span>
                  </p>
                </div>
                <span className="font-bold text-sm">{debt.amount.toFixed(4)} {debt.currency}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 账单 Tab — 活动流风格 */}
      {activeTab === 'expenses' && (
        expenses.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
            <p className="text-base-content/50">{t('expenses_empty')}</p>
            <p className="text-xs text-base-content/30 mt-1">{t('expenses_empty_hint')}</p>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([month, exps]) => (
            <div key={month} className="mb-4">
              <p className="text-xs font-bold text-base-content/40 uppercase tracking-wide mb-2">{month}</p>
              <div className="flex flex-col gap-2">
                {exps.map((exp) => {
                  const payerIsYou = isYou(exp.paidBy);
                  const yourExpShare = exp.splitAmong.some((a) => a?.toLowerCase() === address?.toLowerCase())
                    ? parseFloat(exp.amount) / exp.splitAmong.length : 0;
                  const youLent = payerIsYou ? parseFloat(exp.amount) - yourExpShare : 0;
                  const youBorrowed = !payerIsYou ? yourExpShare : 0;

                  return (
                    <motion.div
                      key={exp.id}
                      className="flex items-center gap-3 p-3 bg-base-200 rounded-xl hover:bg-base-300 transition-colors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* 日期 */}
                      <div className="text-center w-10 shrink-0">
                        <p className="text-xs text-base-content/40 leading-none">
                          {new Date(exp.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' })}
                        </p>
                        <p className="text-lg font-bold leading-tight">
                          {new Date(exp.createdAt).getDate()}
                        </p>
                      </div>

                      {/* 图标 */}
                      <div className="w-10 h-10 rounded-xl bg-base-300 flex items-center justify-center text-lg shrink-0">
                        {exp.currency === 'SOL' ? '◎' : exp.currency === 'SKR' ? '🔍' : '💰'}
                      </div>

                      {/* 描述 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{exp.description}</p>
                        <p className="text-xs text-base-content/50">
                          {memberName(exp.paidBy)} {t('expense_paid_label')} {exp.amount} {exp.currency}
                        </p>
                      </div>

                      {/* 你的份额 */}
                      <div className="text-right shrink-0">
                        {youLent > 0 ? (
                          <>
                            <p className="text-xs text-success">{t('expense_you_lent')}</p>
                            <p className="text-sm font-bold text-success">{youLent.toFixed(4)}</p>
                          </>
                        ) : youBorrowed > 0 ? (
                          <>
                            <p className="text-xs text-error">{t('expense_you_borrowed')}</p>
                            <p className="text-sm font-bold text-error">{youBorrowed.toFixed(4)}</p>
                          </>
                        ) : (
                          <p className="text-xs text-base-content/30">{t('expense_not_involved')}</p>
                        )}
                      </div>

                      {/* 删除 */}
                      <button
                        className="btn btn-ghost btn-xs btn-circle opacity-30 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); handleDeleteExpense(exp.id); }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )
      )}

      {showInvite && <QRInvite group={group} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
