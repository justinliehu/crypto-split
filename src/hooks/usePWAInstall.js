import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const ua = window.navigator.userAgent;
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (ua.includes('Android') && window.navigator.standalone === true) ||
        (ua.includes('iPhone') && window.navigator.standalone === true);
      setIsStandalone(!!standalone);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const onBeforeInstall = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => { setInstallEvent(null); setIsStandalone(true); };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    try {
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') setInstallEvent(null);
    } catch (_) {}
  };

  return { installable: !!installEvent, promptInstall, isStandalone };
}
