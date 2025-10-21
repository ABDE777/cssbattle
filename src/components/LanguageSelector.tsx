import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
      title={language === "en" ? "Français" : "English"}
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">
        {language === "en" ? "Switch to French" : "Passer en anglais"}
      </span>
    </Button>
  );
};

export default LanguageSelector;
