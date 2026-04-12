import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, getExpenses, addExpense } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

export default function AddExpensePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { address } = useWallet();
  const { t } = useLocale();
  const [group, setGroup] = useState(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ETH');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState([]);

  useEffect(() => {
    const g = getGroup(id);
    if (!g) { nav('/groups'); return; }
    setGroup(g);
    setPaidBy(address || g.members[0]?.address || '');
    setSplitAmong(g.members.map((m) => m.address));
  }, [id, address]);

  const toggleMember = (addr) => {
    setSplitAmong((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  };

  const handleSubmit = () => {
    if (!description.trim() || !amount || !paidBy || splitAmong.length === 0) return;
    addExpense({
      groupId: id,
      description: description.trim(),
      amount,
      currency,
      paidBy,
      splitAmong,
    });
    // Sync to server so other members can see the new expense
    const g = getGroup(id);
    if (g) {
      fetch(`${window.location.origin}/api/sync/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: g.name,
          createdBy: g.createdBy,
          members: g.members,
          expenses: getExpenses(id),
        }),
      }).catch(() => {});
    }
    nav(`/group/${id}`);
  };

  if (!group) return null;

  const memberLabel = (m) => {
    if (m.address?.toLowerCase() === address?.toLowerCase()) return t('group_you_label');
    return m.nickname || shortAddress(m.address);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(`/group/${id}`)}>&larr; {t('back')}</button>
        <h2 className="text-xl font-bold">{t('expense_add')}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* 描述 */}
        <div className="form-control">
          <label className="label"><span className="label-text">{t('expense_desc')}</span></label>
          <input
            className="input input-bordered"
            placeholder={t('expense_desc_placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 金额 + 币种 */}
        <div className="flex gap-2">
          <div className="form-control flex-1">
            <label className="label"><span className="label-text">{t('expense_amount')}</span></label>
            <input
              className="input input-bordered font-mono"
              type="number"
              step="0.000001"
              min="0"
              placeholder={t('expense_amount_placeholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-control w-28">
            <label className="label"><span className="label-text">{t('expense_currency')}</span></label>
            <select
              className="select select-bordered"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
              <option value="SKR">SKR (Seeker)</option>
              <option value="MATIC">MATIC</option>
              <option value="BNB">BNB</option>
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        {/* 付款人 */}
        <div className="form-control">
          <label className="label"><span className="label-text">{t('expense_paid_by')}</span></label>
          <select
            className="select select-bordered"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {group.members.map((m) => (
              <option key={m.address} value={m.address}>
                {memberLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {/* 分摊给 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('expense_split_among')}</span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setSplitAmong(
                splitAmong.length === group.members.length ? [] : group.members.map((m) => m.address)
              )}
            >
              {t('expense_select_all')}
            </button>
          </label>
          <div className="flex flex-col gap-1">
            {group.members.map((m) => (
              <label key={m.address} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-base-200">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={splitAmong.includes(m.address)}
                  onChange={() => toggleMember(m.address)}
                />
                <span className="text-sm">{memberLabel(m)}</span>
                <span className="text-xs font-mono text-base-content/40 ml-auto">
                  {shortAddress(m.address)}
                </span>
              </label>
            ))}
          </div>
          {splitAmong.length > 0 && amount && (
            <p className="text-sm text-base-content/60 mt-2">
              Each: {(parseFloat(amount) / splitAmong.length).toFixed(6)} {currency}
            </p>
          )}
        </div>

        {/* 操作 */}
        <div className="flex gap-2 mt-4">
          <button className="btn btn-ghost flex-1" onClick={() => nav(`/group/${id}`)}>
            {t('cancel')}
          </button>
          <button className="btn btn-primary flex-1" onClick={handleSubmit}>
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
