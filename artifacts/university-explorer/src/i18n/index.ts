import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import tr from './locales/tr';
import fa from './locales/fa';
import ar from './locales/ar';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  fa: { translation: fa },
  ar: { translation: ar },
};

const savedLang = localStorage.getItem('uniturkey-lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
