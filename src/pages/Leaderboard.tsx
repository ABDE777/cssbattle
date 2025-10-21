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
  RefreshCw,
  Trophy,
  Medal,
  Award,
  Crown,
  Target,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import { GROUP_OPTIONS } from "@/constants/groups";

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
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // Get all players with required fields for leaderboard
      const { data, error } = await supabase
        .from("players")
        .select(
          "id, full_name, score, group_name, email, cssbattle_profile_link, phone, created_at, video_completed"
        );

      if (error) throw error;

      console.log("Leaderboard - Fetched players data:", data);
      console.log("Leaderboard - Total players count:", data?.length);

      // Sort players by score in descending order, handling null/undefined values
      const sortedPlayers = (data || []).sort((a, b) => {
        const scoreA = a.score !== null && a.score !== undefined ? a.score : 0;
        const scoreB = b.score !== null && b.score !== undefined ? b.score : 0;
        return scoreB - scoreA; // Descending order
      });

      console.log("Leaderboard - Sorted players:", sortedPlayers);

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
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Target className="w-4 h-4 text-muted-foreground mr-1" />
                <span className="text-xs text-muted-foreground">
                  {players.length} {language === "en" ? "Players" : "Joueurs"}
                </span>
              </div>
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
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-battle-purple"></div>
            </div>
          ) : (
            <>
              {/* Compact Top 3 Design with Creative Podium Formation on Mobile */}
              <div className="relative mb-6">
                {/* Grid formation for desktop */}
                <div className="hidden md:grid md:grid-cols-3 md:gap-3">
                  {/* Second Place */}
                  {topThreePlayers[1] && (
                    <div className="bg-card border border-gray-400/30 rounded-lg p-3 text-center transition-all duration-300 hover:shadow-lg">
                      <div className="flex justify-center mb-2">
                        <div className="bg-gray-400/20 rounded-full p-2">
                          {getRankIcon(1)}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-gray-400 truncate px-1">
                        {topThreePlayers[1].full_name}
                      </h3>
                      <div className="mt-2">
                        <Badge
                          className={`${getGroupColor(
                            topThreePlayers[1].group_name || ""
                          )} py-0 px-2 text-xs`}
                        >
                          {topThreePlayers[1].score?.toLocaleString() || "0"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-gray-400">
                        2
                      </div>
                    </div>
                  )}

                  {/* First Place */}
                  {topThreePlayers[0] && (
                    <div className="bg-card border-2 border-yellow-500/50 rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg shadow-lg shadow-yellow-500/20 -mt-2">
                      <div className="flex justify-center mb-2">
                        <div className="bg-yellow-500/20 rounded-full p-2">
                          {getRankIcon(0)}
                        </div>
                      </div>
                      <h3 className="font-bold text-base text-yellow-500 truncate px-1">
                        {topThreePlayers[0].full_name}
                      </h3>
                      <div className="mt-2">
                        <Badge
                          className={`${getGroupColor(
                            topThreePlayers[0].group_name || ""
                          )} py-0 px-2 text-xs font-bold`}
                        >
                          {topThreePlayers[0].score?.toLocaleString() || "0"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-3xl font-bold text-yellow-500">
                        1
                      </div>
                    </div>
                  )}

                  {/* Third Place */}
                  {topThreePlayers[2] && (
                    <div className="bg-card border border-amber-700/30 rounded-lg p-3 text-center transition-all duration-300 hover:shadow-lg">
                      <div className="flex justify-center mb-2">
                        <div className="bg-amber-700/20 rounded-full p-2">
                          {getRankIcon(2)}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-amber-700 truncate px-1">
                        {topThreePlayers[2].full_name}
                      </h3>
                      <div className="mt-2">
                        <Badge
                          className={`${getGroupColor(
                            topThreePlayers[2].group_name || ""
                          )} py-0 px-2 text-xs`}
                        >
                          {topThreePlayers[2].score?.toLocaleString() || "0"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-amber-700">
                        3
                      </div>
                    </div>
                  )}
                </div>

                {/* Creative Podium formation for mobile */}
                <div className="md:hidden flex justify-center items-end h-48 space-x-2 px-4">
                  {/* Second Place - Silver Podium */}
                  {topThreePlayers[1] && (
                    <div className="flex flex-col items-center w-24">
                      <div className="bg-card border border-gray-400/30 rounded-t-lg p-3 text-center transition-all duration-300 hover:shadow-lg flex-1 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex justify-center mb-1">
                            <div className="bg-gray-400/20 rounded-full p-1">
                              {getRankIcon(1)}
                            </div>
                          </div>
                          <h3 className="font-bold text-xs text-gray-400 truncate">
                            {topThreePlayers[1].full_name}
                          </h3>
                        </div>
                        <div className="mt-2">
                          <Badge
                            className={`${getGroupColor(
                              topThreePlayers[1].group_name || ""
                            )} py-0 px-1 text-xs whitespace-nowrap`}
                          >
                            {topThreePlayers[1].score?.toLocaleString() || "0"}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-gray-400 text-white text-xs font-bold py-1 px-2 rounded-b-lg w-full text-center">
                        2nd
                      </div>
                    </div>
                  )}

                  {/* First Place - Gold Podium (Tallest) */}
                  {topThreePlayers[0] && (
                    <div className="flex flex-col items-center w-28">
                      <div className="bg-card border-2 border-yellow-500/50 rounded-t-lg p-4 text-center transition-all duration-300 hover:shadow-lg shadow-lg shadow-yellow-500/20 flex-1 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex justify-center mb-1">
                            <div className="bg-yellow-500/20 rounded-full p-1">
                              {getRankIcon(0)}
                            </div>
                          </div>
                          <h3 className="font-bold text-sm text-yellow-500 truncate">
                            {topThreePlayers[0].full_name}
                          </h3>
                        </div>
                        <div className="mt-2">
                          <Badge
                            className={`${getGroupColor(
                              topThreePlayers[0].group_name || ""
                            )} py-0 px-1 text-xs font-bold whitespace-nowrap`}
                          >
                            {topThreePlayers[0].score?.toLocaleString() || "0"}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded-b-lg w-full text-center">
                        1st
                      </div>
                    </div>
                  )}

                  {/* Third Place - Bronze Podium */}
                  {topThreePlayers[2] && (
                    <div className="flex flex-col items-center w-20">
                      <div className="bg-card border border-amber-700/30 rounded-t-lg p-2 text-center transition-all duration-300 hover:shadow-lg flex-1 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex justify-center mb-1">
                            <div className="bg-amber-700/20 rounded-full p-1">
                              {getRankIcon(2)}
                            </div>
                          </div>
                          <h3 className="font-bold text-xs text-amber-700 truncate">
                            {topThreePlayers[2].full_name}
                          </h3>
                        </div>
                        <div className="mt-1">
                          <Badge
                            className={`${getGroupColor(
                              topThreePlayers[2].group_name || ""
                            )} py-0 px-1 text-xs whitespace-nowrap`}
                          >
                            {topThreePlayers[2].score?.toLocaleString() || "0"}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-amber-700 text-white text-xs font-bold py-1 px-2 rounded-b-lg w-full text-center">
                        3rd
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Positions 4-10 in a compact table */}
              <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-battle-purple" />
                    {language === "en" ? "Top Players" : "Meilleurs Joueurs"}
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
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getRankBadge(
                                actualIndex
                              )}`}
                            >
                              {actualIndex + 1}
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
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 font-bold text-primary border border-primary/30">
                        #{userRank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary truncate">
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
    </div>
  );
};

export default Leaderboard;
