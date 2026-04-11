import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, getGroups, updateGroup } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

function parseInviteData(search) {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get('data');
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(atob(raw)));
  } catch {
    return null;
  }
}

function importGroupFromUrl(id, search) {
  const data = parseInviteData(search);
  if (!data || data.id !== id) return null;

  // Save directly to localStorage with the original ID
  const groups = JSON.parse(localStorage.getItem('cryptosplit_groups') || '[]');
  if (groups.some((g) => g.id === id)) return getGroup(id); // already exists

  const group = {
    id,
    name: data.name,
    members: data.members || [],
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || Date.now(),
  };
  groups.push(group);
  localStorage.setItem('cryptosplit_groups', JSON.stringify(groups));
  return group;
}

export default function JoinGroupPage() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const { address, isConnected } = useWallet();
  const { t } = useLocale();
  const [group, setGroup] = useState(null);
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let g = getGroup(id);
    if (!g) g = importGroupFromUrl(id, location.search);

    if (!g) {
      setStatus('not_found');
      return;
    }
    setGroup(g);

    if (address && g.members.some((m) => m.address?.toLowerCase() === address.toLowerCase())) {
      setStatus('already_in');
    } else {
      setStatus('ready');
    }
  }, [id, address, location.search]);

  const handleJoin = () => {
    if (!address || !group) return;
    const updatedMembers = [
      ...group.members,
      { address, nickname: nickname.trim() || shortAddress(address) },
    ];
    updateGroup(id, { members: updatedMembers });
    setStatus('joined');
    setTimeout(() => nav(`/group/${id}`), 1500);
  };

  if (status === 'loading') {
    return <div className="text-center py-16"><span className="loading loading-spinner" /></div>;
  }

  if (status === 'not_found') {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-base-content/60">{t('join_not_found')}</p>
        <button className="btn btn-primary btn-sm mt-4" onClick={() => nav('/')}>{t('back')}</button>
      </div>
    );
  }

  if (status === 'already_in') {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">👋</p>
        <p className="mb-4">{t('join_already_in')}</p>
        <button className="btn btn-primary btn-sm" onClick={() => nav(`/group/${id}`)}>{t('join_go_to_group')}</button>
      </div>
    );
  }

  if (status === 'joined') {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-success font-bold">{t('join_success')}</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔗</p>
        <p className="mb-2 font-bold">{group?.name}</p>
        <p className="text-base-content/60">{t('home_need_wallet')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center py-12">
      <p className="text-5xl mb-4">📨</p>
      <h2 className="text-xl font-bold mb-2">{t('join_title')}</h2>
      <p className="text-lg text-primary mb-6">{group.name}</p>

      <p className="text-sm text-base-content/60 mb-1">
        {t('group_members')}: {group.members.map((m) => m.nickname || shortAddress(m.address)).join(', ')}
      </p>

      <div className="form-control mt-6 mb-4">
        <input
          className="input input-bordered text-center"
          placeholder={t('join_nickname_placeholder')}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <button className="btn btn-primary w-full" onClick={handleJoin}>
        {t('join_confirm')}
      </button>
    </div>
  );
}
