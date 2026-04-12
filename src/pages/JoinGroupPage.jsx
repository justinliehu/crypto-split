import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroup, updateGroup } from '../utils/storage';
import { shortAddress } from '../utils/wallet';

// Decode compact format: id|name|createdBy|addr1:nick1,addr2:nick2
function decodeInvite(encoded) {
  try {
    // Restore URL-safe base64: -→+ _→/ add padding
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = decodeURIComponent(escape(atob(b64)));
    const [id, name, createdBy, membersStr] = payload.split('|');
    const members = membersStr
      ? membersStr.split(',').map((m) => {
          const [address, nickname] = m.split(':');
          return { address: address || '', nickname: nickname || '' };
        })
      : [];
    return { id, name, members, createdBy, createdAt: Date.now() };
  } catch {
    return null;
  }
}

function saveGroupToLocal(data) {
  const groups = JSON.parse(localStorage.getItem('cryptosplit_groups') || '[]');
  if (groups.some((g) => g.id === data.id)) return getGroup(data.id);

  const group = {
    id: data.id,
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
    let cancelled = false;

    async function load() {
      // 1. Check local storage first
      let g = getGroup(id);

      // 2. Try URL ?d= param (compact encoded data from QR)
      if (!g) {
        const params = new URLSearchParams(location.search);
        const d = params.get('d');
        if (d) {
          const data = decodeInvite(d);
          if (data && data.id === id) {
            g = saveGroupToLocal(data);
          }
        }
      }

      // 3. Try server invite API
      if (!g) {
        try {
          const res = await fetch(`${window.location.origin}/api/invite/${id}`);
          if (res.ok) {
            const data = await res.json();
            g = saveGroupToLocal(data);
          }
        } catch (_) {}
      }

      if (cancelled) return;

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
    }

    load();
    return () => { cancelled = true; };
  }, [id, address, location.search]);

  const handleJoin = async () => {
    if (!address || !group) return;
    const updatedMembers = [
      ...group.members,
      { address, nickname: nickname.trim() || shortAddress(address) },
    ];
    updateGroup(id, { members: updatedMembers });

    // Sync to server — use group data directly to avoid null issues
    try {
      await fetch(`${window.location.origin}/api/sync/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: group.name,
          createdBy: group.createdBy || '',
          members: updatedMembers,
          expenses: [],
        }),
      });
    } catch (_) {}

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
