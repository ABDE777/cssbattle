import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      toast({
        title: language === "en" ? "Email Sent" : "E-mail envoyé",
        description:
          language === "en"
            ? "Check your email for the password reset link"
            : "Vérifiez votre e-mail pour le lien de réinitialisation du mot de passe",
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        (err as Error).message ||
          (language === "en"
            ? "Failed to send reset email"
            : "Échec de l'envoi de l'e-mail de réinitialisation")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {language === "en" ? "Email Sent" : "E-mail envoyé"}
          </h2>
          <p className="text-foreground/80 mb-6">
            {language === "en"
              ? "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."
              : "Nous avons envoyé un lien de réinitialisation du mot de passe à votre adresse e-mail. Veuillez vérifier votre boîte de réception et suivre les instructions."}
          </p>
          <Button
            onClick={onBackToLogin}
            className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
          >
            {language === "en" ? "Back to Login" : "Retour à la connexion"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {language === "en" ? "Forgot Password" : "Mot de passe oublié"}
        </h2>
        <p className="text-foreground/80">
          {language === "en"
            ? "Enter your email to receive a password reset link"
            : "Entrez votre e-mail pour recevoir un lien de réinitialisation du mot de passe"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
          {error}
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToLogin}
            className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === "en" ? "Back" : "Retour"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow text-foreground"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {language === "en" ? "Sending..." : "Envoi en cours..."}
              </span>
            ) : language === "en" ? (
              "Send Reset Link"
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ForgotPasswordForm;