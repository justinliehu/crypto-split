import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroups, createGroup, deleteGroup, simplifyDebts } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

// 头像颜色池
const COLORS = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];

function Avatar({ name, size = 'w-10 h-10', textSize = 'text-sm' }) {
  const initial = (name || '?')[0].toUpperCase();
  const colorIdx = name ? name.charCodeAt(0) % COLORS.length : 0;
  return (
    <div className={`${size} ${COLORS[colorIdx]} rounded-full flex items-center justify-center text-white font-bold ${textSize}`}>
      {initial}
    </div>
  );
}

export default function GroupsPage() {
  const { address } = useWallet();
  const { t, locale } = useLocale();
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([{ address: '', nickname: '' }]);

  // 总欠款/被欠统计
  const [totalOwe, setTotalOwe] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);

  useEffect(() => {
    const allGroups = getGroups().filter((g) =>
      g.createdBy === address || g.members.some((m) => m.address.toLowerCase() === address?.toLowerCase())
    );
    setGroups(allGroups);

    // 计算总额
    let owe = 0, owed = 0;
    for (const g of allGroups) {
      const debts = simplifyDebts(g.id);
      for (const d of debts) {
        if (d.from.toLowerCase() === address?.toLowerCase()) owe += d.amount;
        if (d.to.toLowerCase() === address?.toLowerCase()) owed += d.amount;
      }
    }
    setTotalOwe(owe);
    setTotalOwed(owed);
  }, [address]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const allMembers = [
      { address, nickname: '' },
      ...members.filter((m) => m.address.trim()),
    ];
    const group = createGroup({ name: name.trim(), members: allMembers, createdBy: address });
    setGroups((prev) => [...prev, group]);
    setName('');
    setMembers([{ address: '', nickname: '' }]);
    setShowCreate(false);
  };

  const handleDelete = (id) => {
    if (!confirm(t('group_delete_confirm'))) return;
    deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const getGroupBalance = (g) => {
    const debts = simplifyDebts(g.id);
    let youOwe = 0, owedToYou = 0;
    for (const d of debts) {
      if (d.from.toLowerCase() === address?.toLowerCase()) youOwe += d.amount;
      if (d.to.toLowerCase() === address?.toLowerCase()) owedToYou += d.amount;
    }
    return { youOwe, owedToYou };
  };

  const getMemberDisplay = (m) => {
    if (m.address.toLowerCase() === address?.toLowerCase()) return t('group_you_label');
    return m.nickname || shortAddress(m.address);
  };

  return (
    <div>
      {/* 总览仪表盘 — Splitwise 风格 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 items-center text-center">
            <p className="text-xs text-base-content/50">{t('dashboard_total_balance')}</p>
            <p className={`text-lg font-bold ${totalOwed - totalOwe >= 0 ? 'text-success' : 'text-error'}`}>
              {totalOwed - totalOwe >= 0 ? '+' : ''}{(totalOwed - totalOwe).toFixed(4)}
            </p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 items-center text-center">
            <p className="text-xs text-base-content/50">{t('dashboard_you_owe')}</p>
            <p className="text-lg font-bold text-error">
              {totalOwe > 0 ? `-${totalOwe.toFixed(4)}` : '0'}
            </p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 items-center text-center">
            <p className="text-xs text-base-content/50">{t('dashboard_owed_to_you')}</p>
            <p className="text-lg font-bold text-success">
              {totalOwed > 0 ? `+${totalOwed.toFixed(4)}` : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('groups_title')}</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowCreate(!showCreate)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('groups_create')}
        </button>
      </div>

      {/* 创建群组表单 */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="card bg-base-200 shadow-md mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="card-body">
              <h3 className="font-bold text-sm mb-2">{t('group_name')}</h3>
              <input
                className="input input-bordered w-full"
                placeholder={t('group_name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="divider text-xs text-base-content/40">{t('group_members')}</div>

              <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg mb-2">
                <Avatar name={shortAddress(address)} size="w-8 h-8" textSize="text-xs" />
                <div>
                  <p className="text-sm font-semibold">{t('group_you_label')}</p>
                  <p className="text-xs font-mono text-base-content/40">{shortAddress(address)}</p>
                </div>
              </div>

              {members.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="input input-bordered input-sm flex-1 font-mono"
                    placeholder={t('group_member_address')}
                    value={m.address}
                    onChange={(e) => {
                      const copy = [...members];
                      copy[i].address = e.target.value;
                      setMembers(copy);
                    }}
                  />
                  <input
                    className="input input-bordered input-sm w-24"
                    placeholder={t('group_member_nickname')}
                    value={m.nickname}
                    onChange={(e) => {
                      const copy = [...members];
                      copy[i].nickname = e.target.value;
                      setMembers(copy);
                    }}
                  />
                  {members.length > 1 && (
                    <button
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => setMembers(members.filter((_, j) => j !== i))}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}

              <button
                className="btn btn-ghost btn-sm self-start gap-1"
                onClick={() => setMembers([...members, { address: '', nickname: '' }])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('group_add_member')}
              </button>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>
                  {t('cancel')}
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleCreate}>
                  {t('confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 群组列表 */}
      {groups.length === 0 && !showCreate ? (
        <div className="text-center py-16 text-base-content/50">
          <div className="text-6xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-lg">{t('groups_empty')}</p>
          <p className="text-sm mt-1">{t('groups_empty_hint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const bal = getGroupBalance(g);
            const netBalance = bal.owedToYou - bal.youOwe;
            return (
              <motion.div
                key={g.id}
                className="card bg-base-200 shadow-sm cursor-pointer hover:shadow-md transition-all hover:translate-y-[-1px]"
                whileTap={{ scale: 0.99 }}
                onClick={() => nav(`/group/${g.id}`)}
              >
                <div className="card-body py-4 px-4">
                  <div className="flex items-center gap-3">
                    {/* 群组头像 */}
                    <Avatar name={g.name} />

                    {/* 群组信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{g.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex -space-x-2">
                          {g.members.slice(0, 4).map((m, i) => (
                            <div key={i} className="w-5 h-5 rounded-full bg-base-300 border-2 border-base-200 flex items-center justify-center text-[8px] font-bold">
                              {getMemberDisplay(m)[0]}
                            </div>
                          ))}
                          {g.members.length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-base-300 border-2 border-base-200 flex items-center justify-center text-[8px]">
                              +{g.members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-base-content/40 ml-1">
                          {g.members.length} {t('group_members')}
                        </span>
                      </div>
                    </div>

                    {/* 余额 */}
                    <div className="text-right">
                      {netBalance === 0 ? (
                        <span className="text-xs text-base-content/40">{t('balances_settled')}</span>
                      ) : (
                        <>
                          <p className={`text-sm font-bold ${netBalance > 0 ? 'text-success' : 'text-error'}`}>
                            {netBalance > 0 ? t('dashboard_owed_to_you') : t('dashboard_you_owe')}
                          </p>
                          <p className={`text-xs font-mono ${netBalance > 0 ? 'text-success' : 'text-error'}`}>
                            {Math.abs(netBalance).toFixed(4)}
                          </p>
                        </>
                      )}
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
