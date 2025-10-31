import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-background border-t border-battle-purple/20 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-foreground/80 text-sm text-center">
              © {new Date().getFullYear()} CSS Battle Championship.{" "}
              {language === "en"
                ? "All rights reserved."
                : "Tous droits réservés."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
