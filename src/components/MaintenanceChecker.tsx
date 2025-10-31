import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/contexts/AdminContext";
import MaintenanceMode from "@/pages/MaintenanceMode";

const MaintenanceChecker = ({ children }: { children: React.ReactNode }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("maintenance_mode")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setMaintenanceMode(data.maintenance_mode);
      }
      setLoading(false);
    };

    checkMaintenanceMode();

    // Subscribe to changes in site_settings
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          if (payload.new.id === 1) {
            setMaintenanceMode(payload.new.maintenance_mode);

            // If maintenance mode is turned off, redirect admin to dashboard
            if (!payload.new.maintenance_mode && isAdmin) {
              navigate("/admin/dashboard");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Allow access to admin login page even during maintenance mode
  const isAdminLoginPage = location.pathname === "/admin";

  // If maintenance mode is on and user is not admin and not on admin login page, show maintenance page
  if (maintenanceMode && !isAdmin && !isAdminLoginPage) {
    return <MaintenanceMode />;
  }

  // Otherwise, show the requested content
  return <>{children}</>;
};

export default MaintenanceChecker;
