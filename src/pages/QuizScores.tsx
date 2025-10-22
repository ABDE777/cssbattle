import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface QuizScore {
  id: string;
  player_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_title: string;
  players: {
    full_name: string;
    email: string;
    group_name: string | null;
  };
}

const QuizScores = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizScores = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("quiz_scores")
          .select(
            `
            *,
            players (
              full_name,
              email,
              group_name
            )
          `
          )
          .order("completed_at", { ascending: false });

        if (error) throw error;
        setQuizScores(data || []);
      } catch (error) {
        console.error("Failed to fetch quiz scores:", error);
        toast({
          title: language === "en" ? "Error" : "Erreur",
          description:
            language === "en"
              ? "Failed to load quiz scores"
              : "Échec du chargement des scores du quiz",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizScores();
  }, [language, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hidden sm:block">
          <FloatingShape
            color="purple"
            size={150}
            top="10%"
            left="5%"
            delay={0}
          />
          <FloatingShape
            color="pink"
            size={100}
            top="70%"
            left="85%"
            delay={1}
            rotation
          />
          <FloatingShape
            color="yellow"
            size={70}
            top="40%"
            left="80%"
            delay={0.5}
          />
          <FloatingShape
            color="purple"
            size={80}
            top="85%"
            left="15%"
            delay={1.5}
          />
        </div>
        <div className="sm:hidden">
          <FloatingShape
            color="purple"
            size={100}
            top="15%"
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

      <main className="relative z-10 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              {language === "en" ? "Quiz Scores" : "Scores du Quiz"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en"
                ? "View all player quiz scores"
                : "Voir tous les scores du quiz des joueurs"}
            </p>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                {language === "en"
                  ? "Player Quiz Scores"
                  : "Scores du Quiz des Joueurs"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizScores.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {language === "en"
                      ? "No quiz scores available yet"
                      : "Aucun score de quiz disponible pour le moment"}
                  </p>
                ) : (
                  quizScores.map((score) => (
                    <div
                      key={score.id}
                      className="p-4 bg-background/50 rounded-lg border border-primary/20"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {score.players?.full_name || "Unknown Player"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {score.players?.email || "No email"}
                          </p>
                          {score.players?.group_name && (
                            <Badge variant="secondary" className="mt-1">
                              {score.players.group_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {score.score}/{score.total_questions}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(
                                score.completed_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {score.quiz_title}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuizScores;
