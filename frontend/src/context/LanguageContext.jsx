import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('awaaz_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('awaaz_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key) => {
    const keys = key.split('.');
    let current = translations[lang] || translations['en'];
    let fallback = translations['en'];

    for (let i = 0; i < keys.length; i++) {
      if (current && current[keys[i]] !== undefined) {
        current = current[keys[i]];
      } else {
        current = undefined;
      }
      
      if (fallback && fallback[keys[i]] !== undefined) {
          fallback = fallback[keys[i]];
      } else {
          fallback = undefined;
      }
    }
    if (current !== undefined) return current;
    if (fallback !== undefined) return fallback;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
