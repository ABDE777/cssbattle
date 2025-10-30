import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import PasswordInput from "@/components/PasswordInput";

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [canResetPassword, setCanResetPassword] = useState<boolean | null>(null);

  // Check if we have a valid reset session when the page loads
  useEffect(() => {
    const checkResetSession = async () => {
      try {
        console.log("Checking for reset session...");
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setCanResetPassword(false);
          return;
        }
        
        console.log("Session data:", session);
        
        // Check if this is a password recovery session
        // Supabase sets the session automatically when the user clicks the email link
        if (session) {
          // Verify we can get the user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error("User error:", userError);
            setCanResetPassword(false);
            return;
          }
          
          console.log("User data:", user);
          setCanResetPassword(true);
        } else {
          setCanResetPassword(false);
        }
      } catch (err) {
        console.error("Session validation error:", err);
        setCanResetPassword(false);
      }
    };
    
    checkResetSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password) {
      setError("Please enter a new password");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess("Password updated successfully! Redirecting to login...");
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to update password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (canResetPassword === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battle-purple mx-auto mb-4"></div>
          <p className="text-foreground/80">Loading password reset...</p>
        </div>
      </div>
    );
  }

  // Show invalid link message
  if (canResetPassword === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Invalid Reset Link</h2>
            <p className="text-foreground/80 mb-6">
              This password reset link is invalid or has expired. Please request a new password reset from the admin dashboard.
            </p>
            <Button 
              onClick={() => navigate("/login")}
              className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            CSS <span className="bg-gradient-primary bg-clip-text text-transparent">BATTLE</span>
          </h1>
          <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
          <p className="text-foreground/70 mt-2">
            Enter your new password below
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-foreground text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password</Label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Enter new password"
              className="bg-background/50 border-battle-purple/30"
              disabled={loading}
            />
            <p className="text-sm text-foreground/70">Password must be at least 6 characters long</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Confirm new password"
              className="bg-background/50 border-battle-purple/30"
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/login")}
            className="text-battle-purple hover:text-battle-purple/80"
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PasswordReset;