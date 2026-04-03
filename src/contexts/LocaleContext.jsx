import { createContext, useContext, useState, useCallback } from 'react';
import zh from '../locales/zh';
import en from '../locales/en';

const locales = { zh, en };
const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(
    () => localStorage.getItem('cryptosplit_lang') || 'zh'
  );

  const setLocale = useCallback((l) => {
    setLocaleState(l);
    localStorage.setItem('cryptosplit_lang', l);
  }, []);

  const t = useCallback(
    (key) => locales[locale]?.[key] ?? locales.zh[key] ?? key,
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be inside LocaleProvider');
  return ctx;
}
