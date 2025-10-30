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
    console.log("AdminContext useEffect running");
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        // Check if we have a stored admin session
        const storedAdmin = safeLocalStorage.getItem("admin_session");
        console.log("Checking admin status, storedAdmin:", storedAdmin);

        if (storedAdmin) {
          const adminData = JSON.parse(storedAdmin);
          console.log("Found admin data:", adminData);
          if (mounted) {
            // Create a mock User object based on stored data
            const mockUser: User = {
              id: adminData.id,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
              email: adminData.email,
              identities: [],
              role: "authenticated",
              updated_at: new Date().toISOString(),
            };
            setAdmin(mockUser);
            setIsAdmin(true);
          }
        } else {
          console.log("No stored admin session found");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      } finally {
        // Always ensure loading is set to false
        console.log("Setting loading to false");
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for storage changes (including localStorage updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted) return;
      console.log("Storage event triggered:", e.key, e.newValue);
      if (e.key === "admin_session") {
        if (e.newValue) {
          try {
            const adminData = JSON.parse(e.newValue);
            console.log("Setting admin data from storage event:", adminData);
            if (mounted) {
              // Create a mock User object based on stored data
              const mockUser: User = {
                id: adminData.id,
                app_metadata: {},
                user_metadata: {},
                aud: "authenticated",
                created_at: new Date().toISOString(),
                email: adminData.email,
                identities: [],
                role: "authenticated",
                updated_at: new Date().toISOString(),
              };
              setAdmin(mockUser);
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Error parsing admin session:", error);
            safeLocalStorage.removeItem("admin_session");
          }
        } else {
          // Admin logged out
          console.log("Admin logged out, clearing state");
          if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Supabase auth state change:", _event, session);
      if (!mounted) return;

      // Check for stored admin session first
      const storedAdmin = safeLocalStorage.getItem("admin_session");
      if (storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          if (mounted) {
            // Create a mock User object based on stored data
            const mockUser: User = {
              id: adminData.id,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
              email: adminData.email,
              identities: [],
              role: "authenticated",
              updated_at: new Date().toISOString(),
            };
            setAdmin(mockUser);
            setIsAdmin(true);
          }
          return;
        } catch (error) {
          console.error("Error parsing admin session:", error);
          safeLocalStorage.removeItem("admin_session");
        }
      }

      if (session?.user) {
        try {
          // Check if the user is in the admins table
          const { data: adminData, error } = await supabase
            .from("admins")
            .select("id, email")
            .eq("email", session.user.email)
            .maybeSingle();

          if (!error && adminData && mounted) {
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
        setAdmin(null);
        setIsAdmin(false);
      }
    });

    return () => {
      console.log("AdminContext useEffect cleanup");
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Empty dependency array is correct here

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
    console.log("AdminContext logout called");
    safeLocalStorage.removeItem("admin_session");
    setAdmin(null);
    setIsAdmin(false);
    setUnreadMessageCount(0);

    // Don't call supabase.auth.signOut() here as it's handled by AuthContext
    // Just clear the admin session
    console.log("AdminContext logout completed");
  };

  // Fetch unread message count when admin changes
  useEffect(() => {
    if (isAdmin && admin?.email) {
      fetchUnreadMessageCount();
    }
  }, [isAdmin, admin?.email]);

  // Always render children, but show loading spinner during initialization
  if (loading) {
    return <LoadingSpinner message="Initializing admin..." />;
  }

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
