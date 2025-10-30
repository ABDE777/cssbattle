import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  Search,
  Calendar,
  FileText,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

interface Player {
  id: string;
  full_name: string;
  email: string;
  score: number | null;
  group_name: string | null;
}

interface ScoreHistory {
  id: string;
  player_id: string;
  score: number;
  previous_score: number | null;
  score_change: number | null;
  reason: string | null;
  timestamp: string;
}

interface PlayerStats {
  player: Player;
  totalChanges: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalGrowth: number;
  recentActivity: string;
}

const AdminPlayerHistories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    fetchPlayersAndHistory();
  }, []);

  const fetchPlayersAndHistory = async () => {
    try {
      setLoading(true);

      // Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, full_name, email, score, group_name")
        .order("full_name", { ascending: true });

      if (playersError) throw playersError;

      setPlayers(playersData || []);

      // Fetch score history for all players
      const { data: historyData, error: historyError } = await supabase
        .from("score_history")
        .select("*")
        .order("timestamp", { ascending: false });

      if (historyError) throw historyError;

      // Calculate statistics for each player
      const stats: PlayerStats[] = (playersData || []).map((player) => {
        const playerHistory = (historyData || []).filter(
          (h) => h.player_id === player.id
        );

        if (playerHistory.length === 0) {
          return {
            player,
            totalChanges: 0,
            averageScore: player.score || 0,
            highestScore: player.score || 0,
            lowestScore: player.score || 0,
            totalGrowth: 0,
            recentActivity: "No activity",
          };
        }

        const scores = playerHistory.map((h) => h.score);
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const firstScore = playerHistory[playerHistory.length - 1].score;
        const lastScore = playerHistory[0].score;
        const totalGrowth = lastScore - firstScore;

        const lastActivity = playerHistory[0];
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(lastActivity.timestamp).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let recentActivity = "";
        if (daysSinceActivity === 0) {
          recentActivity = "Today";
        } else if (daysSinceActivity === 1) {
          recentActivity = "Yesterday";
        } else if (daysSinceActivity < 7) {
          recentActivity = `${daysSinceActivity} days ago`;
        } else if (daysSinceActivity < 30) {
          recentActivity = `${Math.floor(daysSinceActivity / 7)} weeks ago`;
        } else {
          recentActivity = `${Math.floor(daysSinceActivity / 30)} months ago`;
        }

        return {
          player,
          totalChanges: playerHistory.length,
          averageScore: Math.round(averageScore * 100) / 100,
          highestScore,
          lowestScore,
          totalGrowth: Math.round(totalGrowth * 100) / 100,
          recentActivity,
        };
      });

      setPlayerStats(stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load player histories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMonthlyReport = async () => {
    try {
      // Fetch all score history for the selected month
      const startDate = new Date(selectedMonth + "-01");
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );

      const { data: historyData, error } = await supabase
        .from("score_history")
        .select("*, players(full_name, email, group_name)")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Generate report content
      let reportContent = `Monthly Player Statistics Report\n`;
      reportContent += `Month: ${format(startDate, "MMMM yyyy")}\n`;
      reportContent += `Generated: ${format(new Date(), "PPpp")}\n`;
      reportContent += `\n${"=".repeat(80)}\n\n`;

      // Overall statistics
      reportContent += `OVERALL STATISTICS\n`;
      reportContent += `${"=".repeat(80)}\n`;
      reportContent += `Total Players: ${players.length}\n`;
      reportContent += `Active Players (with history): ${
        playerStats.filter((s) => s.totalChanges > 0).length
      }\n`;
      reportContent += `Total Score Changes: ${historyData?.length || 0}\n`;

      const totalGrowth = playerStats.reduce(
        (sum, s) => sum + s.totalGrowth,
        0
      );
      reportContent += `Total Score Growth: ${
        Math.round(totalGrowth * 100) / 100
      }\n`;

      const avgScore =
        playerStats.reduce((sum, s) => sum + s.averageScore, 0) /
        playerStats.length;
      reportContent += `Average Player Score: ${
        Math.round(avgScore * 100) / 100
      }\n`;
      reportContent += `\n`;

      // Top performers
      const topPerformers = [...playerStats]
        .filter((s) => s.totalGrowth > 0)
        .sort((a, b) => b.totalGrowth - a.totalGrowth)
        .slice(0, 10);

      reportContent += `TOP 10 PERFORMERS (by growth)\n`;
      reportContent += `${"=".repeat(80)}\n`;
      topPerformers.forEach((stat, index) => {
        reportContent += `${index + 1}. ${stat.player.full_name} (${
          stat.player.email
        })\n`;
        reportContent += `   Growth: +${stat.totalGrowth} | Current: ${
          stat.player.score
        } | Group: ${stat.player.group_name || "N/A"}\n`;
      });
      reportContent += `\n`;

      // Detailed player statistics
      reportContent += `DETAILED PLAYER STATISTICS\n`;
      reportContent += `${"=".repeat(80)}\n\n`;

      playerStats
        .sort((a, b) => a.player.full_name.localeCompare(b.player.full_name))
        .forEach((stat) => {
          reportContent += `Player: ${stat.player.full_name}\n`;
          reportContent += `Email: ${stat.player.email}\n`;
          reportContent += `Group: ${stat.player.group_name || "N/A"}\n`;
          reportContent += `Current Score: ${stat.player.score || 0}\n`;
          reportContent += `Average Score: ${stat.averageScore}\n`;
          reportContent += `Highest Score: ${stat.highestScore}\n`;
          reportContent += `Lowest Score: ${stat.lowestScore}\n`;
          reportContent += `Total Growth: ${stat.totalGrowth > 0 ? "+" : ""}${
            stat.totalGrowth
          }\n`;
          reportContent += `Score Changes: ${stat.totalChanges}\n`;
          reportContent += `Last Activity: ${stat.recentActivity}\n`;
          reportContent += `${"-".repeat(80)}\n`;
        });

      // Activity log for the month
      if (historyData && historyData.length > 0) {
        reportContent += `\nMONTHLY ACTIVITY LOG\n`;
        reportContent += `${"=".repeat(80)}\n\n`;

        historyData.forEach((record) => {
          const date = format(new Date(record.timestamp), "PPpp");
          const playerName = record.players?.full_name || "Unknown";
          const change = record.score_change || 0;
          const changeStr = change > 0 ? `+${change}` : `${change}`;

          reportContent += `[${date}] ${playerName}\n`;
          reportContent += `  Score: ${record.previous_score || 0} → ${
            record.score
          } (${changeStr})\n`;
          reportContent += `  Reason: ${record.reason || "N/A"}\n`;
          reportContent += `\n`;
        });
      }

      // Create and download the TXT file
      const blob = new Blob([reportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `player-report-${selectedMonth}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: `Monthly report for ${format(
          startDate,
          "MMMM yyyy"
        )} has been downloaded as TXT`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate monthly report",
        variant: "destructive",
      });
    }
  };

  const filteredStats = playerStats.filter(
    (stat) =>
      stat.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stat.player.group_name &&
        stat.player.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate overall statistics
  const totalPlayers = players.length;
  const activePlayers = playerStats.filter((s) => s.totalChanges > 0).length;
  const totalScoreChanges = playerStats.reduce(
    (sum, s) => sum + s.totalChanges,
    0
  );
  const averageGrowth =
    playerStats.length > 0
      ? playerStats.reduce((sum, s) => sum + s.totalGrowth, 0) /
        playerStats.length
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <FloatingShape color="pink" size={400} top="10%" left="5%" delay={0} />
      <FloatingShape color="purple" size={300} top="60%" left="90%" delay={2} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Player Histories & Statistics
          </h1>
          <p className="text-muted-foreground">
            View and analyze all player performance data
          </p>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-gradient border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPlayers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activePlayers} active
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Score Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalScoreChanges}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total updates
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {averageGrowth > 0 ? "+" : ""}
                {Math.round(averageGrowth * 100) / 100}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per player</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {playerStats.length > 0
                  ? [...playerStats].sort(
                      (a, b) => b.totalGrowth - a.totalGrowth
                    )[0]?.player.full_name
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">By growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Report Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={format(new Date(), "yyyy-MM")}
              className="w-auto"
            />
            <Button onClick={handleDownloadMonthlyReport} className="gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Player Statistics Table */}
        {loading ? (
          <Card className="card-gradient border-primary/20">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Loading player histories...
              </div>
            </CardContent>
          </Card>
        ) : filteredStats.length === 0 ? (
          <Card className="card-gradient border-primary/20">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No players found matching your search</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStats.map((stat) => (
              <Card
                key={stat.player.id}
                className="card-gradient border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => navigate(`/history/${stat.player.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {stat.player.full_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {stat.player.email}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        stat.totalGrowth >= 0 ? "default" : "destructive"
                      }
                    >
                      {stat.totalGrowth > 0 ? "+" : ""}
                      {stat.totalGrowth}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Group</p>
                      <p className="font-medium">
                        {stat.player.group_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Score</p>
                      <p className="font-medium">{stat.player.score || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Average</p>
                      <p className="font-medium">{stat.averageScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Highest</p>
                      <p className="font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        {stat.highestScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Changes</p>
                      <p className="font-medium">{stat.totalChanges}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Active</p>
                      <p className="font-medium text-xs">
                        {stat.recentActivity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlayerHistories;
