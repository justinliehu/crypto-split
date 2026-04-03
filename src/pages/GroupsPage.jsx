import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroups, createGroup, deleteGroup } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

export default function GroupsPage() {
  const { address } = useWallet();
  const { t } = useLocale();
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([{ address: '', nickname: '' }]);

  useEffect(() => {
    setGroups(getGroups().filter((g) =>
      g.createdBy === address || g.members.some((m) => m.address.toLowerCase() === address?.toLowerCase())
    ));
  }, [address]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const allMembers = [
      { address, nickname: t('group_you') },
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('groups_title')}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          + {t('groups_create')}
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="card bg-base-200 shadow-md mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="card-body">
              <input
                className="input input-bordered w-full"
                placeholder={t('group_name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="divider text-sm">{t('group_members')}</div>

              <div className="bg-base-300 rounded-lg p-3 mb-2 flex items-center gap-2">
                <span className="badge badge-primary">You</span>
                <span className="text-sm font-mono">{shortAddress(address)}</span>
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
                className="btn btn-ghost btn-sm self-start"
                onClick={() => setMembers([...members, { address: '', nickname: '' }])}
              >
                + {t('group_add_member')}
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

      {groups.length === 0 && !showCreate ? (
        <div className="text-center py-16 text-base-content/50">
          <p className="text-5xl mb-4">📋</p>
          <p>{t('groups_empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <motion.div
              key={g.id}
              className="card bg-base-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.01 }}
              onClick={() => nav(`/group/${g.id}`)}
            >
              <div className="card-body py-4 flex-row items-center justify-between">
                <div>
                  <h3 className="font-bold">{g.name}</h3>
                  <p className="text-sm text-base-content/60">
                    {g.members.length} {t('group_members')}
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-error"
                  onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
