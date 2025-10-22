import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import LoadingSpinner from "@/components/LoadingSpinner";
import { safeLocalStorage } from "@/lib/storage";

interface AdminContextType {
  admin: User | null;
  isAdmin: boolean;
  loading: boolean;
  unreadMessageCount: number;
  fetchUnreadMessageCount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeAdmin = async () => {
      try {
        const hardcodedAdmin = localStorage.getItem("hardcoded_admin");

        if (hardcodedAdmin) {
          try {
            const adminData = JSON.parse(hardcodedAdmin);
            if (mounted) {
              setAdmin(adminData as User);
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Invalid admin data in localStorage:", error);
            localStorage.removeItem("hardcoded_admin");
          }
        }
      } catch (error) {
        console.error("Error initializing admin:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAdmin();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted || e.key !== "hardcoded_admin") return;

      if (e.newValue) {
        try {
          const adminData = JSON.parse(e.newValue);
          if (mounted) {
            setAdmin(adminData as User);
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Invalid admin data:", error);
          localStorage.removeItem("hardcoded_admin");
        }
      } else {
        if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      // Check if there's a player session active when admin context is needed
      if (session?.user) {
        // Check for hardcoded admin first
        const hardcodedAdmin = localStorage.getItem("hardcoded_admin");
        if (hardcodedAdmin) {
          try {
            const adminData = JSON.parse(hardcodedAdmin);
            if (mounted) {
              setAdmin(adminData as User);
              setIsAdmin(true);
            }
            return;
          } catch (error) {
            console.error("Invalid admin data:", error);
            localStorage.removeItem("hardcoded_admin");
          }
        }

        // Check if user has admin role in database
        try {
          const { data: roleData, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!error && roleData && mounted) {
            setAdmin(session.user);
            setIsAdmin(true);
          } else if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
          if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        }
      } else if (mounted) {
        // Check if there's still a hardcoded admin session
        const hardcodedAdmin = localStorage.getItem("hardcoded_admin");
        if (hardcodedAdmin) {
          try {
            const adminData = JSON.parse(hardcodedAdmin);
            if (mounted) {
              setAdmin(adminData as User);
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Invalid admin data:", error);
            localStorage.removeItem("hardcoded_admin");
          }
        } else {
          setAdmin(null);
          setIsAdmin(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchUnreadMessageCount = async () => {
    if (!admin?.email) return;

    try {
      const { count, error } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_email", admin.email)
        .eq("status", "unread");

      if (!error && count !== null) {
        setUnreadMessageCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread message count:", error);
    }
  };

  const logout = async () => {
    localStorage.removeItem("hardcoded_admin");
    setAdmin(null);
    setIsAdmin(false);
    setUnreadMessageCount(0);
  };

  // Fetch unread message count when admin changes
  useEffect(() => {
    if (isAdmin && admin?.email) {
      fetchUnreadMessageCount();
    }
  }, [isAdmin, admin?.email]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdmin,
        loading,
        unreadMessageCount,
        fetchUnreadMessageCount,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
