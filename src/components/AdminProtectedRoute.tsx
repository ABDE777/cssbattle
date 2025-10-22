import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
