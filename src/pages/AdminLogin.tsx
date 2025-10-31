import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { safeLocalStorage } from "@/lib/storage";

interface Admin {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, admin, logout: adminLogout } = useAdmin();
  const { user, logout: playerLogout } = useAuth();

  const [adminUsers, setAdminUsers] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Fetch admins from database
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from("admins")
          .select("id, name, email")
          .order("name");

        if (error) throw error;

        setAdminUsers(data || []);
      } catch (err) {
        console.error("Error fetching admins:", err);
        toast({
          title: "Error",
          description: "Failed to load admin list",
          variant: "destructive",
        });
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, [toast]);

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
    const storedAdmin = localStorage.getItem("admin_session");
    console.log("Found storedAdmin:", storedAdmin);
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        console.log("Parsed adminData:", adminData);
        if (adminData && adminData.email) {
          console.log("Admin data found, redirecting to dashboard");
          navigate("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error parsing admin data:", error);
        localStorage.removeItem("admin_session");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (user) {
        console.log("Logging out player session before admin login");
        await playerLogout();
        toast({
          title: "Session Switched",
          description:
            "You have been logged out as player. Logging in as admin...",
        });
      }

      // Check if email is in our admin list
      const validAdmin = adminUsers.find((admin) => admin.email === email);
      if (!validAdmin) {
        throw new Error("Invalid admin email");
      }

      // Check password against the database
      // Note: In this implementation, passwords are stored as plain text for simplicity
      // In production, they should be hashed
      const { data: adminData, error: authError } = await supabase
        .from("admins")
        .select("id, email, password_hash")
        .eq("email", email)
        .maybeSingle();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!adminData) {
        throw new Error("Admin not found");
      }

      // Check if password matches
      // Note: This is a simple comparison for plain text passwords
      // In production, you would use a proper password hashing library
      if (adminData.password_hash !== password) {
        throw new Error("Invalid password");
      }

      // Store admin session in localStorage
      const adminSession = {
        id: adminData.id,
        email: adminData.email,
        // Add other relevant admin data here if needed
      };

      safeLocalStorage.setItem("admin_session", JSON.stringify(adminSession));

      // Dispatch storage event to notify AdminContext of the change
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "admin_session",
          newValue: JSON.stringify(adminSession),
          storageArea: localStorage,
        })
      );

      toast({
        title: "Success",
        description: "You have been logged in as admin successfully!",
      });

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      const errorMessage = (err as Error).message || "Login failed";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-background py-4 px-4 sm:px-6 flex items-center justify-center overflow-hidden">
      <div className="max-w-md w-full">
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-foreground hover:bg-white h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Admin Login</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-foreground text-sm">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-battle-purple/30 bg-background/50 px-2.5 py-1 pl-8 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
                  required
                  aria-label="Select admin"
                  disabled={loadingAdmins}
                >
                  <option value="">
                    {loadingAdmins ? "Loading admins..." : "Select an admin..."}
                  </option>
                  {adminUsers.map((admin) => (
                    <option key={admin.email} value={admin.email}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-background/50 border-battle-purple/30 h-8 text-xs px-2.5 py-1"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center py-1">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-primary hover:scale-[1.02] transition-transform shadow-glow text-foreground h-8 text-xs"
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
