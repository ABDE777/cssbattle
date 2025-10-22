import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Crown, Medal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MonthlyWinner {
  id: string;
  player_id: string;
  full_name: string;
  email: string;
  score: number;
  group_name: string | null;
  winning_month: string;
  position: number;
  created_at: string;
}

const MonthlyWinners = () => {
  const [winners, setWinners] = useState<MonthlyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const { t, language } = useLanguage();

  const fetchWinners = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("monthly_winners" as any)
        .select("*")
        .order("winning_month", { ascending: false })
        .order("position", { ascending: true });

      if (monthFilter !== "all") {
        query = query.eq("winning_month", monthFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWinners((data || []) as unknown as MonthlyWinner[]);
    } catch (error) {
      console.error("Error fetching monthly winners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, [monthFilter]);

  // Get unique months for filter
  const uniqueMonths = Array.from(
    new Set(winners.map((winner) => winner.winning_month))
  ).sort((a, b) => b.localeCompare(a));

  // Group winners by month
  const winnersByMonth = winners.reduce((acc, winner) => {
    const month = winner.winning_month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(winner);
    return acc;
  }, {} as Record<string, MonthlyWinner[]>);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getRankBadge = (position: number) => {
    if (position === 1)
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (position === 2)
      return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    if (position === 3)
      return "bg-amber-700/20 text-amber-700 border-amber-700/30";
    return "bg-primary/20 text-primary border-primary/30";
  };

  const getGroupColor = (groupName: string | null) => {
    if (!groupName) return "bg-muted";

    // Simple color assignment based on first letter
    const firstChar = groupName.charAt(0).toLowerCase();
    if (firstChar >= "a" && firstChar <= "m") {
      return "bg-purple-500/20 text-purple-500 border-purple-500/30";
    } else {
      return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hidden sm:block">
          <FloatingShape
            color="purple"
            size={180}
            top="5%"
            left="80%"
            delay={0}
          />
          <FloatingShape
            color="pink"
            size={120}
            top="65%"
            left="5%"
            delay={1}
            rotation
          />
          <FloatingShape
            color="yellow"
            size={80}
            top="35%"
            left="85%"
            delay={0.5}
          />
        </div>
        <div className="sm:hidden">
          <FloatingShape
            color="purple"
            size={100}
            top="10%"
            left="80%"
            delay={0}
          />
          <FloatingShape
            color="pink"
            size={70}
            top="75%"
            left="15%"
            delay={1}
            rotation
          />
        </div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {language === "en" ? "Monthly Winners" : "Gagnants du Mois"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "en"
                  ? "Celebrating our top performers each month"
                  : "Célébrons nos meilleurs performers chaque mois"}
              </p>
            </div>
          </div>

          {/* Month Filter */}
          <div className="mb-6 w-48">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="border-battle-purple/50 hover:bg-battle-purple/10">
                <SelectValue
                  placeholder={
                    language === "en" ? "Select Month" : "Sélectionner un Mois"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === "en" ? "All Months" : "Tous les Mois"}
                </SelectItem>
                {uniqueMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month).toLocaleDateString(
                      language === "en" ? "en-US" : "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-battle-purple"></div>
            </div>
          ) : Object.keys(winnersByMonth).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(winnersByMonth).map(([month, monthWinners]) => (
                <div key={month}>
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    {new Date(month).toLocaleDateString(
                      language === "en" ? "en-US" : "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {monthWinners.map((winner) => (
                      <Card
                        key={winner.id}
                        className={`bg-card/50 backdrop-blur-sm border ${
                          winner.position === 1
                            ? "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                            : winner.position === 2
                            ? "border-gray-400/30"
                            : "border-amber-700/30"
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getRankIcon(winner.position)}
                              <span
                                className={
                                  winner.position === 1 ? "text-yellow-500" : ""
                                }
                              >
                                {language === "en"
                                  ? `#${winner.position} Place`
                                  : `Place #${winner.position}`}
                              </span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <h3
                              className={`font-bold text-lg mb-2 ${
                                winner.position === 1
                                  ? "text-yellow-500"
                                  : winner.position === 2
                                  ? "text-gray-400"
                                  : "text-amber-700"
                              }`}
                            >
                              {winner.full_name}
                            </h3>
                            <Badge
                              className={`${getGroupColor(
                                winner.group_name
                              )} py-1 px-2 mb-3`}
                            >
                              {winner.group_name || "N/A"}
                            </Badge>
                            <div className="text-2xl font-bold">
                              {winner.score?.toLocaleString() || "0"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {language === "en" ? "Points" : "Points"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "en"
                    ? "No Winners Found"
                    : "Aucun Gagnant Trouvé"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "No monthly winners have been recorded yet."
                    : "Aucun gagnant mensuel n'a encore été enregistré."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default MonthlyWinners;
