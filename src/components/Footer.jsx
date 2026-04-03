import { Link } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="footer footer-center p-4 bg-base-200 text-base-content mt-auto">
      <div className="flex gap-4 text-sm">
        <Link to="/privacy" className="link link-hover">{t('footer_privacy')}</Link>
        <Link to="/terms" className="link link-hover">{t('footer_terms')}</Link>
        <span>&copy; {new Date().getFullYear()} CryptoSplit</span>
      </div>
    </footer>
  );
}
