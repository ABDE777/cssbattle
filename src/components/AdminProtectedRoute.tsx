import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  console.log('AdminProtectedRoute - isAdmin:', isAdmin, 'loading:', loading);

  useEffect(() => {
    console.log('AdminProtectedRoute useEffect - isAdmin:', isAdmin, 'loading:', loading);
    if (!loading && !isAdmin) {
      // If not loading anymore and not admin, redirect to login
      console.log('Redirecting to admin login');
      const timer = setTimeout(() => {
        navigate("/admin");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAdmin, loading, navigate]);

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('Showing loading spinner');
    return <LoadingSpinner message="Loading..." />;
  }

  // If not admin, redirect will happen in the effect above
  if (!isAdmin) {
    console.log('Not admin, returning null');
    return null;
  }

  console.log('Admin access granted, showing children');
  return <>{children}</>;
};

export default AdminProtectedRoute;
