import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../i18n/translations.js';

interface AchievementLike {
  display_name?: string;
  description?: string;
  display_name_es?: string;
  description_es?: string;
  displayName?: string;
  displayName_es?: string;
  localizations?: {
    en?: { displayName?: string; description?: string };
    es?: { displayName?: string; description?: string };
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getAchievementText: (ach: AchievementLike) => { title: string; description: string };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omni_language') as Language;
      if (saved === 'en' || saved === 'es') return saved;
      if (navigator.language && navigator.language.toLowerCase().startsWith('es')) {
        return 'es';
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('omni_language', lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  /**
   * Translate a dot-separated key (e.g. 'library.title', 'common.save')
   * with fallback to English and parameter interpolation (e.g. '{count}')
   */
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    // Fallback to English if key missing in current language
    if (current === undefined) {
      let fallbackCurrent: any = translations.en;
      for (const k of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && k in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[k];
        } else {
          fallbackCurrent = undefined;
          break;
        }
      }
      current = fallbackCurrent !== undefined ? fallbackCurrent : path;
    }

    if (typeof current !== 'string' || current === path) {
      if (params && typeof params.defaultValue === 'string') {
        return params.defaultValue;
      }
      return typeof current === 'string' ? current : path;
    }

    let result = current;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }

    return result;
  };

  /**
   * Helper that chooses the right localization for achievements
   */
  const getAchievementText = (ach: AchievementLike): { title: string; description: string } => {
    if (!ach) return { title: '', description: '' };

    const enTitle = ach.displayName || ach.display_name || ach.localizations?.en?.displayName || '';
    const enDesc = ach.description || ach.localizations?.en?.description || '';

    if (language === 'es') {
      const esTitle = ach.displayName_es || ach.display_name_es || ach.localizations?.es?.displayName;
      const esDesc = ach.description_es || ach.description_es || ach.localizations?.es?.description;

      return {
        title: esTitle && esTitle.trim() ? esTitle : enTitle,
        description: esDesc && esDesc.trim() ? esDesc : enDesc
      };
    }

    return {
      title: enTitle,
      description: enDesc
    };
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, getAchievementText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
