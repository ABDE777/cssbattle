import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import ForgotPasswordForm from "@/components/ForgotPasswordForm"; // Add this import
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext"; // Add this import
import { useState, useEffect } from "react";
import { Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { isAdmin, logout: adminLogout } = useAdmin(); // Get admin context and logout function
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerificationMessage, setShowEmailVerificationMessage] =
    useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Add this state

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setShowEmailVerificationMessage(false);

    try {
      // If admin is currently logged in, log them out first
      if (isAdmin) {
        console.log("Logging out admin session before player login");
        await adminLogout();
        toast({
          title: language === "en" ? "Session Switched" : "Session changée",
          description:
            language === "en"
              ? "You have been logged out as admin. Logging in as player..."
              : "Vous avez été déconnecté en tant qu'administrateur. Connexion en tant que joueur...",
        });
      }

      console.log("Login - Attempting login with:", formData.email);
      const result = await login(formData.email, formData.password);
      console.log("Login - Result:", result);

      if (result.success) {
        console.log("Login successful!");
        // Show success message
        toast({
          title: language === "en" ? "Success" : "Succès",
          description:
            language === "en"
              ? "You have been logged in successfully!"
              : "Vous vous êtes connecté avec succès !",
        });
        // Redirect to home page after successful login
        navigate("/");
      } else {
        if (result.emailVerified === false) {
          setShowEmailVerificationMessage(true);
        } else {
          setError(
            result.error ||
              (language === "en" ? "Login failed" : "Échec de la connexion")
          );
        }
      }
    } catch (err) {
      console.error("Login - Unexpected error:", err);
      setError(
        language === "en"
          ? "An unexpected error occurred"
          : "Une erreur inattendue s'est produite"
      );
      toast({
        title: language === "en" ? "Error" : "Erreur",
        description:
          language === "en"
            ? "An unexpected error occurred during login"
            : "Une erreur inattendue s'est produite lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show forgot password form instead of login form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8 pt-16">
            {" "}
            {/* Added pt-16 to account for fixed navbar */}
            <h1 className="text-2xl font-bold text-center text-foreground">
              CSS{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                BATTLE
              </span>
            </h1>
          </div>
          <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8 pt-16">
          {" "}
          {/* Added pt-16 to account for fixed navbar */}
          <h1 className="text-2xl font-bold text-center text-foreground">
            CSS{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>
          </h1>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {language === "en" ? "Log In" : "Connexion"}
            </h2>
            <p className="text-foreground/80">
              {language === "en"
                ? "Access your account"
                : "Accédez à votre compte"}
            </p>
          </div>

          {showEmailVerificationMessage && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-200 font-medium">
                  {language === "en"
                    ? "Email Verification Required"
                    : "Vérification de l'e-mail requise"}
                </span>
              </div>
              <p className="text-sm text-yellow-200 mt-2">
                {language === "en"
                  ? "Please check your email and click the verification link before logging in."
                  : "Veuillez vérifier votre e-mail et cliquer sur le lien de vérification avant de vous connecter."}
              </p>
            </div>
          )}

          {error && !showEmailVerificationMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
              {language === "en" ? "Error:" : "Erreur :"} {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                {language === "en" ? "Email" : "E-mail"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={
                    language === "en"
                      ? "Enter your email"
                      : "Entrez votre e-mail"
                  }
                  className="pl-10 bg-background/50 border-battle-purple/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                {language === "en" ? "Password" : "Mot de passe"}
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={
                  language === "en"
                    ? "Enter your password"
                    : "Entrez votre mot de passe"
                }
                className="bg-background/50 border-battle-purple/30"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                onClick={() =>
                  window.open("https://css-battle-isfo.vercel.app/", "_blank")
                }
                className="px-0 text-battle-purple hover:text-battle-pink"
              >
                {language === "en"
                  ? "Don't have an account? Register"
                  : "Pas de compte ? Inscrivez-vous"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)} // Change this to show forgot password form
                className="px-0 text-battle-purple hover:text-battle-pink"
              >
                {language === "en"
                  ? "Forgot Password?"
                  : "Mot de passe oublié ?"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow text-foreground"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {language === "en"
                      ? "Logging in..."
                      : "Connexion en cours..."}
                  </span>
                ) : language === "en" ? (
                  "Log In"
                ) : (
                  "Se connecter"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;