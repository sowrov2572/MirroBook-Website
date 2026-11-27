import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'bn';

const LANG_STORAGE_KEY = 'mirrorbook_lang';

interface LanguageContextValue {
  lang: AppLanguage;
  isBn: boolean;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  t: (en: string, bn: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  isBn: false,
  setLang: () => {},
  toggleLang: () => {},
  t: (en) => en,
});

function readInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // ignore storage access issues
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(readInitialLanguage);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isBn: lang === 'bn',
      setLang,
      toggleLang: () => setLang(lang === 'en' ? 'bn' : 'en'),
      t: (en: string, bn: string) => (lang === 'bn' ? bn : en),
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
