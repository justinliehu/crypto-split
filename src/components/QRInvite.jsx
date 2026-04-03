import { QRCodeSVG } from 'qrcode.react';
import { useLocale } from '../contexts/LocaleContext';

export default function QRInvite({ group, onClose }) {
  const { t } = useLocale();

  // 生成邀请链接：包含群组ID，其他设备打开后可加入
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/join/${group.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert(t('invite_copied'));
    } catch {
      // fallback
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
    <div className="modal modal-open">
      <div className="modal-box text-center">
        <h3 className="font-bold text-lg mb-2">{t('invite_title')}</h3>
        <p className="text-sm text-base-content/60 mb-4">{group.name}</p>

        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={inviteUrl} size={200} level="H" />
          </div>
        </div>

        <p className="text-xs text-base-content/40 font-mono break-all mb-4">{inviteUrl}</p>

        <div className="flex gap-2 justify-center">
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {t('invite_copy')}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={share}>
            {t('invite_share')}
          </button>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
