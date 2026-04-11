import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../contexts/LocaleContext';

export default function QRScanner({ onResult, onClose }) {
  const { t } = useLocale();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    let detector = null;
    let animId = null;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        // Use BarcodeDetector if available, otherwise fall back to paste mode
        if ('BarcodeDetector' in window) {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
          const scan = async () => {
            if (cancelled) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0) {
                onResult(codes[0].rawValue);
                return;
              }
            } catch (_) {}
            animId = requestAnimationFrame(scan);
          };
          animId = requestAnimationFrame(scan);
        } else {
          // No BarcodeDetector — show camera preview but rely on paste
          setError('no_detector');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (animId) cancelAnimationFrame(animId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onResult]);

  const handlePaste = () => {
    const val = pasteValue.trim();
    if (val) onResult(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <button
        className="absolute top-4 right-4 btn btn-circle btn-ghost text-white text-2xl z-10"
        onClick={() => {
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          onClose();
        }}
      >
        ✕
      </button>

      {!pasteMode && (
        <>
          <video
            ref={videoRef}
            className="w-full max-w-md rounded-xl"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
          </div>
          {error === 'no_detector' && (
            <p className="text-white/60 text-sm mt-4 text-center px-4">
              {t('scan_no_detector') || 'Your browser does not support QR scanning. Please paste the invite link below.'}
            </p>
          )}
          {error && error !== 'no_detector' && (
            <p className="text-error text-sm mt-4 text-center px-4">{error}</p>
          )}
        </>
      )}

      <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-sm px-4">
        {!pasteMode ? (
          <button className="btn btn-outline btn-sm text-white" onClick={() => setPasteMode(true)}>
            {t('scan_paste_link') || 'Paste invite link instead'}
          </button>
        ) : (
          <>
            <input
              className="input input-bordered w-full"
              placeholder={t('scan_paste_placeholder') || 'Paste invite link here...'}
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 w-full">
              <button className="btn btn-ghost btn-sm flex-1" onClick={() => setPasteMode(false)}>
                {t('cancel')}
              </button>
              <button className="btn btn-primary btn-sm flex-1" onClick={handlePaste}>
                {t('confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
