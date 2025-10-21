import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";

/**
 * Custom hook to prevent right-click context menu for players and non-authenticated users
 * Admins and authenticated users can still use right-click
 */
const usePreventRightClick = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    // Only prevent right-click for non-admin users
    // This includes both non-authenticated users and authenticated players
    if (!isAdmin) {
      const preventRightClick = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      // Add event listener to prevent context menu
      document.addEventListener("contextmenu", preventRightClick);

      // Cleanup function to remove event listener
      return () => {
        document.removeEventListener("contextmenu", preventRightClick);
      };
    }
  }, [isAdmin, user]);
};

export default usePreventRightClick;