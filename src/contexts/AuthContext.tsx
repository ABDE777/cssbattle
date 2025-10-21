import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  full_name: string;
  cssbattle_profile_link?: string;
  email_confirmed_at?: string;
  group_name?: string;
  phone?: string;
  video_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  register: (userData: {
    fullName: string;
    email: string;
    cssLink?: string;
    password: string;
    group: string;
    phone?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    requiresEmailVerification?: boolean;
  }>;
  checkEmailVerification: () => Promise<{ isVerified: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Fetch user profile data with all required fields
  const fetchUserProfile = async (session: Session) => {
    try {
      // Fetch player data with all required fields
      let { data: profile, error } = await supabase
        .from("players")
        .select(
          "id, full_name, email, cssbattle_profile_link, group_name, phone, video_completed"
        )
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("AuthContext - Error fetching player profile:", error);
        // Try fetching by email as fallback
        const { data: emailProfile, error: emailError } = await supabase
          .from("players")
          .select(
            "id, full_name, email, cssbattle_profile_link, group_name, phone, video_completed"
          )
          .eq("email", session.user.email)
          .single();
          
        if (emailError) {
          console.error("AuthContext - Error fetching by email:", emailError);
          // Return basic user data if no profile found
          return {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.email!,
            email_confirmed_at: session.user.email_confirmed_at,
            video_completed: false,
            unreadMessageCount: 0,
          };
        }
        
        profile = emailProfile;
      }

      // Fetch unread message count for the player
      const unreadCount = await fetchUnreadMessageCount(profile.email);

      // Return complete user profile with all required fields
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || "",
        cssbattle_profile_link: profile.cssbattle_profile_link || undefined,
        email_confirmed_at: session.user.email_confirmed_at,
        group_name: profile.group_name || undefined,
        phone: profile.phone || undefined,
        video_completed: profile.video_completed || false,
        unreadMessageCount: unreadCount,
      };
    } catch (error) {
      console.error("AuthContext - Error in fetchUserProfile:", error);
      // Return basic user data on error
      return {
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.email!,
        email_confirmed_at: session.user.email_confirmed_at,
        video_completed: false,
        unreadMessageCount: 0,
      };
    }
  };

  // Fetch unread message count for a player
  const fetchUnreadMessageCount = async (
    playerEmail?: string
  ): Promise<number> => {
    if (!playerEmail) return 0;

    try {
      const { count, error } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_email", playerEmail)
        .eq("status", "unread");

      if (!error && count !== null) {
        return count;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      return 0;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const userProfile = await fetchUserProfile(session);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        fetchUserProfile(session).then((userProfile) => {
          if (mounted) {
            setUser(userProfile);
          }
        });
      } else {
        if (mounted) {
          setUser(null);
        }
      }
    });

    // Listen for player messages read event
    const handlePlayerMessagesRead = () => {
      if (user?.email) {
        fetchUnreadMessageCount(user.email).then((count) => {
          if (mounted) {
            setUser((prevUser) =>
              prevUser ? { ...prevUser, unreadMessageCount: count } : null
            );
          }
        });
      }
    };

    window.addEventListener("playerMessagesRead", handlePlayerMessagesRead);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener(
        "playerMessagesRead",
        handlePlayerMessagesRead
      );
    };
  }, [user?.email]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          return {
            success: false,
            error: "Please verify your email before logging in.",
            emailVerified: false,
          };
        }

        const userProfile = await fetchUserProfile(data.session);
        setUser(userProfile);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    cssLink?: string;
    password: string;
    group: string;
    phone?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if CSS Battle link is already used by another player
        if (userData.cssLink) {
          const { data: existingPlayers, error: checkError } = await supabase
            .from("players")
            .select("id, full_name")
            .eq("cssbattle_profile_link", userData.cssLink);

          if (checkError) {
            return {
              success: false,
              error: `Database error: ${checkError.message}`,
            };
          }

          if (existingPlayers && existingPlayers.length > 0) {
            return {
              success: false,
              error: "CSS Battle link is already in use by another player",
            };
          }
        }

        const { error: insertError } = await supabase.from("players").insert([
          {
            id: data.user.id,
            full_name: userData.fullName,
            email: userData.email,
            cssbattle_profile_link: userData.cssLink || null,
            group_name: userData.group,
            phone: userData.phone || null,
            score: 0,
          },
        ]);

        if (insertError) {
          console.error("AuthContext - Insert error:", insertError);
          return { success: false, error: insertError.message };
        }

        console.log("AuthContext - Player registered successfully");
        return { success: true, requiresEmailVerification: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      console.error("AuthContext - Registration error:", error);
      return { success: false, error: (error as Error).message };
    }
  };

  const checkEmailVerification = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return { isVerified: !!session.user.email_confirmed_at };
    }
    return { isVerified: false };
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, checkEmailVerification }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
