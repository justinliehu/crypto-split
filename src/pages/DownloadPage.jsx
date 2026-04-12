import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';

const APK_URL = 'https://github.com/justinliehu/crypto-split/releases/latest/download/CryptoSplit.apk';

export default function DownloadPage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center text-center gap-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-6xl mb-4">📲</p>
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t('download_title')}
        </h1>
        <p className="mt-3 text-base-content/60 max-w-md mx-auto">
          {t('download_desc')}
        </p>
      </motion.div>

      <motion.a
        href={APK_URL}
        className="btn btn-primary btn-lg gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('download_apk')}
      </motion.a>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
        {[
          { icon: '🔒', key: 'download_feature1' },
          { icon: '⚡', key: 'download_feature2' },
          { icon: '📴', key: 'download_feature3' },
        ].map((f, i) => (
          <motion.div
            key={f.key}
            className="card bg-base-200 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <div className="card-body items-center text-center p-4">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-bold text-sm">{t(f.key + '_title')}</h3>
              <p className="text-xs text-base-content/50">{t(f.key + '_desc')}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-sm text-base-content/40 mt-4 space-y-1">
        <p>{t('download_hint')}</p>
      </div>
    </div>
  );
}
