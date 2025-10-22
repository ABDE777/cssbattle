import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import FloatingShape from "@/components/FloatingShape";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import {
  User as UserIcon,
  Mail,
  Link,
  ArrowLeft,
  Save,
  User,
  Users,
  Shield,
  Phone,
  Trophy,
  Medal,
  Crown,
  RefreshCw,
} from "lucide-react";
import { GROUP_OPTIONS } from "@/constants/groups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LogoutButton from "@/components/LogoutButton";

interface PlayerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  group_name: string | null;
  cssbattle_profile_link: string | null;
  profile_image_url: string | null;
}

interface LeaderboardPlayer {
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

const ProfileNew = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    cssBattleProfileLink: "",
    phoneNumber: "",
    group: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [isMonthlyWinner, setIsMonthlyWinner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  // Fetch player profile data
  const fetchPlayerProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("players")
        .select(
          "id, full_name, email, phone, group_name, cssbattle_profile_link, profile_image_url"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      setPlayerProfile(data);
      setFormData({
        fullName: data.full_name || "",
        cssBattleProfileLink: data.cssbattle_profile_link || "",
        phoneNumber: data.phone || "",
        group: data.group_name || "",
      });
    } catch (err) {
      console.error("Error fetching player profile:", err);
      setError(`Failed to load profile: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch player's rank and score from leaderboard
  const fetchPlayerRankAndScore = async () => {
    if (!user?.email) return;

    try {
      // Get all players sorted by score
      const { data, error } = await supabase
        .from("players")
        .select("id, full_name, score, group_name, email");

      if (error) {
        console.error("Error fetching leaderboard data:", error);
        return;
      }

      // Sort players by score in descending order
      const sortedPlayers = (data || []).sort((a, b) => {
        const scoreA = a.score !== null && a.score !== undefined ? a.score : 0;
        const scoreB = b.score !== null && b.score !== undefined ? b.score : 0;
        return scoreB - scoreA;
      });

      // Find current user's rank and score
      const userIndex = sortedPlayers.findIndex((p) => p.email === user.email);
      if (userIndex !== -1) {
        setPlayerRank(userIndex + 1);
        setPlayerScore(sortedPlayers[userIndex].score || 0);
      } else {
        setPlayerRank(null);
        setPlayerScore(null);
      }
    } catch (err) {
      console.error("Error fetching player rank and score:", err);
    }
  };

  // Check if player is a monthly winner
  const checkMonthlyWinnerStatus = async () => {
    if (!user?.id) return;

    try {
      // For now, we'll just set this to false since we're having issues with the Supabase types
      // This can be implemented later when the types are updated
      setIsMonthlyWinner(false);
    } catch (err) {
      console.error("Error checking monthly winner status:", err);
    }
  };

  useEffect(() => {
    fetchPlayerProfile();

    // Only fetch rank and score if user email is available
    if (user?.email) {
      fetchPlayerRankAndScore();
      checkMonthlyWinnerStatus();

      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPlayerRankAndScore();
        checkMonthlyWinnerStatus();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, user?.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGroupChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      group: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerProfile?.id) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("players")
        .update({
          full_name: formData.fullName,
          cssbattle_profile_link: formData.cssBattleProfileLink || null,
          phone: formData.phoneNumber || null,
          group_name: formData.group || null,
        })
        .eq("id", playerProfile.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      // Refresh the profile data
      await fetchPlayerProfile();
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(`Failed to update profile: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Delete old image if exists
      if (playerProfile?.profile_image_url) {
        const oldPath = playerProfile.profile_image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update player profile with new image URL
      const { error: updateError } = await supabase
        .from('players')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchPlayerProfile();
      setSuccess('Profile image updated successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      setError(`Failed to upload image: ${(err as Error).message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Not Logged In
          </h2>
          <p className="text-foreground/80 mb-6">
            You need to be logged in to view this page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/login")}
              className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
            >
              Log In
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10"
            >
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battle-purple mx-auto mb-4"></div>
          <p className="text-foreground/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 mt-16 sm:mt-20 overflow-hidden relative">
      {/* Animated Background Shapes - Made responsive and contained */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop shapes */}
        <div className="hidden sm:block">
          <FloatingShape
            color="purple"
            size={80}
            top="5%"
            left="90%"
            delay={0}
          />
          <FloatingShape
            color="pink"
            size={60}
            top="75%"
            left="5%"
            delay={1}
            rotation
          />
          <FloatingShape
            color="yellow"
            size={50}
            top="45%"
            left="85%"
            delay={0.5}
          />
          <FloatingShape
            color="purple"
            size={60}
            top="85%"
            left="15%"
            delay={1.5}
          />
        </div>
        {/* Mobile shapes - smaller and fewer to avoid clutter */}
        <div className="sm:hidden">
          <FloatingShape
            color="purple"
            size={50}
            top="10%"
            left="80%"
            delay={0}
          />
          <FloatingShape
            color="pink"
            size={40}
            top="80%"
            left="15%"
            delay={1}
            rotation
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10 px-2 py-1 h-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back to Home</span>
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center flex-1 text-foreground px-2">
            CSS{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>{" "}
            <span className="hidden xs:inline">Championship</span>
          </h1>
          <div className="w-12 sm:w-16 md:w-24"></div>{" "}
          {/* Spacer for alignment on larger screens */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden">
                {playerProfile?.profile_image_url ? (
                  <img 
                    src={playerProfile.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-foreground" />
                )}
              </div>
              <label 
                htmlFor="profile-image-upload" 
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white rounded-full p-2 cursor-pointer shadow-lg transition-all"
              >
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                {uploadingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </label>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Profile
            </h2>
            <p className="text-foreground/80">
              Manage your account information
            </p>

            {/* Winner Badge */}
            {isMonthlyWinner && (
              <div className="mt-2 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-500">
                    {language === "en" ? "Monthly Winner" : "Gagnant du Mois"}
                  </span>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mt-2 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1 text-battle-accent" />
                <span className="text-sm text-battle-accent font-medium">
                  Admin User
                </span>
              </div>
            )}

            {/* Player Rank and Score */}
            {playerRank !== null && playerScore !== null && (
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                <div className="flex items-center bg-card/50 border border-battle-purple/30 rounded-lg px-4 py-2">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  <div>
                    <p className="text-xs text-foreground/70">Rank</p>
                    <p className="text-lg font-bold text-foreground">
                      #{playerRank}
                    </p>
                  </div>
                </div>
                <div className="flex items-center bg-card/50 border border-battle-purple/30 rounded-lg px-4 py-2">
                  <Medal className="w-5 h-5 mr-2 text-primary" />
                  <div>
                    <p className="text-xs text-foreground/70">Score</p>
                    <p className="text-lg font-bold text-foreground">
                      {playerScore.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPlayerRankAndScore}
                  className="border-battle-purple/50 hover:bg-battle-purple/10"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-foreground">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-foreground">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-foreground/70"
              >
                Full Name
              </Label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="pl-10 bg-background/50 border-battle-purple/30 w-full"
                    required
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {playerProfile?.full_name || "Not provided"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground/70"
              >
                Email
              </Label>
              <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="break-all">
                    {playerProfile?.email || "Not provided"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-foreground/50">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phoneNumber"
                className="text-sm font-medium text-foreground/70"
              >
                Phone Number
              </Label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="pl-10 bg-background/50 border-battle-purple/30 w-full"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {playerProfile?.phone ? (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="break-all">{playerProfile.phone}</span>
                    </div>
                  ) : (
                    <span className="text-foreground/50">Not provided</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="group"
                className="text-sm font-medium text-foreground/70"
              >
                Player Group
              </Label>
              {isEditing ? (
                <Select
                  value={formData.group}
                  onValueChange={handleGroupChange}
                >
                  <SelectTrigger className="bg-background/50 border-battle-purple/30 w-full">
                    <SelectValue placeholder="Select your group" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_OPTIONS.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="break-all">
                      {playerProfile?.group_name
                        ? GROUP_OPTIONS.find(
                            (option) =>
                              option.value === playerProfile.group_name
                          )?.label || playerProfile.group_name
                        : "No group assigned"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cssBattleProfileLink"
                className="text-sm font-medium text-foreground/70"
              >
                CSSBattle Profile
              </Label>
              {isEditing ? (
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="cssBattleProfileLink"
                    name="cssBattleProfileLink"
                    value={formData.cssBattleProfileLink}
                    onChange={handleInputChange}
                    placeholder="https://cssbattle.dev/player/..."
                    className="pl-10 bg-background/50 border-battle-purple/30 w-full"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {playerProfile?.cssbattle_profile_link ? (
                    <div className="flex items-center">
                      <Link className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <a
                        href={playerProfile.cssbattle_profile_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-battle-purple hover:underline break-all"
                      >
                        {playerProfile.cssbattle_profile_link}
                      </a>
                    </div>
                  ) : (
                    <span className="text-foreground/50">Not provided</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data to original values
                      setFormData({
                        fullName: playerProfile?.full_name || "",
                        cssBattleProfileLink:
                          playerProfile?.cssbattle_profile_link || "",
                        phoneNumber: playerProfile?.phone || "",
                        group: playerProfile?.group_name || "",
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                    className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                  >
                    Edit Profile
                  </Button>

                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/dashboard")}
                      className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Admin Dashboard</span>
                      <span className="xs:hidden">Admin</span>
                    </Button>
                  )}
                  <LogoutButton className="flex-1" />
                </div>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileNew;
