import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Link as LinkIcon,
  Users,
  Trophy,
  Calendar,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
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

const AdminPlayerDetails = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    if (!playerId) {
      navigate("/admin/dashboard");
      return;
    }
    fetchPlayerDetails();
  }, [isAdmin, adminLoading, playerId, navigate]);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();

      if (error) throw error;

      setPlayer(data as Player);
    } catch (err) {
      console.error("Error fetching player details:", err);
      setError("Failed to fetch player details");
      toast({
        title: "Error",
        description: "Failed to fetch player details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">
          Loading player details...
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Player Not Found
          </h2>
          <p className="text-foreground/80 mb-6">
            Unable to load player details.
          </p>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-gradient-primary hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const groupLabel = player.group_name
    ? GROUP_OPTIONS.find((g) => g.value === player.group_name)?.label ||
      player.group_name
    : "No group assigned";

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="border-primary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Player Details</h1>
          <div></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/30 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
                <User className="w-16 h-16 text-foreground" />
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {player.full_name}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    Player ID: {player.id.substring(0, 8)}...
                  </Badge>
                  <Badge variant="default" className="text-sm">
                    Score: {player.score}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-foreground">{player.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Group</p>
                      <p className="text-foreground">{groupLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Member Since
                      </p>
                      <p className="text-foreground">
                        {new Date(player.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-foreground">
                        {player.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <LinkIcon className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        CSS Battle Profile
                      </p>
                      {player.cssbattle_profile_link ? (
                        <a
                          href={player.cssbattle_profile_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          View Profile
                        </a>
                      ) : (
                        <p className="text-foreground">Not linked</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Trophy className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current Score
                      </p>
                      <p className="text-foreground font-bold text-xl">
                        {player.score} points
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Play className="w-5 h-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Video Completed
                      </p>
                      <p className="text-foreground font-bold">
                        {player.video_completed ? (
                          <span className="text-green-500">Yes</span>
                        ) : (
                          <span className="text-red-500">No</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-primary/20">
                <Button
                  onClick={() => navigate(`/admin/dashboard`)}
                  variant="outline"
                  className="border-primary/50"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPlayerDetails;
