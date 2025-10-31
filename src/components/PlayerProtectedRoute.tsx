import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const PlayerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setChecking(false);
      // Allow access if user is a player (not admin)
      if (!user || isAdmin) {
        navigate("/");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isAdmin, navigate]);

  if (checking) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Allow access only if user is authenticated and not an admin
  if (!user || isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default PlayerProtectedRoute;
