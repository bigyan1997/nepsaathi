import useLanguageStore from "../store/languageStore";
import { translations } from "../i18n/translations";

export default function useT() {
  const { lang } = useLanguageStore();
  return (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;
}
