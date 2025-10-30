import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Trophy,
  Medal,
  Award,
  Crown,
  Target,
  Users,
  AlertCircle,
  Info,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import { GROUP_OPTIONS } from "@/constants/groups";
import EnhancedLoadingIndicator from "@/components/EnhancedLoadingIndicator";
import useFocusTrap from "@/hooks/useFocusTrap";
import useKeyboardNavigation from "@/hooks/useKeyboardNavigation";

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
  profile_image_url: string | null;
}

interface MonthlyWinner {
  id: string;
  player_id: string;
  full_name: string;
  email: string;
  group_name: string | null;
  score: number;
  position: number;
  winning_month: string;
  created_at: string;
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [isWinnersModalOpen, setIsWinnersModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // Start building the query
      let query = supabase
        .from("players")
        .select(
          "id, full_name, score, group_name, email, cssbattle_profile_link, phone, created_at, video_completed, verified_ofppt, profile_image_url"
        );

      // Apply group filter if not "all"
      if (groupFilter !== "all") {
        query = query.eq("group_name", groupFilter);
      }

      // Get all players with required fields for leaderboard
      const { data, error } = await query;

      if (error) throw error;

      console.log("Leaderboard - Fetched players data:", data);
      console.log("Leaderboard - Total players count:", data?.length);

      // Filter for verified OFPPT players for leaderboard
      const verifiedPlayers = (data || []).filter(
        (player) => player.verified_ofppt === true
      );

      // Sort players by score in descending order, handling null/undefined values
      const sortedPlayers = verifiedPlayers.sort((a, b) => {
        const scoreA = a.score !== null && a.score !== undefined ? a.score : 0;
        const scoreB = b.score !== null && b.score !== undefined ? b.score : 0;
        return scoreB - scoreA; // Descending order
      });

      console.log("Leaderboard - Sorted verified players:", sortedPlayers);

      setPlayers(sortedPlayers);
    } catch (error) {
      console.error("Leaderboard - Error fetching players:", error);
      toast({
        title: language === "en" ? "Error" : "Erreur",
        description:
          language === "en"
            ? "Failed to fetch leaderboard data"
            : "Échec de la récupération des données du classement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;

    fetchPlayers();

    // Set up real-time subscription with debouncing
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
        },
        (payload) => {
          // Debounce the fetch to prevent too many calls
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (isMounted) {
              fetchPlayers();
            }
          }, 1000); // Wait 1 second after last update
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
        },
        (payload) => {
          // Debounce the fetch
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (isMounted) {
              fetchPlayers();
            }
          }, 1000);
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [groupFilter, language]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0)
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (index === 1) return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    if (index === 2)
      return "bg-amber-700/20 text-amber-700 border-amber-700/30";
    return "bg-primary/20 text-primary border-primary/30";
  };

  const getGroupColor = (groupName: string) => {
    const group = GROUP_OPTIONS.find((g) => g.value === groupName);
    if (!group) return "bg-muted";

    if (group.category === "DEV") {
      return "bg-purple-500/20 text-purple-500 border-purple-500/30";
    } else {
      return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    }
  };

  // Get top 3 players for special display
  const topThreePlayers = players.slice(0, 3);

  // Get players 4-10 for normal display
  const normalPlayers = players.slice(3, 10);

  // Find current user's rank and data
  const userRank = user
    ? players.findIndex((p) => p.email === user.email) + 1
    : -1;
  const currentUserData = user
    ? players.find((p) => p.email === user.email)
    : null;

  // Get unique groups for filter - use all groups from constants instead of calculating from players
  // This prevents the disappearing group options issue
  const allGroups = GROUP_OPTIONS.map((option) => option.value);

  // Winners modal state and functions
  const [winners, setWinners] = useState<MonthlyWinner[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const modalRef = useFocusTrap(isWinnersModalOpen);

  // Add keyboard navigation for the modal
  useKeyboardNavigation(isWinnersModalOpen, () => setIsWinnersModalOpen(false));

  const fetchWinners = async () => {
    setWinnersLoading(true);
    try {
      const { data, error } = await supabase
        .from("monthly_winners")
        .select("*")
        .order("winning_month", { ascending: false })
        .order("position", { ascending: true });

      if (error) throw error;
      setWinners(data || []);
    } catch (error) {
      console.error("Error fetching winners:", error);
      toast({
        title: language === "en" ? "Error" : "Erreur",
        description:
          language === "en"
            ? "Failed to fetch monthly winners"
            : "Échec de la récupération des gagnants mensuels",
        variant: "destructive",
      });
    } finally {
      setWinnersLoading(false);
    }
  };

  // Group winners by month
  const winnersByMonth: Record<string, MonthlyWinner[]> = winners.reduce(
    (acc, winner) => {
      const month = winner.winning_month;
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(winner);
      return acc;
    },
    {} as Record<string, MonthlyWinner[]>
  );

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
      year: "numeric",
      month: "long",
    });
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getPositionBadge = (position: number) => {
    if (position === 1)
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (position === 2)
      return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    if (position === 3)
      return "bg-amber-700/20 text-amber-700 border-amber-700/30";
    return "bg-primary/20 text-primary border-primary/30";
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={250} top="5%" left="80%" delay={0} />
      <FloatingShape
        color="pink"
        size={180}
        top="65%"
        left="5%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={120}
        top="35%"
        left="85%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={150}
        top="80%"
        left="20%"
        delay={1.5}
      />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {language === "en" ? "Leaderboard" : "Classement"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "en"
                  ? "CSS Battle Championship"
                  : "Championnat CSS Battle"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "en"
                  ? "Scores reset monthly while preserving CSS Battle progress"
                  : "Les scores sont réinitialisés mensuellement tout en préservant la progression CSS Battle"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Target className="w-4 h-4 text-muted-foreground mr-1" />
                <span className="text-xs text-muted-foreground">
                  {players.length} {language === "en" ? "Players" : "Joueurs"}
                </span>
              </div>
              <Button
                onClick={() => {
                  setIsWinnersModalOpen(true);
                  fetchWinners();
                }}
                variant="outline"
                size="sm"
                className="border-battle-purple/50 hover:bg-battle-purple/10 h-8"
              >
                <Trophy className="w-4 h-4 mr-1" />
                {language === "en" ? "Winners" : "Gagnants"}
              </Button>
              <Button
                onClick={fetchPlayers}
                variant="outline"
                size="sm"
                className="border-battle-purple/50 hover:bg-battle-purple/10 h-8"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                {language === "en" ? "Refresh" : "Actualiser"}
              </Button>
            </div>
          </div>

          {/* Monthly Reset Info */}
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {language === "en"
                      ? "Monthly Leaderboard Reset"
                      : "Réinitialisation Mensuelle du Classement"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "en"
                      ? "Leaderboard scores are reset on the 1st of each month to ensure fair competition. Your CSS Battle progress is always preserved."
                      : "Les scores du classement sont réinitialisés le 1er de chaque mois pour assurer une compétition équitable. Votre progression CSS Battle est toujours préservée."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message for unverified players - Moved to top */}
          {user &&
            (user.verified_ofppt === false || user.verified_ofppt === null) && (
              <Card className="bg-red-500/10 backdrop-blur-sm border-red-500/30 mb-6">
                <CardContent className="p-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3 text-center">
                    {language === "en"
                      ? "⚠️ You Will Never Appear on the Leaderboard"
                      : "⚠️ Vous n'apparaîtrez jamais sur le classement"}
                  </h3>
                  <p className="text-foreground/90 mb-4 text-center font-medium">
                    {language === "en"
                      ? "Your account is not verified as an OFPPT student. To fix this:"
                      : "Votre compte n'est pas vérifié en tant qu'étudiant OFPPT. Pour corriger ceci :"}
                  </p>
                  <div className="bg-card/50 rounded-lg p-4 mb-4 text-left space-y-3">
                    <div className="flex items-start">
                      <span className="font-bold text-primary mr-2">1.</span>
                      <p className="text-foreground/80">
                        {language === "en"
                          ? "Click on your "
                          : "Cliquez sur votre "}
                        {user.cssbattle_profile_link ? (
                          <a
                            href={user.cssbattle_profile_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {language === "en"
                              ? "CSS Battle profile link"
                              : "lien de profil CSS Battle"}
                          </a>
                        ) : (
                          <span>
                            {language === "en"
                              ? "CSS Battle profile link below"
                              : "lien de profil CSS Battle ci-dessous"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="font-bold text-primary mr-2">2.</span>
                      <p className="text-foreground/80">
                        {language === "en"
                          ? "Click on 'Edit Profile' button"
                          : "Cliquez sur le bouton 'Modifier le profil'"}
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="font-bold text-primary mr-2">3.</span>
                      <p className="text-foreground/80">
                        {language === "en"
                          ? "In your bio section, write ONLY the word: "
                          : "Dans la section bio, écrivez UNIQUEMENT le mot : "}
                        <span className="font-bold text-primary">'ofppt'</span>
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="font-bold text-primary mr-2">4.</span>
                      <p className="text-foreground/80">
                        {language === "en"
                          ? "Click 'Save' and return to the platform and wait 15 minutes to see the changes"
                          : "Cliquez sur 'Enregistrer' et retournez sur la plateforme et attendez 15 minutes pour voir les changements"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Group Filter */}
          <div className="mb-6 w-48">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="border-battle-purple/50 hover:bg-battle-purple/10">
                <SelectValue
                  placeholder={
                    language === "en"
                      ? "Select Group"
                      : "Sélectionner un Groupe"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "en" ? "All Groups" : "Tous les Groupes"}
                </SelectItem>
                {allGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <EnhancedLoadingIndicator
              isLoading={loading}
              message={
                language === "en"
                  ? "Loading leaderboard..."
                  : "Chargement du classement..."
              }
            />
          ) : (
            <>
              {/* Unified Top Players Display */}
              <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-battle-purple" />
                    {language === "en" ? "Top Players" : "Meilleurs Joueurs"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {topThreePlayers.map((player, index) => {
                      const isCurrentUser = user && player.email === user.email;
                      const rank = index + 1;
                      return (
                        <div
                          key={player.id}
                          className={`p-4 transition-all duration-300 hover:bg-card/80 ${
                            isCurrentUser
                              ? "bg-primary/5 border-l-2 border-primary"
                              : ""
                          } ${
                            rank === 1
                              ? "bg-yellow-500/5 border-l-2 border-yellow-500"
                              : rank === 2
                              ? "bg-gray-400/5 border-l-2 border-gray-400"
                              : "bg-amber-700/5 border-l-2 border-amber-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              {player.profile_image_url ? (
                                <div className="relative">
                                  <img
                                    src={player.profile_image_url}
                                    alt={player.full_name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-primary text-white">
                                    {rank}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border ${getRankBadge(
                                    rank
                                  )}`}
                                  aria-label={`Rank ${rank}`}
                                >
                                  {rank}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-medium ${
                                  isCurrentUser ? "text-primary" : ""
                                }`}
                              >
                                {player.full_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                                    {language === "en" ? "You" : "Vous"}
                                  </span>
                                )}
                              </h3>
                              <Badge
                                className={`${getGroupColor(
                                  player.group_name || ""
                                )} py-0 px-1.5 text-xs mt-1`}
                              >
                                {player.group_name}
                              </Badge>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {language === "en" ? "Score" : "Score"}
                              </div>
                              <div
                                className={`font-bold ${
                                  isCurrentUser ? "text-primary" : ""
                                }`}
                              >
                                {player.score !== null &&
                                player.score !== undefined
                                  ? player.score.toLocaleString()
                                  : "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Positions 4-10 in a compact table */}
              <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-battle-purple" />
                    {language === "en" ? "Other Players" : "Autres Joueurs"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {normalPlayers.map((player, index) => {
                      const actualIndex = index + 3;
                      const isCurrentUser = user && player.email === user.email;
                      return (
                        <div
                          key={player.id}
                          className={`p-4 transition-all duration-300 hover:bg-card/80 ${
                            isCurrentUser
                              ? "bg-primary/5 border-l-2 border-primary"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center">
                              {player.profile_image_url ? (
                                <div className="relative">
                                  <img
                                    src={player.profile_image_url}
                                    alt={player.full_name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-primary text-white">
                                    {actualIndex + 1}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border ${getRankBadge(
                                    actualIndex
                                  )}`}
                                  aria-label={`Rank ${actualIndex + 1}`}
                                >
                                  {actualIndex + 1}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-medium truncate ${
                                  isCurrentUser ? "text-primary" : ""
                                }`}
                              >
                                {player.full_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                                    {language === "en" ? "You" : "Vous"}
                                  </span>
                                )}
                              </h3>
                              <Badge
                                className={`${getGroupColor(
                                  player.group_name || ""
                                )} py-0 px-1.5 text-xs mt-1`}
                              >
                                {player.group_name}
                              </Badge>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {language === "en" ? "Score" : "Score"}
                              </div>
                              <div
                                className={`font-bold ${
                                  isCurrentUser ? "text-primary" : ""
                                }`}
                              >
                                {player.score !== null &&
                                player.score !== undefined
                                  ? player.score.toLocaleString()
                                  : "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {normalPlayers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      {language === "en"
                        ? "No players found in this group"
                        : "Aucun joueur trouvé dans ce groupe"}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current User Position */}
              {user && currentUserData && userRank > 0 && (
                <Card className="bg-card/50 backdrop-blur-sm border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-battle-purple" />
                      {language === "en" ? "Your Position" : "Votre Position"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        {currentUserData.profile_image_url ? (
                          <div className="relative">
                            <img
                              src={currentUserData.profile_image_url}
                              alt={currentUserData.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-primary text-white">
                              {userRank}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 font-bold text-primary border border-primary/30">
                            #{userRank}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary">
                          {currentUserData.full_name}
                          <span className="ml-2 text-xs bg-primary/20 px-2 py-1 rounded">
                            {language === "en" ? "You" : "Vous"}
                          </span>
                        </h3>
                        <Badge
                          className={`${getGroupColor(
                            currentUserData.group_name || ""
                          )} py-0 px-1.5 text-xs mt-1`}
                        >
                          {currentUserData.group_name}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {language === "en" ? "Score" : "Score"}
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {currentUserData.score !== null &&
                          currentUserData.score !== undefined
                            ? currentUserData.score.toLocaleString()
                            : "0"}
                        </div>
                      </div>
                    </div>

                    {userRank > 10 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-center text-xs text-muted-foreground">
                          {language === "en"
                            ? `${userRank - 10} positions away from top 10`
                            : `${
                                userRank - 10
                              } positions avant d'atteindre le top 10`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Winners Modal */}
      <Dialog open={isWinnersModalOpen} onOpenChange={setIsWinnersModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          ref={modalRef}
          aria-label="Monthly Winners"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              {language === "en" ? "Monthly Winners" : "Gagnants Mensuels"}
            </DialogTitle>
          </DialogHeader>

          <EnhancedLoadingIndicator
            isLoading={winnersLoading}
            message={
              language === "en"
                ? "Loading winners..."
                : "Chargement des gagnants..."
            }
          />

          {!winnersLoading && winners.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "No winners recorded yet. Be the first to win!"
                    : "Aucun gagnant enregistré pour le moment. Soyez le premier à gagner !"}
                </p>
              </CardContent>
            </Card>
          ) : (
            !winnersLoading && (
              <div className="space-y-6">
                {Object.entries(winnersByMonth).map(([month, monthWinners]) => {
                  const isCurrentMonth = month === getCurrentMonth();
                  return (
                    <Card
                      key={month}
                      className={`bg-card/50 backdrop-blur-sm border-primary/30 ${
                        isCurrentMonth ? "ring-2 ring-primary shadow-lg" : ""
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {formatMonth(month)}
                          </div>
                          {isCurrentMonth && (
                            <Badge className="bg-primary text-primary-foreground">
                              {language === "en"
                                ? "Current Month"
                                : "Mois Actuel"}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {monthWinners.map((winner) => (
                            <div
                              key={winner.id}
                              className={`p-4 rounded-lg border transition-all duration-300 hover:bg-card/80 ${
                                winner.position === 1
                                  ? "bg-yellow-500/5 border-yellow-500/30"
                                  : winner.position === 2
                                  ? "bg-gray-400/5 border-gray-400/30"
                                  : "bg-amber-700/5 border-amber-700/30"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border ${getPositionBadge(
                                      winner.position
                                    )}`}
                                  >
                                    {getPositionIcon(winner.position) || (
                                      <span className="text-sm font-bold">
                                        {winner.position}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-foreground">
                                        {winner.full_name}
                                      </p>
                                      {winner.position === 1 &&
                                        isCurrentMonth && (
                                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Master
                                          </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {winner.group_name || "No Group"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">
                                    {winner.score}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {language === "en" ? "points" : "points"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
