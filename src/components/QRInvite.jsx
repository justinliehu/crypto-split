import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocale } from '../contexts/LocaleContext';

// Compact encode: id|name|createdBy|addr1:nick1,addr2:nick2
function encodeInvite(group) {
  const members = group.members
    .map((m) => `${m.address || ''}:${m.nickname || ''}`)
    .join(',');
  const payload = [group.id, group.name, group.createdBy || '', members].join('|');
  return btoa(unescape(encodeURIComponent(payload)));
}

export default function QRInvite({ group, onClose }) {
  const { t } = useLocale();

  const base = `${window.location.origin}${window.location.pathname}#/join/${group.id}`;
  const encoded = encodeInvite(group);
  const inviteUrl = `${base}?d=${encoded}`;

  // Also upload to server as backup (cross-device without QR)
  useEffect(() => {
    fetch(`${window.location.origin}/api/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: group.id,
        name: group.name,
        members: group.members,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
      }),
    }).catch(() => {});
  }, [group]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert(t('invite_copied'));
    } catch {
      const input = document.createElement('input');
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert(t('invite_copied'));
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('invite_join')} ${group.name}`,
          text: t('invite_text').replace('{name}', group.name),
          url: inviteUrl,
        });
      } catch (_) {}
    } else {
      copyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-base-200 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl text-center">
        <h3 className="font-bold text-lg mb-2">{t('invite_title')}</h3>
        <p className="text-sm text-base-content/60 mb-4">{group.name}</p>

        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={inviteUrl} size={260} level="L" />
          </div>
        </div>

        <p className="text-xs text-base-content/40 font-mono break-all mb-4">{base}</p>

        <div className="flex gap-2 justify-center">
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {t('invite_copy')}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={share}>
            {t('invite_share')}
          </button>
        </div>

        <div className="flex justify-end mt-4">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}
