import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LogoutButtonProps {
  variant?: "dropdown" | "form";
  className?: string;
}

const LogoutButton = ({
  variant = "form",
  className = "",
}: LogoutButtonProps) => {
  const { logout: userLogout } = useAuth();
  const { logout: adminLogout, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    console.log("Logout button clicked");
    try {
      if (isAdmin) {
        console.log("Logging out admin");
        await adminLogout();
        navigate("/admin");
      } else {
        console.log("Logging out user");
        await userLogout();
        navigate("/");
      }
      console.log("Logout completed");
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (variant === "dropdown") {
    return (
      <button
        onClick={handleLogout}
        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-red-500 focus:text-red-500 ${className}`}
      >
        <div className="flex items-center">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </div>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      className={`border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground ${className}`}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Log Out
    </Button>
  );
};

export default LogoutButton;
