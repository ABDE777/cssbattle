import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GROUP_OPTIONS } from "@/constants/groups";
import { useAdmin } from "@/contexts/AdminContext";
import ImportPlayersModal from "@/components/ImportPlayersModal";
import MessagesPanel from "@/components/MessagesPanel";
import { PlayerModal, PlayerFormData } from "@/components/PlayerModal";
import { useToast } from "@/hooks/use-toast";

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

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

const AdminDashboardBulk = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Bulk selection state
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [bulkOperationResult, setBulkOperationResult] =
    useState<BulkOperationResult | null>(null);

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
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    group_name: "",
    password: "",
    phone: "",
    cssbattle_profile_link: "",
  });

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [cssBattleLinkCount, setCssBattleLinkCount] = useState(0);
  const [isMessagesPanelOpen, setIsMessagesPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    setAdminEmail(admin?.email || "");
    fetchPlayers();
  }, [isAdmin, adminLoading, admin, navigate]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlayers(data || []);
      setPlayerCount(data?.length || 0);
      const cssBattleCount =
        data?.filter((player) => player.cssbattle_profile_link)?.length || 0;
      setCssBattleLinkCount(cssBattleCount);
    } catch (err) {
      setError("Failed to fetch players");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
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

      const { error } = await supabase.auth.resetPasswordForEmail(
        player.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw new Error(error.message);

      setSuccess(`Password reset email sent to ${player.email} successfully!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        "Failed to send password reset email: " + (err as Error).message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (playerData: PlayerFormData) => {
    if (
      !playerData.full_name ||
      !playerData.email ||
      !playerData.group_name ||
      !playerData.password
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // First, sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: playerData.email,
        password: playerData.password,
        options: {
          data: {
            full_name: playerData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        // Check if CSS Battle link is already used by another player
        if (playerData.css_link) {
          const { data: existingPlayers, error: checkError } = await supabase
            .from("players")
            .select("id, full_name")
            .eq("cssbattle_profile_link", playerData.css_link);

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
            full_name: playerData.full_name,
            email: playerData.email,
            cssbattle_profile_link: playerData.css_link || null,
            group_name: playerData.group_name,
            phone: playerData.phone || null,
            score: playerData.score || 0,
          },
        ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        toast({
          title: "Success",
          description: "Player account created successfully!",
        });

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
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          "Failed to create player account: " + (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSavePlayer = async (playerData: PlayerFormData) => {
    try {
      if (!editingPlayer) return;

      const updateData: Partial<Player> = {
        full_name: playerData.full_name,
        email: playerData.email,
        cssbattle_profile_link: playerData.css_link || null,
        phone: playerData.phone || null,
        group_name: playerData.group_name || null,
        score: playerData.score,
      };

      // Update password if provided
      if (playerData.password && playerData.password.trim() !== "") {
        const { data, error: pwError } = await supabase.functions.invoke(
          "admin-manage-password",
          {
            body: {
              action: "update_password",
              userId: editingPlayer.id,
              newPassword: playerData.password,
            },
          }
        );

        if (pwError) {
          throw new Error(`Password update failed: ${pwError.message}`);
        }

        if (data?.error) {
          throw new Error(`Password update failed: ${data.error}`);
        }

        toast({
          title: "Password Updated",
          description: "Player password has been changed successfully",
        });
      }

      // Update player data in database
      const { error: updateError } = await supabase
        .from("players")
        .update(updateData)
        .eq("id", editingPlayer.id);

      if (updateError) throw updateError;

      setSuccess("Player updated successfully!");
      setIsEditModalOpen(false);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to update player: ${(err as Error).message}`,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId)
        .select();

      if (error) {
        if (error.code === "42501") {
          throw new Error(
            "Permission denied. You may not have the required permissions."
          );
        }
        throw new Error(`Failed to delete player: ${error.message}`);
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setSuccess("Player deleted successfully!");
      } else {
        setSuccess("Player may have already been deleted.");
      }

      setDeleteConfirmation({ isOpen: false, player: null });
      fetchPlayers();
    } catch (error) {
      const errorMessage = (error as Error).message || "Unknown error occurred";
      setError("Delete failed: " + errorMessage);
      setDeleteConfirmation({ isOpen: false, player: null });
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allPlayerIds = filteredPlayers.map((p) => p.id);
      setSelectedPlayers(new Set(allPlayerIds));
    } else {
      setSelectedPlayers(new Set());
    }
  };

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers);
    if (checked) {
      newSelected.add(playerId);
    } else {
      newSelected.delete(playerId);
    }
    setSelectedPlayers(newSelected);
    setSelectAll(newSelected.size === filteredPlayers.length);
  };

  // Bulk operations
  const handleBulkAction = (action: string) => {
    if (selectedPlayers.size === 0) {
      toast({
        title: "No selection",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }
    setBulkAction(action);
    setShowBulkConfirmation(true);
  };

  const confirmBulkAction = async () => {
    setBulkOperationInProgress(true);
    setShowBulkConfirmation(false);

    const selectedPlayersList = players.filter((p) =>
      selectedPlayers.has(p.id)
    );

    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      if (bulkAction === "delete") {
        for (const player of selectedPlayersList) {
          try {
            const { error } = await supabase
              .from("players")
              .delete()
              .eq("id", player.id);

            if (error) throw error;
            result.success++;
          } catch (err) {
            result.failed++;
            result.errors.push({
              email: player.email,
              error: (err as Error).message,
            });
          }
        }
      } else if (bulkAction === "reset-password") {
        for (const player of selectedPlayersList) {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(
              player.email,
              {
                redirectTo: `${window.location.origin}/reset-password`,
              }
            );

            if (error) throw error;
            result.success++;
          } catch (err) {
            result.failed++;
            result.errors.push({
              email: player.email,
              error: (err as Error).message,
            });
          }
        }
      } else if (bulkAction === "export") {
        const csvContent = [
          [
            "Name",
            "Email",
            "Group",
            "Score",
            "Phone",
            "CSS Battle Link",
            "Created At",
          ],
          ...selectedPlayersList.map((p) => [
            p.full_name,
            p.email,
            p.group_name || "",
            p.score?.toString() || "0",
            p.phone || "",
            p.cssbattle_profile_link || "",
            new Date(p.created_at).toLocaleDateString(),
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `players-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        result.success = selectedPlayersList.length;
      }

      setBulkOperationResult(result);
      setSelectedPlayers(new Set());
      setSelectAll(false);
      fetchPlayers();
    } catch (error) {
      toast({
        title: "Bulk operation failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  // Filter logic
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup =
      groupFilter === "all" || player.group_name === groupFilter;

    const matchesScoreMin =
      scoreMin === "" || (player.score || 0) >= parseFloat(scoreMin);

    const matchesScoreMax =
      scoreMax === "" || (player.score || 0) <= parseFloat(scoreMax);

    const matchesDateFrom =
      dateFrom === "" || new Date(player.created_at) >= new Date(dateFrom);

    const matchesDateTo =
      dateTo === "" || new Date(player.created_at) <= new Date(dateTo);

    return (
      matchesSearch &&
      matchesGroup &&
      matchesScoreMin &&
      matchesScoreMax &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  if (loading && players.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battle-purple mx-auto mb-4"></div>
            <p className="text-foreground/80">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <FloatingShape color="purple" size={220} top="8%" left="85%" delay={0} />
      <FloatingShape
        color="pink"
        size={160}
        top="75%"
        left="10%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={110}
        top="45%"
        left="80%"
        delay={0.5}
      />

      <Navbar />

      <div className="container mx-auto px-4 py-8 mt-20 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/admin/quiz-records")}
              variant="outline"
              className="border-battle-purple/50"
            >
              Quiz Records
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-battle-purple/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-foreground">
            {success}
          </div>
        )}

        {/* Bulk operation result */}
        {bulkOperationResult && (
          <Card className="mb-6 p-4 bg-card/80 border-primary/30">
            <h3 className="font-semibold mb-2">Bulk Operation Results</h3>
            <p className="text-sm text-foreground/80">
              ✓ Successful: {bulkOperationResult.success} | ✗ Failed:{" "}
              {bulkOperationResult.failed}
            </p>
            {bulkOperationResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-foreground/70">
                  View errors
                </summary>
                <ul className="mt-2 text-xs space-y-1">
                  {bulkOperationResult.errors.map((err, idx) => (
                    <li key={idx}>
                      {err.email}: {err.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <Button
              onClick={() => setBulkOperationResult(null)}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Dismiss
            </Button>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Total Players</p>
                <p className="text-3xl font-bold text-foreground">
                  {playerCount}
                </p>
              </div>
              <Users className="w-12 h-12 text-battle-purple" />
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">
                  CSS Battle Links
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {cssBattleLinkCount}
                </p>
              </div>
              <Link className="w-12 h-12 text-battle-accent" />
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Selected</p>
                <p className="text-3xl font-bold text-foreground">
                  {selectedPlayers.size}
                </p>
              </div>
              <Target className="w-12 h-12 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Players Management */}
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-foreground">Players</h2>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Player
              </Button>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
                className="border-battle-purple/50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-primary/30"
              />
            </div>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-primary/30">
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

          {/* Bulk Actions */}
          {selectedPlayers.size > 0 && (
            <div className="mb-4 p-4 bg-primary/10 rounded-lg flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {selectedPlayers.size} player(s) selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleBulkAction("delete")}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
                <Button
                  onClick={() => handleBulkAction("reset-password")}
                  variant="outline"
                  size="sm"
                >
                  <Key className="w-4 h-4 mr-1" />
                  Reset Passwords
                </Button>
                <Button
                  onClick={() => handleBulkAction("export")}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          )}

          {/* Players Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-primary/20 bg-primary/5">
                  <th className="text-left p-3">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-center p-3 text-foreground/70 font-semibold">
                    Name
                  </th>
                  <th className="text-center p-3 text-foreground/70 font-semibold">
                    Email
                  </th>
                  <th className="text-center p-3 text-foreground/70 font-semibold">
                    Group
                  </th>
                  <th className="text-center p-3 text-foreground/70 font-semibold">
                    Score
                  </th>
                  <th className="text-center p-3 text-foreground/70 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <td className="p-3 align-top">
                      <Checkbox
                        checked={selectedPlayers.has(player.id)}
                        onCheckedChange={(checked) =>
                          handleSelectPlayer(player.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="p-3 align-top text-center">
                      <div className="font-medium">{player.full_name}</div>
                    </td>
                    <td className="p-3 align-top text-center">
                      <div>{player.email}</div>
                    </td>
                    <td className="p-3 align-top text-center">
                      <Badge variant="outline">
                        {player.group_name || "N/A"}
                      </Badge>
                    </td>
                    <td className="p-3 align-top text-center">
                      <div className="font-semibold">
                        {player.score?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="p-3 align-top text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                          onClick={() => handleEditPlayer(player)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleSendPasswordReset(player)}
                          variant="ghost"
                          size="sm"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() =>
                            setDeleteConfirmation({ isOpen: true, player })
                          }
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modals */}
        {isEditModalOpen && editingPlayer && (
          <PlayerModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingPlayer(null);
            }}
            onSave={handleSavePlayer}
            player={{
              id: editingPlayer.id,
              full_name: editingPlayer.full_name,
              email: editingPlayer.email,
              phone: editingPlayer.phone || "",
              css_link: editingPlayer.cssbattle_profile_link || "",
              group_name: editingPlayer.group_name || "",
              score: editingPlayer.score || 0,
            }}
            mode="edit"
          />
        )}

        {deleteConfirmation.isOpen && deleteConfirmation.player && (
          <Dialog
            open={deleteConfirmation.isOpen}
            onOpenChange={(open) =>
              !open && setDeleteConfirmation({ isOpen: false, player: null })
            }
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete{" "}
                  {deleteConfirmation.player.full_name}? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setDeleteConfirmation({ isOpen: false, player: null })
                  }
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeletePlayer(deleteConfirmation.player!.id)
                  }
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Confirmation Dialog */}
        <Dialog
          open={showBulkConfirmation}
          onOpenChange={setShowBulkConfirmation}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Action</DialogTitle>
              <DialogDescription>
                {bulkAction === "delete" &&
                  `You are about to delete ${selectedPlayers.size} player(s). This action is irreversible and will permanently remove all data.`}
                {bulkAction === "reset-password" &&
                  `You are about to send password reset emails to ${selectedPlayers.size} player(s). They will receive an email to reset their password.`}
                {bulkAction === "export" &&
                  `You are about to export ${selectedPlayers.size} player(s) to a CSV file.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBulkConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBulkAction}
                disabled={bulkOperationInProgress}
              >
                {bulkOperationInProgress ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isImportModalOpen && (
          <ImportPlayersModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={fetchPlayers}
          />
        )}

        {isCreateModalOpen && (
          <PlayerModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSave={handleCreatePlayer}
            mode="create"
          />
        )}

        {isMessagesPanelOpen && (
          <MessagesPanel
            isOpen={isMessagesPanelOpen}
            onClose={() => setIsMessagesPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardBulk;
