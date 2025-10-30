import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Trash2, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";

interface QuizScore {
  id: string;
  player_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
  player_email?: string;
  player_name?: string;
}

const AdminQuizRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchQuizScores();
  }, [isAdmin, adminLoading, navigate]);

  const fetchQuizScores = async () => {
    try {
      setLoading(true);
      const { data: scoresData, error: scoresError } = await supabase
        .from("quiz_scores")
        .select("*")
        .order("completed_at", { ascending: false });

      if (scoresError) throw scoresError;

      // Fetch player details for each score
      const enrichedScores = await Promise.all(
        (scoresData || []).map(async (score) => {
          const { data: playerData } = await supabase
            .from("players")
            .select("email, full_name")
            .eq("id", score.player_id)
            .single();

          return {
            ...score,
            player_email: playerData?.email || "Unknown",
            player_name: playerData?.full_name || "Unknown Player",
          };
        })
      );

      setQuizScores(enrichedScores);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quiz scores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm("Are you sure you want to delete this quiz score?")) return;

    try {
      const { error } = await supabase
        .from("quiz_scores")
        .delete()
        .eq("id", scoreId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz score deleted successfully",
      });

      fetchQuizScores();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz score",
        variant: "destructive",
      });
    }
  };

  const filteredScores = quizScores.filter(
    (score) =>
      score.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.player_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageScore =
    filteredScores.length > 0
      ? (
          filteredScores.reduce((sum, s) => sum + (s.score / s.total_questions) * 100, 0) /
          filteredScores.length
        ).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <FloatingShape color="purple" size={220} top="8%" left="85%" delay={0} />
      <FloatingShape color="pink" size={160} top="75%" left="10%" delay={1} rotation />
      <FloatingShape color="yellow" size={110} top="45%" left="80%" delay={0.5} />

      <div className="container mx-auto px-4 py-8 mt-20 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            Quiz <span className="bg-gradient-primary bg-clip-text text-transparent">Records</span>
          </h1>
          <div className="w-32"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
            <CardHeader>
              <CardTitle className="text-lg">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-battle-purple">
                {quizScores.length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-accent/30">
            <CardHeader>
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-battle-accent">
                {averageScore}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-pink/30">
            <CardHeader>
              <CardTitle className="text-lg">Unique Players</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-battle-pink">
                {new Set(quizScores.map((s) => s.player_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quiz Scores</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by player or quiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading scores...</div>
            ) : filteredScores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quiz scores found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredScores.map((score) => {
                  const percentage = ((score.score / score.total_questions) * 100).toFixed(1);
                  return (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-battle-purple/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-battle-accent" />
                          <span className="font-semibold">{score.player_name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({score.player_email})
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {score.quiz_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(score.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-battle-purple">
                            {percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {score.score}/{score.total_questions} correct
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScore(score.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminQuizRecords;
