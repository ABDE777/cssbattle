import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Translation dictionary
const translations = {
  en: {
    // Navbar
    "navbar.home": "Home",
    "navbar.leaderboard": "Leaderboard",
    "navbar.learning": "Learning",
    "navbar.resources": "Resources",
    "navbar.contact": "Contact",
    "navbar.dashboard": "Dashboard",
    "navbar.messages": "Messages",
    "navbar.manageLearning": "Manage Learning",
    "navbar.logout": "Logout",
    "navbar.login": "Log in",
    "navbar.register": "To request participation",
    "navbar.institute": "Specialized Training Institute for Offshoring",

    // Learning Center
    "learning.title": "Learning Center",
    "learning.subtitle":
      "Master CSS Battle with our tutorials, quizzes, and learning resources",
    "learning.video.title": "Video Tutorial",
    "learning.quiz.title": "Knowledge Check",
    "learning.quiz.videoRequired": "Video Required",
    "learning.quiz.videoRequiredDesc":
      "Please complete the video tutorial first to unlock the quiz.",
    "learning.quiz.watchVideo": "Watch Video",
    "learning.quiz.completed": "Quiz Completed!",
    "learning.quiz.score": "You scored {score}/{total}",
    "learning.quiz.completedMessage":
      "Congratulations! You have successfully completed the quiz. This section will remain hidden even after you log out.",
    "learning.quiz.question": "Question {current} of {total}",
    "learning.quiz.submit": "Submit Answer",
    "learning.quiz.next": "Next Question",
    "learning.quiz.select": "Please select an answer",
    "learning.quiz.selectDesc":
      "You need to choose an option before submitting.",
    "learning.quiz.correct": "Correct!",
    "learning.quiz.incorrect": "Incorrect",
    "learning.resources.title": "Learning Resources",
    "learning.resources.add": "Add Resource",
    "learning.resources.accessDenied": "Access Denied",
    "learning.resources.accessDeniedDesc":
      "Only administrators can upload resources.",
    "learning.resources.missingInfo": "Missing Information",
    "learning.resources.missingInfoDesc":
      "Please fill in all required fields for the resource.",
    "learning.resources.missingFile": "Missing File or URL",
    "learning.resources.missingFileDesc":
      "Please either select a file or provide a URL.",
    "learning.resources.added": "Resource Added!",
    "learning.resources.addedDesc":
      "Your learning resource has been added successfully.",
    "learning.resources.adminOnly":
      "Only administrators can add new learning resources.",
    "learning.resources.playerInfo":
      "Players can only view and download existing resources.",
    "learning.resources.form.title": "Add New Resource",
    "learning.resources.form.titleLabel": "Title *",
    "learning.resources.form.typeLabel": "Resource Type",
    "learning.resources.form.descLabel": "Description *",
    "learning.resources.form.fileLabel": "Upload File (Optional)",
    "learning.resources.form.urlLabel": "URL (Required if no file uploaded)",
    "learning.video.completed": "Video Completed!",
    "learning.video.completedDesc":
      "You've finished watching the tutorial. Now try the quiz!",
    "learning.video.notCompleted": "Not completed",
    "learning.video.reset": "Reset",
    "learning.video.restricted": "Navigation Restricted",
    "learning.video.restrictedDesc":
      "You can only navigate to parts of the video you've already watched.",
    "learning.video.fullscreenError": "Fullscreen Error",
    "learning.video.fullscreenErrorDesc": "Could not enter fullscreen mode.",
    "learning.video.fullscreenExitErrorDesc": "Could not exit fullscreen mode.",
    "learning.video.screenshotRestricted": "Action Restricted",
    "learning.video.screenshotRestrictedDesc":
      "Screenshots are not allowed during learning.",
    "learning.video.copyRestrictedDesc":
      "Copy/paste actions are not allowed during learning.",

    // Resources
    "resources.title": "Learning Resources",
    "resources.subtitle": "Access all learning materials and resources",
    "resources.allResources": "All Resources",
    "resources.none": "No Resources Available",
    "resources.noneDesc":
      "There are currently no learning resources available. Please check back later.",
    "resources.downloadFile": "Download File",
    "resources.visitLink": "Visit Link",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.download": "Download",
    "common.upload": "Upload",
    "common.reset": "Reset",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.finish": "Finish",
    "common.start": "Start",
    "common.continue": "Continue",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
  },
  fr: {
    // Navbar
    "navbar.home": "Accueil",
    "navbar.leaderboard": "Classement",
    "navbar.learning": "Apprentissage",
    "navbar.resources": "Ressources",
    "navbar.contact": "Contact",
    "navbar.dashboard": "Tableau de bord",
    "navbar.messages": "Messages",
    "navbar.manageLearning": "Gérer l'Apprentissage",
    "navbar.logout": "Déconnexion",
    "navbar.login": "Connexion",
    "navbar.register": "Envoyer demande de participation",
    "navbar.institute": "Institut Spécialisé de Formation de l'Offshoring",

    // Profile - Verification Message
    "profile.notVerified.title": "Profile Not Verified",
    "profile.notVerified.message":
      "Your profile is currently not verified, which means you won't appear in the leaderboard.",
    "profile.notVerified.instructions": "To get verified:",
    "profile.notVerified.step1":
      'Go to your CSSBattle profile by clicking the "View Profile" link below',
    "profile.notVerified.step2":
      'Click the "Edit Profile" button on your CSSBattle profile',
    "profile.notVerified.step3":
      'In your bio section, write the word "ofppt" (without quotes)',
    "profile.notVerified.step4": 'Click "Save" to update your profile',
    "profile.notVerified.step5":
      "Wait 15 minutes for the verification to process",

    // Learning Center
    "learning.title": "Centre d'Apprentissage",
    "learning.subtitle":
      "Maîtrisez CSS Battle avec nos tutoriels, quiz et ressources d'apprentissage",
    "learning.video.title": "Tutoriel Vidéo",
    "learning.quiz.title": "Vérification des Connaissances",
    "learning.quiz.videoRequired": "Vidéo Requise",
    "learning.quiz.videoRequiredDesc":
      "Veuillez d'abord terminer le tutoriel vidéo pour débloquer le quiz.",
    "learning.quiz.watchVideo": "Regarder la Vidéo",
    "learning.quiz.completed": "Quiz Terminé !",
    "learning.quiz.score": "Vous avez obtenu {score}/{total}",
    "learning.quiz.completedMessage":
      "Félicitations ! Vous avez terminé avec succès le quiz. Cette section restera masquée même après votre déconnexion.",
    "learning.quiz.question": "Question {current} sur {total}",
    "learning.quiz.submit": "Soumettre la Réponse",
    "learning.quiz.next": "Question Suivante",
    "learning.quiz.select": "Veuillez sélectionner une réponse",
    "learning.quiz.selectDesc":
      "Vous devez choisir une option avant de soumettre.",
    "learning.quiz.correct": "Correct !",
    "learning.quiz.incorrect": "Incorrect",
    "learning.resources.title": "Ressources d'Apprentissage",
    "learning.resources.add": "Ajouter une Ressource",
    "learning.resources.accessDenied": "Accès Refusé",
    "learning.resources.accessDeniedDesc":
      "Seuls les administrateurs peuvent télécharger des ressources.",
    "learning.resources.missingInfo": "Informations Manquantes",
    "learning.resources.missingInfoDesc":
      "Veuillez remplir tous les champs obligatoires pour la ressource.",
    "learning.resources.missingFile": "Fichier ou URL Manquant",
    "learning.resources.missingFileDesc":
      "Veuillez sélectionner un fichier ou fournir une URL.",
    "learning.resources.added": "Ressource Ajoutée !",
    "learning.resources.addedDesc":
      "Votre ressource d'apprentissage a été ajoutée avec succès.",
    "learning.resources.adminOnly":
      "Seuls les administrateurs peuvent ajouter de nouvelles ressources d'apprentissage.",
    "learning.resources.playerInfo":
      "Les joueurs ne peuvent que visualiser et télécharger les ressources existantes.",
    "learning.resources.form.title": "Ajouter une Nouvelle Ressource",
    "learning.resources.form.titleLabel": "Titre *",
    "learning.resources.form.typeLabel": "Type de Ressource",
    "learning.resources.form.descLabel": "Description *",
    "learning.resources.form.fileLabel": "Télécharger un Fichier (Optionnel)",
    "learning.resources.form.urlLabel":
      "URL (Requise si aucun fichier téléchargé)",
    "learning.video.completed": "Vidéo Terminée !",
    "learning.video.completedDesc":
      "Vous avez terminé de regarder le tutoriel. Maintenant, essayez le quiz !",
    "learning.video.notCompleted": "Non terminé",
    "learning.video.reset": "Réinitialiser",
    "learning.video.restricted": "Navigation Restreinte",
    "learning.video.restrictedDesc":
      "Vous ne pouvez naviguer que vers les parties de la vidéo que vous avez déjà regardées.",
    "learning.video.fullscreenError": "Erreur Plein Écran",
    "learning.video.fullscreenErrorDesc":
      "Impossible d'entrer en mode plein écran.",
    "learning.video.fullscreenExitErrorDesc":
      "Impossible de quitter le mode plein écran.",
    "learning.video.screenshotRestricted": "Action Restreinte",
    "learning.video.screenshotRestrictedDesc":
      "Les captures d'écran ne sont pas autorisées pendant l'apprentissage.",
    "learning.video.copyRestrictedDesc":
      "Les actions de copier/coller ne sont pas autorisées pendant l'apprentissage.",

    // Resources
    "resources.title": "Ressources d'Apprentissage",
    "resources.subtitle":
      "Accédez à tous les documents et ressources d'apprentissage",
    "resources.allResources": "Toutes les Ressources",
    "resources.none": "Aucune Ressource Disponible",
    "resources.noneDesc":
      "Il n'y a actuellement aucune ressource d'apprentissage disponible. Veuillez revenir plus tard.",
    "resources.downloadFile": "Télécharger le Fichier",
    "resources.visitLink": "Visiter le Lien",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.cancel": "Annuler",
    "common.save": "Sauvegarder",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.view": "Voir",
    "common.download": "Télécharger",
    "common.upload": "Télécharger",
    "common.reset": "Réinitialiser",
    "common.retry": "Réessayer",
    "common.close": "Fermer",
    "common.back": "Retour",
    "common.next": "Suivant",
    "common.previous": "Précédent",
    "common.finish": "Terminer",
    "common.start": "Commencer",
    "common.continue": "Continuer",
    "common.confirm": "Confirmer",
    "common.yes": "Oui",
    "common.no": "Non",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language");
    return (savedLanguage as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation =
      translations[language][key] || translations["en"][key] || key;

    // Handle dynamic values like {score} in translations
    if (translation.includes("{")) {
      return translation;
    }

    return translation;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
