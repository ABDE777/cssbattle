import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import LoadingSpinner from "@/components/LoadingSpinner";
import { safeLocalStorage } from "@/lib/storage";

interface User {
  id: string;
  email: string;
  full_name: string;
  cssbattle_profile_link?: string;
  email_confirmed_at?: string;
  group_name?: string;
  phone?: string;
  video_completed?: boolean;
  verified_ofppt?: boolean | null;
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
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch user profile data with all required fields
  const fetchUserProfile = async (session: Session) => {
    try {
      // Fetch player data with all required fields
      let profileData;
      const { data: profile, error } = await supabase
        .from("players")
        .select(
          "id, full_name, email, cssbattle_profile_link, group_name, phone, video_completed, verified_ofppt"
        )
        .eq("id", session.user.id)
        .single();

      if (error) {
        // If player not found by ID, try to create the player record
        if (error.code === "PGRST116") {
          // No rows returned
          const { error: insertError } = await supabase.from("players").insert({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.email!.split("@")[0],
            score: 0,
            group_name: "Default",
            video_completed: false,
          });

          if (!insertError) {
            // Try fetching the newly created player
            const { data: newProfile, error: newError } = await supabase
              .from("players")
              .select(
                "id, full_name, email, cssbattle_profile_link, group_name, phone, video_completed, verified_ofppt"
              )
              .eq("id", session.user.id)
              .single();

            if (!newError && newProfile) {
              profileData = newProfile;
            } else {
              // Return basic user data if still can't fetch
              return {
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.email!,
                email_confirmed_at: session.user.email_confirmed_at,
                video_completed: false,
                unreadMessageCount: 0,
              };
            }
          }
        } else {
          // Try fetching by email as fallback
          const { data: emailProfile, error: emailError } = await supabase
            .from("players")
            .select(
              "id, full_name, email, cssbattle_profile_link, group_name, phone, video_completed, verified_ofppt"
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

          profileData = emailProfile;
        }
      } else {
        profileData = profile;
      }

      // Fetch unread message count for the player
      const profileToUse = profileData || profile;
      const unreadCount = await fetchUnreadMessageCount(profileToUse.email);

      // Return complete user profile with all required fields
      return {
        id: profileToUse.id,
        email: profileToUse.email,
        full_name: profileToUse.full_name || "",
        cssbattle_profile_link:
          profileToUse.cssbattle_profile_link || undefined,
        email_confirmed_at: session.user.email_confirmed_at,
        group_name: profileToUse.group_name || undefined,
        phone: profileToUse.phone || undefined,
        video_completed: profileToUse.video_completed || false,
        verified_ofppt:
          profileToUse.verified_ofppt !== undefined
            ? profileToUse.verified_ofppt
            : null,
        unreadMessageCount: unreadCount,
      };
    } catch (error) {
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
      return 0;
    }
  };

  // Initialize auth state
  const initializeAuth = async () => {
    if (initialized) return;

    try {
      // Check if user is logged in as admin
      const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");
      if (hardcodedAdmin) {
        // If admin is logged in, don't treat them as a player
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const userProfile = await fetchUserProfile(session);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      // Defer Supabase calls with setTimeout to prevent deadlock
      setTimeout(() => {
        // Check if user is logged in as admin
        const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");
        if (hardcodedAdmin) {
          if (mounted) {
            setUser(null);
          }
          return;
        }

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
      }, 0);
    });

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Check if user is already logged in as admin
      const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");
      if (hardcodedAdmin) {
        return { success: false, error: "Please logout as admin first" };
      }

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
      // Clear any stored auth data
      safeLocalStorage.removeItem("hardcoded_admin");
    } catch (error) {
      // Silent error handling
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
          return { success: false, error: insertError.message };
        }

        return { success: true, requiresEmailVerification: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
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

  // Always render children, but show loading spinner during initialization
  if (loading) {
    return <LoadingSpinner message="Initializing..." />;
  }

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
