import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const PlayerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user || isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default PlayerProtectedRoute;
