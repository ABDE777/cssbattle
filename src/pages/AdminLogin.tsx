import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Add this import
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, admin, logout: adminLogout } = useAdmin();
  const { user, logout: playerLogout } = useAuth(); // Get player context and logout function
  const adminEmails = [
    "ibrahimchallal@admincss.com",
    "younesshlibi@admincss.com",
    "hamdiboumlik@admincss.com",
    "mazgouraabdalmonim@admincss.com",
  ];
  const adminPassword = "passwordPro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("AdminLogin - isAdmin:", isAdmin, "admin:", admin);
    // Redirect if already logged in as admin
    if (isAdmin && admin) {
      console.log("Already logged in, redirecting to dashboard");
      navigate("/admin/dashboard");
    }
  }, [isAdmin, admin, navigate]);

  // Also check localStorage directly on component mount
  useEffect(() => {
    console.log("Checking localStorage for admin data");
    const hardcodedAdmin = localStorage.getItem("hardcoded_admin");
    console.log("Found hardcodedAdmin:", hardcodedAdmin);
    if (hardcodedAdmin) {
      try {
        const adminData = JSON.parse(hardcodedAdmin);
        console.log("Parsed adminData:", adminData);
        if (adminData && adminData.email) {
          // Already logged in, redirect to dashboard
          console.log("Admin data found, redirecting to dashboard");
          navigate("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error parsing admin data:", error);
        localStorage.removeItem("hardcoded_admin");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If player is currently logged in, log them out first
      if (user) {
        console.log("Logging out player session before admin login");
        await playerLogout();
        toast({
          title: "Session Switched",
          description:
            "You have been logged out as player. Logging in as admin...",
        });
      }

      // Check hardcoded admin credentials
      if (!adminEmails.includes(email)) {
        throw new Error("Invalid admin email");
      }

      if (password !== adminPassword) {
        throw new Error("Invalid password");
      }

      // Try to find a real admin user ID from the database
      let adminUserId = "00000000-0000-0000-0000-000000000000"; // Default placeholder
      let foundRealAdmin = false;

      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1);

        if (!adminError && adminUsers && adminUsers.length > 0) {
          adminUserId = adminUsers[0].user_id;
          foundRealAdmin = true;
          console.log("Found real admin user ID:", adminUserId);
        } else {
          console.log("No real admin users found, using placeholder UUID");
        }
      } catch (dbError) {
        console.warn("Could not fetch admin user ID from database:", dbError);
      }

      // Store admin session in localStorage with proper UUID
      const adminData = {
        id: adminUserId,
        email: email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("hardcoded_admin", JSON.stringify(adminData));

      // Manually dispatch storage event for the same tab
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "hardcoded_admin",
          newValue: JSON.stringify(adminData),
          url: window.location.href,
        })
      );

      toast({
        title: "Success",
        description: foundRealAdmin
          ? "Logged in successfully as admin"
          : "Logged in successfully (limited functionality mode)",
      });

      // Small delay to ensure context is updated before navigation
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 100);
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message || "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Admin
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Admin Login
            </h2>
            <p className="text-foreground/80">Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-battle-purple/30 bg-background/50 px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  aria-label="Select admin email"
                >
                  <option value="">Select admin email...</option>
                  {adminEmails.map((adminEmail) => (
                    <option key={adminEmail} value={adminEmail}>
                      {adminEmail}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
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
                {isSubmitting ? "Logging in..." : "Login as Admin"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
