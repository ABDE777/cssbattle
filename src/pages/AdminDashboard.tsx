import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users,
  Trophy,
  Target,
  LogOut,
  Link,
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  User,
  Mail,
  Save,
  X,
  Edit,
  Shield,
  Plus,
  Trash2,
  Phone,
  Key,
  Upload,
  ChevronDown,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GROUP_OPTIONS } from "@/constants/groups";
import { useAdmin } from "@/contexts/AdminContext";
import ImportPlayersModal from "@/components/ImportPlayersModal";
import MessagesPanel from "@/components/MessagesPanel";
import { PlayerModal, PlayerFormData } from "@/components/PlayerModal";

interface Player {
  id: string;
  full_name: string;
  email: string;
  group_name: string | null;
  score: number;
  cssbattle_profile_link: string | null;
  phone: string | null;
  created_at: string;
  video_completed: boolean | null;
  verified_ofppt: boolean | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    logout: adminLogout,
    isAdmin,
    loading: adminLoading,
    admin,
  } = useAdmin();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupCategory, setGroupCategory] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState("all");

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    player: null,
  });

  // State for create player form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    group_name: "",
    password: "",
    phone: "",
    cssbattle_profile_link: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // State for password change modal
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    player: Player | null;
    userId: string | null;
  }>({
    isOpen: false,
    player: null,
    userId: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [cssBattleLinkCount, setCssBattleLinkCount] = useState(0);
  const [isMessagesPanelOpen, setIsMessagesPanelOpen] = useState(false);

  useEffect(() => {
    // Use AdminContext to validate access and get admin email
    if (typeof window === "undefined") return;

    if (adminLoading) return; // wait context

    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    setAdminEmail(admin?.email || "");

    // Test database permissions and load data
    testDatabasePermissions();
    fetchPlayers();
  }, [isAdmin, adminLoading, admin, navigate]);

  const testDatabasePermissions = async () => {
    try {
      // Test select permission
      const { data: selectData, error: selectError } = await supabase
        .from("players")
        .select("id")
        .limit(1);

      console.log("AdminDashboard - Select test:", {
        data: selectData,
        error: selectError,
      });
    } catch (error) {
      console.error("AdminDashboard - Permission test error:", error);
    }
  };

  const fetchPlayers = async () => {
    try {
      // Fetch players
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPlayers(data || []);

      // Update counts
      setPlayerCount(data?.length || 0);

      // Count players with CSS Battle links
      const cssBattleCount =
        data?.filter((player) => player.cssbattle_profile_link)?.length || 0;
      setCssBattleLinkCount(cssBattleCount);
    } catch (err) {
      setError("Failed to fetch players");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout(); // Use the context logout function
    navigate("/admin");
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsEditModalOpen(true);
  };

  const handleSendPasswordReset = async (player: Player) => {
    try {
      setLoading(true);
      setError(null);

      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(
        player.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(
        `Password reset email sent to ${player.email} successfully! The user can now reset their password.`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        "Failed to send password reset email: " + (err as Error).message
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlayer = async (playerData: PlayerFormData) => {
    try {
      if (!editingPlayer) return;

      const updateData: any = {
        full_name: playerData.full_name,
        email: playerData.email,
        cssbattle_profile_link: playerData.css_link || null,
        phone: playerData.phone || null,
        group_name: playerData.group_name || null,
        score: playerData.score,
      };

      // Only include password if it was provided
      if (playerData.password) {
        // Send password reset email
        await supabase.auth.resetPasswordForEmail(playerData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      }

      const { error: updateError } = await supabase
        .from("players")
        .update(updateData)
        .eq("id", editingPlayer.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Player updated successfully!");
      fetchPlayers();
    } catch (err) {
      console.error("Failed to update player:", err);
      throw err;
    }
  };

  const handleCreatePlayer = async () => {
    if (
      !createForm.full_name ||
      !createForm.email ||
      !createForm.group_name ||
      !createForm.password
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // First, sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            full_name: createForm.full_name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        // Check if CSS Battle link is already used by another player
        if (createForm.cssbattle_profile_link) {
          const { data: existingPlayers, error: checkError } = await supabase
            .from("players")
            .select("id, full_name")
            .eq("cssbattle_profile_link", createForm.cssbattle_profile_link);

          if (checkError) {
            throw new Error(`Database error: ${checkError.message}`);
          }

          if (existingPlayers && existingPlayers.length > 0) {
            throw new Error(
              "CSS Battle link is already in use by another player"
            );
          }
        }

        // Insert user data into players table
        const { error: insertError } = await supabase.from("players").insert([
          {
            id: data.user.id,
            full_name: createForm.full_name,
            email: createForm.email,
            cssbattle_profile_link: createForm.cssbattle_profile_link || null,
            group_name: createForm.group_name,
            phone: createForm.phone || null,
            score: 0,
          },
        ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess("Player account created successfully!");
        setIsCreateModalOpen(false);
        setCreateForm({
          full_name: "",
          email: "",
          group_name: "",
          password: "",
          phone: "",
          cssbattle_profile_link: "",
        });
        fetchPlayers(); // Refresh the player list

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to create player account: " + (err as Error).message);
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    console.log("=== DELETE OPERATION START ===");
    console.log("Attempting to delete player with ID:", playerId);

    try {
      // Show loading state
      setLoading(true);
      setError(null);

      // First, let's try to delete from players table
      console.log("Attempting to delete player from players table...");
      const { data, error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId)
        .select(); // Add select() to get the deleted record

      console.log("Delete operation result:", { data, error });

      if (error) {
        console.error("Database delete error:", error);
        // Check if it's a permission error
        if (error.code === "42501") {
          throw new Error(
            "Permission denied. You may not have the required permissions to delete this record."
          );
        }
        throw new Error(
          `Failed to delete player from database: ${error.message}`
        );
      }

      // Check if any rows were actually deleted
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Player deleted successfully:", data[0]);
        setSuccess("Player deleted successfully!");
      } else {
        console.warn(
          "No rows were deleted - player may not exist or was already deleted"
        );
        setSuccess("Player may have already been deleted.");
      }

      // Close the modal and refresh the list
      setDeleteConfirmation({ isOpen: false, player: null });
      fetchPlayers();

      console.log("=== DELETE OPERATION END ===");
    } catch (error) {
      console.error("=== DELETE OPERATION ERROR ===");
      console.error("Error details:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";
      setError("Delete failed: " + errorMessage);
      setDeleteConfirmation({ isOpen: false, player: null });
    } finally {
      setLoading(false);
    }
  };

  const debugDeleteOperation = async (playerId: string) => {
    console.log("=== DEBUG DELETE OPERATION START ===");
    console.log("Attempting to debug delete player with ID:", playerId);

    try {
      // Show loading state
      setLoading(true);
      setError(null);

      // Debug: First check if the player exists
      console.log("Debug: Checking if player exists before deletion...");
      const { data: existingData, error: existingError } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId);

      console.log("Player existence check:", { existingData, existingError });

      if (existingError) {
        throw new Error(
          `Error checking player existence: ${existingError.message}`
        );
      }

      if (!existingData || existingData.length === 0) {
        console.warn("Player does not exist, nothing to delete");
        setSuccess("Player may have already been deleted.");
        setDeleteConfirmation({ isOpen: false, player: null });
        fetchPlayers();
        return;
      }

      console.log("Player exists, proceeding with deletion:", existingData[0]);

      // Get user info for debugging
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user for delete operation:", user);

      // Log the exact query we're about to execute
      console.log("Executing DELETE query for player ID:", playerId);

      // First, let's try to delete from players table
      console.log("Attempting to delete player from players table...");
      const { data, error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId)
        .select(); // Add select() to get the deleted record

      console.log("Delete operation result:", { data, error });

      if (error) {
        console.error("Database delete error:", error);
        // Check if it's a permission error
        if (error.code === "42501") {
          throw new Error(
            "Permission denied. You may not have the required permissions to delete this record."
          );
        }
        throw new Error(
          `Failed to delete player from database: ${error.message}`
        );
      }

      // Check if any rows were actually deleted
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("Player deleted successfully:", data[0]);
        setSuccess("Player deleted successfully!");
      } else {
        console.warn("No rows were deleted - checking why...");

        // This is the critical part - let's investigate why no rows were deleted
        console.log("Investigating why no rows were deleted:");
        console.log("1. Checking if this is due to RLS policies...");

        // Try a more direct approach to see if there are any policy issues
        console.log("2. Checking current session and permissions...");

        // Double-check by trying to fetch the player again
        console.log("3. Double-checking if player still exists...");
        const { data: verificationData, error: verificationError } =
          await supabase.from("players").select("*").eq("id", playerId);

        console.log("Verification result:", {
          verificationData,
          verificationError,
        });

        if (verificationError) {
          console.warn("Verification error:", verificationError);
          setSuccess("Delete operation completed but verification failed.");
        } else if (
          verificationData &&
          Array.isArray(verificationData) &&
          verificationData.length === 0
        ) {
          console.log("Verification confirms player has been deleted");
          setSuccess("Player deleted successfully!");
        } else if (
          verificationData &&
          Array.isArray(verificationData) &&
          verificationData.length > 0
        ) {
          console.warn("Player still exists after delete attempt");
          console.warn("This suggests an RLS policy is preventing deletion");

          // Try to get more information about the policies
          console.log("Attempting to diagnose RLS policy issue...");

          setSuccess(
            "Delete operation completed but player may still exist due to RLS policies."
          );
        } else {
          console.warn("Unexpected verification result");
          setSuccess("Delete operation completed but status is unclear.");
        }
      }

      // Close the modal and refresh the list
      setDeleteConfirmation({ isOpen: false, player: null });
      fetchPlayers();

      console.log("=== DEBUG DELETE OPERATION END ===");
    } catch (error) {
      console.error("=== DEBUG DELETE OPERATION ERROR ===");
      console.error("Error details:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";
      setError("Delete failed: " + errorMessage);
      setDeleteConfirmation({ isOpen: false, player: null });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm({ ...createForm, password });
  };

  const handleChangePassword = (player: Player, userId: string) => {
    setPasswordModal({
      isOpen: true,
      player: player,
      userId: userId,
    });
    setNewPassword("");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!passwordModal.userId) {
      setError("User ID not found");
      return;
    }

    setIsUpdatingPassword(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in to perform this action");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "admin-manage-password",
        {
          body: {
            action: "update_password",
            userId: passwordModal.userId,
            newPassword: newPassword,
          },
        }
      );

      if (error) {
        throw error;
      }

      setSuccess("Password updated successfully!");
      setPasswordModal({ isOpen: false, player: null, userId: null });
      setNewPassword("");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Password update error:", err);
      setError(`Failed to update password: ${(err as Error).message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const analyzeRLSPolicies = async () => {
    console.log("ANALYZING RLS POLICIES");

    try {
      // Create a test player to analyze policies against
      console.log("Creating test player...");
      const testEmail = `policy-test-${Date.now()}@example.com`;
      const { data: insertData, error: insertError } = await supabase
        .from("players")
        .insert([
          {
            id: "00000000-0000-0000-0000-000000000001",
            full_name: "Policy Test User",
            email: testEmail,
            group_name: "DD101",
            score: 0,
          },
        ])
        .select();

      console.log("Insert result:", { insertData, insertError });

      if (insertError) {
        console.error("Failed to create test player:", insertError);
        alert("Failed to create test player: " + insertError.message);
        return;
      }

      if (!insertData || insertData.length === 0) {
        console.error("No test player created");
        alert("Failed to create test player");
        return;
      }

      const testPlayerId = insertData[0].id;
      console.log("Test player created with ID:", testPlayerId);

      // Test different DELETE conditions to understand the policy
      console.log("Testing DELETE with exact ID match...");
      const { data: deleteData1, error: deleteError1 } = await supabase
        .from("players")
        .delete()
        .eq("id", testPlayerId)
        .select();

      console.log("DELETE with exact ID:", { deleteData1, deleteError1 });

      // Verify if deleted
      const { data: verify1, error: verifyError1 } = await supabase
        .from("players")
        .select("*")
        .eq("id", testPlayerId);

      console.log("Verification after exact ID DELETE:", {
        verify1,
        verifyError1,
      });

      const wasDeletedWithExactId =
        verify1 && Array.isArray(verify1) && verify1.length === 0;
      console.log("Was deleted with exact ID?", wasDeletedWithExactId);

      // If not deleted, try to delete the test player with a different approach
      if (!wasDeletedWithExactId) {
        console.log("Player not deleted with exact ID - testing cleanup...");
        // Clean up the test player for next test
        await supabase.from("players").delete().eq("id", testPlayerId);
      }

      alert(
        "RLS policy analysis completed. Check console for detailed results."
      );
    } catch (error) {
      console.error("RLS analysis error:", error);
      alert("Error during RLS analysis: " + (error as Error).message);
    }
  };

  const testRLSPolicies = async () => {
    console.log("TESTING RLS POLICIES");

    // Try to delete a fake player to test RLS policies
    const fakeId = "00000000-0000-0000-0000-000000000000";
    console.log("Testing delete with fake ID:", fakeId);

    try {
      const { data, error } = await supabase
        .from("players")
        .delete()
        .eq("id", fakeId)
        .select();

      console.log("RLS test result:", { data, error });

      if (error) {
        alert(
          "RLS test failed: " + error.message + " (Code: " + error.code + ")"
        );
      } else {
        alert(
          "RLS test completed - no error (this might indicate permissions are too permissive)"
        );
      }
    } catch (error) {
      console.error("RLS test error:", error);
      alert("RLS test error: " + (error as Error).message);
    }
  };

  const checkRLSPoliciesDetailed = async () => {
    console.log("DETAILED RLS POLICY CHECK");

    try {
      // This would normally be done via SQL, but we can test the effects
      console.log("Testing current user permissions...");

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        alert("Error getting user info: " + userError.message);
        return;
      }

      console.log("Current user:", user);

      // Test what operations are allowed
      console.log("Testing SELECT permission...");
      const { data: selectData, error: selectError } = await supabase
        .from("players")
        .select("id")
        .limit(1);

      console.log("SELECT test:", {
        allowed: !selectError,
        error: selectError,
      });

      // Test INSERT permission
      console.log("Testing INSERT permission...");
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: insertData, error: insertError } = await supabase
        .from("players")
        .insert([
          {
            id: "00000000-0000-0000-0000-000000000002",
            full_name: "Test User",
            email: testEmail,
            group_name: "DD101",
            score: 0,
          },
        ])
        .select();

      console.log("INSERT test:", {
        allowed: !insertError,
        error: insertError,
      });

      // If insert succeeded, test UPDATE and DELETE on the test record
      if (insertData && Array.isArray(insertData) && insertData.length > 0) {
        const testPlayerId = insertData[0].id;
        console.log("Testing UPDATE permission on test record...");
        const { data: updateData, error: updateError } = await supabase
          .from("players")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", testPlayerId);

        console.log("UPDATE test:", {
          allowed: !updateError,
          error: updateError,
        });

        console.log("Testing DELETE permission on test record...");
        const { data: deleteData, error: deleteError } = await supabase
          .from("players")
          .delete()
          .eq("id", testPlayerId)
          .select();

        console.log("DELETE test:", {
          allowed: !deleteError,
          data: deleteData,
          error: deleteError,
        });

        // Verify deletion
        if (!deleteError) {
          const { data: verifyData, error: verifyError } = await supabase
            .from("players")
            .select("*")
            .eq("id", testPlayerId);

          console.log("DELETE verification:", {
            recordDeleted:
              verifyData &&
              Array.isArray(verifyData) &&
              verifyData.length === 0,
            remainingData: verifyData,
            error: verifyError,
          });
        }
      }

      alert("RLS policy check completed. Check console for detailed results.");
    } catch (error) {
      console.error("Detailed RLS check error:", error);
      alert("Error during RLS check: " + (error as Error).message);
    }
  };

  const runSimpleDeleteTest = async () => {
    console.log("RUNNING SIMPLE DELETE TEST");

    // Get the first player in the list
    if (players.length === 0) {
      alert("No players to test with");
      return;
    }

    const testPlayer = players[0];
    console.log("Testing delete with player:", testPlayer);

    // Show confirmation
    if (
      !window.confirm(
        `Delete player ${testPlayer.full_name}? This is a test and will actually delete the player!`
      )
    ) {
      return;
    }

    // Try to delete this player
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("players")
        .delete()
        .eq("id", testPlayer.id)
        .select();

      console.log("Simple delete test result:", { data, error });

      if (error) {
        throw error;
      }

      alert("Player deleted successfully!");
      fetchPlayers();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((player) => {
    // Basic search filter
    const matchesSearch =
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Group filter
    const matchesGroup =
      groupFilter === "all" || player.group_name === groupFilter;

    // Score range filter
    const playerScore = player.score || 0;
    const matchesScoreMin =
      scoreMin === "" || playerScore >= parseInt(scoreMin);
    const matchesScoreMax =
      scoreMax === "" || playerScore <= parseInt(scoreMax);

    // Date range filter
    const playerDate = new Date(player.created_at);
    const matchesDateFrom = dateFrom === "" || playerDate >= new Date(dateFrom);
    const matchesDateTo = dateTo === "" || playerDate <= new Date(dateTo);

    // Group category filter
    const playerGroup = player.group_name || "";
    const isDevGroup =
      playerGroup.startsWith("DD") || playerGroup.startsWith("DEVOWS");
    const isIdGroup =
      playerGroup.startsWith("ID") || playerGroup.startsWith("IDOSR");
    const matchesGroupCategory =
      groupCategory === "all" ||
      (groupCategory === "DEV" && isDevGroup) ||
      (groupCategory === "ID" && isIdGroup);

    // Verification status filter
    const playerVerified = player.verified_ofppt || false;
    const matchesVerification =
      verificationStatus === "all" ||
      (verificationStatus === "verified" && playerVerified) ||
      (verificationStatus === "unverified" && !playerVerified);

    return (
      matchesSearch &&
      matchesGroup &&
      matchesScoreMin &&
      matchesScoreMax &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesGroupCategory &&
      matchesVerification
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battle-purple mx-auto mb-4"></div>
          <p className="text-foreground/80">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16 overflow-hidden relative">
      <Navbar />
      <MessagesPanel
        isOpen={isMessagesPanelOpen}
        onClose={() => setIsMessagesPanelOpen(false)}
      />
      
      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={280} top="5%" left="85%" delay={0} />
      <FloatingShape
        color="pink"
        size={200}
        top="70%"
        left="5%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={140}
        top="40%"
        left="80%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={160}
        top="85%"
        left="15%"
        delay={1.5}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div></div> {/* Empty div for spacing */}
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              CSS{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                BATTLE
              </span>{" "}
              Admin Dashboard
            </h1>
            {adminEmail && (
              <p className="text-sm text-foreground/70 mt-1 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1 text-battle-accent inline-flex" />
                Logged in as:{" "}
                <span className="text-battle-purple font-medium ml-1">
                  {adminEmail}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-purple-500/20 dark:bg-purple-600/30 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-battle-purple mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Total Players
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {playerCount}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-blue-500/20 dark:bg-yellow-500/20 backdrop-blur-sm border-blue-500/30 dark:border-yellow-500/30 p-6">
            <div className="flex items-center">
              <Link className="w-8 h-8 text-blue-500 dark:text-yellow-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  CSS Battle Links
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {cssBattleLinkCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Messages */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search players by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-battle-purple/30 h-12"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground hidden sm:block" />
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50 border-battle-purple/30 h-12">
                    <SelectValue placeholder="Filter by group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {GROUP_OPTIONS.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground h-12 whitespace-nowrap"
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Import Players</span>
                  <span className="sm:hidden">Import</span>
                </Button>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow h-12 whitespace-nowrap"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create Player</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced Filters
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${
                  showAdvancedFilters ? "rotate-180" : ""
                }`}
              />
            </Button>

            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-card/50 backdrop-blur-sm border border-battle-purple/30 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Score Range */}
                  <div className="space-y-2">
                    <Label htmlFor="scoreMin" className="text-foreground">
                      Min Score
                    </Label>
                    <Input
                      id="scoreMin"
                      type="number"
                      value={scoreMin}
                      onChange={(e) => setScoreMin(e.target.value)}
                      placeholder="0"
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scoreMax" className="text-foreground">
                      Max Score
                    </Label>
                    <Input
                      id="scoreMax"
                      type="number"
                      value={scoreMax}
                      onChange={(e) => setScoreMax(e.target.value)}
                      placeholder="10000"
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom" className="text-foreground">
                      From Date
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateTo" className="text-foreground">
                      To Date
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  {/* Group Category */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Group Category</Label>
                    <Select
                      value={groupCategory}
                      onValueChange={setGroupCategory}
                    >
                      <SelectTrigger className="bg-background/50 border-battle-purple/30">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="DEV">DEV Groups</SelectItem>
                        <SelectItem value="ID">ID Groups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Verification Status
                    </Label>
                    <Select
                      value={verificationStatus}
                      onValueChange={setVerificationStatus}
                    >
                      <SelectTrigger className="bg-background/50 border-battle-purple/30">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScoreMin("");
                        setScoreMax("");
                        setDateFrom("");
                        setDateTo("");
                        setGroupCategory("all");
                        setVerificationStatus("all");
                      }}
                      className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-foreground">
              {success}
            </div>
          )}
        </div>

        {/* Players Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
          <div className="p-6 border-b border-battle-purple/30">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Registered Players
              </h2>
              <p className="text-foreground/70">
                Manage all registered players
              </p>
            </div>
          </div>

          {/* Player List */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-battle-purple/5">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Group</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="px-4 py-2">{player.full_name || "N/A"}</td>
                    <td className="px-4 py-2">{player.email || "N/A"}</td>
                    <td className="px-4 py-2">
                      {player.group_name ? (
                        <Badge variant="secondary">{player.group_name}</Badge>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-2">{player.score || 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditPlayer(player)}
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          onClick={() => handleSendPasswordReset(player)}
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                        >
                          <Key className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Reset Password
                          </span>
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              player: player,
                            });
                          }}
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </Card>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.player && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    Confirm Deletion
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDeleteConfirmation({ isOpen: false, player: null })
                    }
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-6">
                  <p className="text-foreground/80 mb-4">
                    Are you sure you want to delete the player{" "}
                    <span className="font-bold text-foreground">
                      {deleteConfirmation.player.full_name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-foreground text-sm">
                      <strong>Warning:</strong> This will permanently remove the
                      player's account and all associated data.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      setDeleteConfirmation({ isOpen: false, player: null })
                    }
                    variant="outline"
                    className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      console.log(
                        "Delete button clicked, player ID:",
                        deleteConfirmation.player!.id
                      );
                      handleDeletePlayer(deleteConfirmation.player!.id);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Player
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create Player Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    Create Player
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {error && !success && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-foreground">
                      Full Name *
                    </Label>
                    <Input
                      id="full_name"
                      value={createForm.full_name}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          full_name: e.target.value,
                        })
                      }
                      className="bg-background/50 border-battle-purple/30"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      className="bg-background/50 border-battle-purple/30"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_name" className="text-foreground">
                      Group *
                    </Label>
                    <Select
                      value={createForm.group_name}
                      onValueChange={(value) =>
                        setCreateForm({ ...createForm, group_name: value })
                      }
                    >
                      <SelectTrigger className="bg-background/50 border-battle-purple/30">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, phone: e.target.value })
                      }
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cssbattle_profile_link"
                      className="text-foreground"
                    >
                      CSSBattle Profile Link
                    </Label>
                    <Input
                      id="cssbattle_profile_link"
                      value={createForm.cssbattle_profile_link}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          cssbattle_profile_link: e.target.value,
                        })
                      }
                      placeholder="https://cssbattle.dev/player/..."
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          password: e.target.value,
                        })
                      }
                      className="bg-background/50 border-battle-purple/30"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    onClick={() => setIsCreateModalOpen(false)}
                    variant="outline"
                    className="w-full sm:w-1/2 border-battle-purple/50 hover:bg-battle-purple/10"
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePlayer}
                    className="w-full sm:w-1/2 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Player"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Password Change Modal */}
        {passwordModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    Change Password
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPasswordModal({
                        isOpen: false,
                        player: null,
                        userId: null,
                      });
                      setNewPassword("");
                    }}
                    className="text-foreground hover:bg-battle-purple/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {error && !success && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-battle-purple/30">
                    <p className="text-sm text-foreground/70 mb-1">Player</p>
                    <p className="font-semibold text-foreground">
                      {passwordModal.player?.full_name}
                    </p>
                    <p className="text-sm text-foreground/70">
                      {passwordModal.player?.email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-foreground">
                      New Password *
                    </Label>
                    <Input
                      id="new_password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="bg-background/50 border-battle-purple/30"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setPasswordModal({
                          isOpen: false,
                          player: null,
                          userId: null,
                        });
                        setNewPassword("");
                      }}
                      variant="outline"
                      className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdatePassword}
                      className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Import Players Modal */}
        <ImportPlayersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={fetchPlayers}
        />

        {/* Edit Player Modal */}
        <PlayerModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPlayer(null);
          }}
          onSave={handleSavePlayer}
          player={editingPlayer ? {
            id: editingPlayer.id,
            full_name: editingPlayer.full_name,
            email: editingPlayer.email,
            phone: editingPlayer.phone || "",
            css_link: editingPlayer.cssbattle_profile_link || "",
            group_name: editingPlayer.group_name || "",
            score: editingPlayer.score || 0,
          } : null}
          mode="edit"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;


