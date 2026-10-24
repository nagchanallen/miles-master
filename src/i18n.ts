import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhHK from './locales/zh-HK.json';
import { LANGUAGES } from './domain/model';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja }, 'zh-HK': { translation: zhHK } },
  lng: 'ja',
  fallbackLng: 'en',
  supportedLngs: [...LANGUAGES],
  interpolation: { escapeValue: false }, // React escapes rendered text.
  initImmediate: false,
});
export default i18n;
