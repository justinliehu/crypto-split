import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';

const features = [
  { key: 'home_feature1', emoji: '🔐' },
  { key: 'home_feature2', emoji: '🧮' },
  { key: 'home_feature3', emoji: '⛓️' },
];

export default function HomePage() {
  const { isConnected } = useWallet();
  const { t } = useLocale();
  const nav = useNavigate();

  return (
    <div className="flex flex-col items-center text-center gap-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
          {t('home_hero')}
        </h1>
        <p className="mt-4 text-lg text-base-content/70 max-w-md mx-auto">
          {t('home_subtitle')}
        </p>
      </motion.div>

      <motion.button
        className="btn btn-primary btn-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!isConnected) return alert(t('home_need_wallet'));
          nav('/groups');
        }}
      >
        {t('home_cta')}
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
        {features.map((f, i) => (
          <motion.div
            key={f.key}
            className="card bg-base-200 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
          >
            <div className="card-body items-center text-center">
              <span className="text-4xl">{f.emoji}</span>
              <h3 className="card-title text-base">{t(f.key + '_title')}</h3>
              <p className="text-sm text-base-content/60">{t(f.key + '_desc')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
