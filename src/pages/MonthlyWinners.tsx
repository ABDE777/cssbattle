import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import FloatingShape from "@/components/FloatingShape";
import { useToast } from "@/hooks/use-toast";

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

const MonthlyWinners = () => {
  const [winners, setWinners] = useState<MonthlyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { toast } = useToast();

  const fetchWinners = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  // Group winners by month
  const winnersByMonth = winners.reduce((acc, winner) => {
    const month = winner.winning_month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(winner);
    return acc;
  }, {} as Record<string, MonthlyWinner[]>);

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
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              {language === "en" ? "Monthly Winners" : "Gagnants Mensuels"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === "en"
                ? "Celebrating our top performers each month. The current month's winner earns the prestigious Master badge!"
                : "Célébrant nos meilleurs performeurs chaque mois. Le gagnant du mois en cours remporte le prestigieux badge Master !"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : winners.length === 0 ? (
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
                            {language === "en" ? "Current Month" : "Mois Actuel"}
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
                                    {winner.position === 1 && isCurrentMonth && (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default MonthlyWinners;
