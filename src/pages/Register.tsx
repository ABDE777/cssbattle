import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { User, Mail, Link, ArrowLeft, Lock } from "lucide-react";
import { GROUP_OPTIONS, DEV_GROUPS, ID_GROUPS } from "@/constants/groups";

const Register = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cssBattleProfileLink: "",
    password: "",
    group: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresEmailVerification, setRequiresEmailVerification] =
    useState(false);

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

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.group
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        cssLink: formData.cssBattleProfileLink,
        password: formData.password,
        group: formData.group,
        phone: undefined,
      });

      if (result.success) {
        if (result.requiresEmailVerification) {
          setRequiresEmailVerification(true);
        } else {
          // Redirect to home page after successful registration
          navigate("/");
        }
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requiresEmailVerification) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-center flex-1 text-foreground">
              CSS{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                BATTLE
              </span>{" "}
              Championship
            </h1>
            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Check Your Email
              </h2>
              <p className="text-foreground/80 mb-6">
                We've sent a verification email to{" "}
                <span className="font-semibold">{formData.email}</span>. Please
                check your inbox and click the verification link to complete
                your registration.
              </p>
              <div className="bg-background/50 border border-battle-purple/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground/70">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setRequiresEmailVerification(false)}
                    className="text-battle-purple hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-center flex-1 text-foreground">
            CSS{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>{" "}
            Championship
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Player Registration
            </h2>
            <p className="text-foreground/80">
              Join the CSS Battle Championship today
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="pl-10 bg-background/50 border-battle-purple/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="pl-10 bg-background/50 border-battle-purple/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cssBattleProfileLink" className="text-foreground">
                CSSBattle Profile Link
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  id="cssBattleProfileLink"
                  name="cssBattleProfileLink"
                  value={formData.cssBattleProfileLink}
                  onChange={handleInputChange}
                  placeholder="https://cssbattle.dev/player/..."
                  className="pl-10 bg-background/50 border-battle-purple/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group" className="text-foreground">
                Player Group *
              </Label>
              <Select
                value={formData.group}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, group: value }))
                }
              >
                <SelectTrigger className="bg-background/50 border-battle-purple/30">
                  <SelectValue placeholder="Select your group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>DEV Groups</SelectLabel>
                    {DEV_GROUPS.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>ID Groups</SelectLabel>
                    {ID_GROUPS.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className="bg-background/50 border-battle-purple/30"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow text-foreground"
              >
                {isSubmitting ? "Submitting..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
