import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
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
}

const ProfileNew = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
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

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  // Fetch player profile data
  const fetchPlayerProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("players")
        .select("id, full_name, email, phone, group_name, cssbattle_profile_link")
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

  useEffect(() => {
    fetchPlayerProfile();
  }, [user?.id]);

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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-20 overflow-hidden relative">
      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={220} top="8%" left="85%" delay={0} />
      <FloatingShape
        color="pink"
        size={160}
        top="75%"
        left="10%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={110}
        top="45%"
        left="80%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={130}
        top="85%"
        left="25%"
        delay={1.5}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:bg-battle-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-center flex-1 text-foreground">
            CSS{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>{" "}
            Championship
          </h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-12 h-12 text-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Profile
            </h2>
            <p className="text-foreground/80">
              Manage your account information
            </p>
            {isAdmin && (
              <div className="mt-2 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1 text-battle-accent" />
                <span className="text-sm text-battle-accent font-medium">
                  Admin User
                </span>
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
                    className="pl-10 bg-background/50 border-battle-purple/30"
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
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {playerProfile?.email || "Not provided"}
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
                    className="pl-10 bg-background/50 border-battle-purple/30"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {playerProfile?.phone ? (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {playerProfile.phone}
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
                  <SelectTrigger className="bg-background/50 border-battle-purple/30">
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
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    {playerProfile?.group_name
                      ? GROUP_OPTIONS.find(
                          (option) => option.value === playerProfile.group_name
                        )?.label || playerProfile.group_name
                      : "No group assigned"}
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
                    className="pl-10 bg-background/50 border-battle-purple/30"
                  />
                </div>
              ) : (
                <div className="p-3 bg-background/50 border border-battle-purple/30 rounded-md">
                  {playerProfile?.cssbattle_profile_link ? (
                    <div className="flex items-center">
                      <Link className="w-4 h-4 mr-2 text-muted-foreground" />
                      <a
                        href={playerProfile.cssbattle_profile_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-battle-purple hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  ) : (
                    <span className="text-foreground/50">Not provided</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
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
                        cssBattleProfileLink: playerProfile?.cssbattle_profile_link || "",
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
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
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
                      Admin Dashboard
                    </Button>
                  )}
                  <LogoutButton className="flex-1" />
                </>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileNew;