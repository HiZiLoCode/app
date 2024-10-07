import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './loacles/zh.json'
import en from './loacles/en.json'
// import de from './loacles/de.json'
export const resources = {
  en,
  zh,
};
// Custom missing key handler
const handleMissingKey = (lng: string, namespace: string, key: string, fallbackValue: string) => {
  // If fallbackValue is undefined, return the key itself
  return fallbackValue || key;
}
(i18n as any)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    returnNull:false,
    returnEmptyString:false,
    lng: "zh", 
    fallbackLng:'en',
    interpolation: {
      escapeValue: false
    },
    missingKeyHandler: handleMissingKey,
  });

  export default i18n;