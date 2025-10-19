import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { translations, type Language } from '../locales';

// 1. التعريفات (TYPES)
// -----------------------------------------------------------------------------

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// 2. إنشاء الـ CONTEXT
// -----------------------------------------------------------------------------

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 3. مكوّن الـ PROVIDER
// -----------------------------------------------------------------------------

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: userProfile } = useUserProfile();

  // الحالة الأولية: جلبها من التخزين المحلي (localStorage)
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage && (translations as any)[savedLanguage]) {
      return savedLanguage as Language;
    }
    return 'en'; // القيمة الافتراضية
  });

  // دالة الترجمة (t) - مُحسّنة باستخدام useCallback
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const langTranslations = (translations as any)[language];

    // إرجاع الترجمة إن وجدت، وإلا يتم إرجاع المفتاح نفسه
    let translation = langTranslations ? langTranslations[key] : key;

    // استبدال المتغيرات مثل {amount} أو {country}
    if (params && translation) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return translation || key;
  }, [language]);

  // تأثير جانبي لحفظ اللغة وتحديث سمات HTML
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language;
  }, [language]);

  // تأثير جانبي لمزامنة اللغة مع بيانات المستخدم
  useEffect(() => {
    if (userProfile?.preferredLanguage && (translations as any)[userProfile.preferredLanguage]) {
        if (userProfile.preferredLanguage !== language) {
            setLanguage(userProfile.preferredLanguage as Language);
        }
    }
  }, [userProfile, language]);


  // قيمة الـ Context - مُحسّنة باستخدام useMemo
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// 4. الهوك المُخصص (CUSTOM HOOK)
// -----------------------------------------------------------------------------

/**
 * الهوك الذي يوفر الوصول إلى الـ LanguageContext
 * ويسمح للمكونات باستهلاك الـ Context بسهولة.
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    // هذا الشرط يضمن أن الهوك يُستخدم داخل الـ LanguageProvider
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
