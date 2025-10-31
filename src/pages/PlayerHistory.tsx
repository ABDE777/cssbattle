import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  History as HistoryIcon,
  BarChart3,
  User,
  Download,
  Award,
  Target,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import FloatingShape from "@/components/FloatingShape";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import SkeletonLoader from "@/components/SkeletonLoader";

interface ScoreHistory {
  id: string;
  player_id: string;
  score: number;
  previous_score: number | null;
  score_change: number | null;
  timestamp: string;
  reason: string | null;
}

interface Player {
  id: string;
  full_name: string;
  email: string;
  score: number | null;
  group_name: string | null;
}

const PlayerHistory = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Determine which player to show history for
  const targetPlayerId = playerId || user?.id;

  const fetchPlayerHistory = async () => {
    if (!targetPlayerId) return;

    setLoading(true);
    try {
      // Fetch player info
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, full_name, email, score, group_name")
        .eq("id", targetPlayerId)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      // Fetch score history
      const { data: historyData, error: historyError } = await supabase
        .from("score_history")
        .select("*")
        .eq("player_id", targetPlayerId)
        .order("timestamp", { ascending: false });

      if (historyError) throw historyError;

      setHistory(historyData || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: language === "en" ? "Error" : "Erreur",
        description:
          language === "en"
            ? "Failed to fetch player history"
            : "Échec de la récupération de l'historique du joueur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerHistory();
  }, [targetPlayerId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === "en" ? "en-US" : "fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreChangeIcon = (change: number | null) => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getScoreChangeBadge = (change: number | null) => {
    if (!change) return null;
    if (change > 0) return "bg-green-500/20 text-green-500 border-green-500/30";
    if (change < 0) return "bg-red-500/20 text-red-500 border-red-500/30";
    return "bg-muted";
  };

  // Calculate statistics
  const calculateStats = () => {
    if (history.length === 0) return null;

    const scores = history.map((h) => h.score);
    const changes = history
      .map((h) => h.score_change || 0)
      .filter((c) => c !== 0);

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const totalGames = history.length;
    const averageGrowth =
      changes.length > 0
        ? changes.reduce((a, b) => a + b, 0) / changes.length
        : 0;
    const positiveChanges = changes.filter((c) => c > 0).length;
    const negativeChanges = changes.filter((c) => c < 0).length;

    return {
      averageScore: averageScore.toFixed(2),
      highestScore,
      lowestScore,
      totalGames,
      averageGrowth: averageGrowth.toFixed(2),
      positiveChanges,
      negativeChanges,
      winRate:
        totalGames > 0
          ? ((positiveChanges / totalGames) * 100).toFixed(1)
          : "0",
    };
  };

  const stats = calculateStats();

  // Prepare chart data
  const chartData = history
    .slice()
    .reverse()
    .map((record, index) => ({
      index: index + 1,
      date: new Date(record.timestamp).toLocaleDateString(
        language === "en" ? "en-US" : "fr-FR",
        {
          month: "short",
          day: "numeric",
        }
      ),
      score: record.score,
      change: record.score_change || 0,
    }));

  // Download report
  const handleDownloadReport = () => {
    if (!player || history.length === 0) return;

    const reportContent = `
Player History Report
====================
Player: ${player.full_name}
Email: ${player.email}
Group: ${player.group_name || "N/A"}
Current Score: ${player.score || "N/A"}
Generated: ${new Date().toLocaleString()}

Statistics
==========
Total Records: ${stats?.totalGames || 0}
Average Score: ${stats?.averageScore || 0}
Highest Score: ${stats?.highestScore || 0}
Lowest Score: ${stats?.lowestScore || 0}
Average Growth: ${stats?.averageGrowth || 0}
Win Rate: ${stats?.winRate || 0}%
Positive Changes: ${stats?.positiveChanges || 0}
Negative Changes: ${stats?.negativeChanges || 0}

Score History
=============
${history
  .map(
    (record) =>
      `${formatDate(record.timestamp)}
Previous: ${
        record.previous_score !== null ? record.previous_score : "N/A"
      } → New: ${record.score}
Change: ${
        record.score_change !== null
          ? (record.score_change > 0 ? "+" : "") +
            record.score_change.toFixed(2)
          : "N/A"
      }
Reason: ${record.reason || "N/A"}
`
  )
  .join("\n---\n")}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${player.full_name.replace(/\s+/g, "_")}_history_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: language === "en" ? "Success" : "Succès",
      description:
        language === "en"
          ? "Report downloaded successfully"
          : "Rapport téléchargé avec succès",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
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

      <main className="relative z-10 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HistoryIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {language === "en" ? "Score History" : "Historique des Scores"}
              </h1>
            </div>
            {loading ? (
              <div className="flex items-center gap-2">
                <SkeletonLoader
                  width="40px"
                  height="40px"
                  borderRadius="rounded-full"
                />
                <SkeletonLoader width="120px" height="20px" />
                <SkeletonLoader width="60px" height="20px" />
              </div>
            ) : (
              player && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{player.full_name}</span>
                  {player.group_name && (
                    <Badge variant="outline">{player.group_name}</Badge>
                  )}
                  {player.score !== null && (
                    <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                      {language === "en" ? "Current Score" : "Score Actuel"}:{" "}
                      {player.score}
                    </Badge>
                  )}
                </div>
              )
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              {/* Skeleton for empty state or loading */}
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : history.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "No score history available yet. Start playing to build your history!"
                    : "Aucun historique de score disponible pour le moment. Commencez à jouer pour construire votre historique !"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Statistics Cards */}
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "en"
                              ? "Average Score"
                              : "Score Moyen"}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {stats.averageScore}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-primary/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "en"
                              ? "Highest Score"
                              : "Meilleur Score"}
                          </p>
                          <p className="text-2xl font-bold text-green-500">
                            {stats.highestScore}
                          </p>
                        </div>
                        <Award className="w-8 h-8 text-green-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "en"
                              ? "Avg Growth"
                              : "Croissance Moy"}
                          </p>
                          <p
                            className={`text-2xl font-bold ${
                              parseFloat(stats.averageGrowth) >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {parseFloat(stats.averageGrowth) > 0 ? "+" : ""}
                            {stats.averageGrowth}
                          </p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "en"
                              ? "Win Rate"
                              : "Taux de Victoire"}
                          </p>
                          <p className="text-2xl font-bold text-purple-500">
                            {stats.winRate}%
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500/50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Skeleton for stats cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card
                      key={i}
                      className="bg-card/50 backdrop-blur-sm border-primary/30"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <SkeletonLoader
                              width="80px"
                              height="12px"
                              className="mb-2"
                            />
                            <SkeletonLoader width="40px" height="24px" />
                          </div>
                          <SkeletonLoader
                            width="32px"
                            height="32px"
                            borderRadius="rounded-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Chart */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/30 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      {language === "en"
                        ? "Score Evolution"
                        : "Évolution du Score"}
                    </CardTitle>
                    {isAdmin && (
                      <Button
                        onClick={handleDownloadReport}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {language === "en" ? "Download Report" : "Télécharger"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorScore"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: "12px" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorScore)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    // Skeleton for chart
                    <div className="h-64 flex items-center justify-center">
                      <SkeletonLoader width="100%" height="200px" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed History */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {language === "en"
                      ? "Score Progress"
                      : "Progression du Score"}
                    <Badge variant="outline" className="ml-auto">
                      {history.length}{" "}
                      {language === "en" ? "records" : "enregistrements"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.map((record, index) => (
                      <div
                        key={record.id}
                        className={`p-4 rounded-lg border transition-all duration-300 hover:bg-card/80 ${
                          index === 0 ? "ring-2 ring-primary/50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {formatDate(record.timestamp)}
                              </p>
                              {index === 0 && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  {language === "en" ? "Latest" : "Dernier"}
                                </Badge>
                              )}
                            </div>
                            {record.reason && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {record.reason}
                              </p>
                            )}
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {language === "en" ? "Previous" : "Précédent"}
                                </p>
                                <p className="text-lg font-semibold text-foreground">
                                  {record.previous_score !== null
                                    ? record.previous_score
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {getScoreChangeIcon(record.score_change)}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {language === "en"
                                    ? "New Score"
                                    : "Nouveau Score"}
                                </p>
                                <p className="text-lg font-semibold text-primary">
                                  {record.score}
                                </p>
                              </div>
                            </div>
                          </div>
                          {record.score_change !== null &&
                            record.score_change !== 0 && (
                              <Badge
                                className={`${getScoreChangeBadge(
                                  record.score_change
                                )} flex items-center gap-1`}
                              >
                                {record.score_change > 0 ? "+" : ""}
                                {record.score_change.toFixed(2)}
                              </Badge>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PlayerHistory;
