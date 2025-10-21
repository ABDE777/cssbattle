import { useLanguage } from "@/contexts/LanguageContext";

// This hook provides a simple way to access translations
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};