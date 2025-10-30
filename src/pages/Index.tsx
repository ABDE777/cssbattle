import { Card } from "@/components/ui/card";
import FloatingShape from "@/components/FloatingShape";
import CodeBlock from "@/components/CodeBlock";
import Navbar from "@/components/Navbar";
import { Code2, Trophy, Users, Zap, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language } = useLanguage();
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [daysLeftInMonth, setDaysLeftInMonth] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const codeExample = [
    ".battle {",
    "  display: flex;",
    "  background: linear-gradient(135deg, #A020F0, #E796E7);",
    "  transform: scale(1.1);",
    "}",
  ];

  useEffect(() => {
    // Simple timeout to ensure the DOM is fully loaded
    const timer = setTimeout(() => {
      fetchPlayerCount();
      calculateDaysLeftInMonth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Add effect for the live countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const difference = endOfMonth.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPlayerCount = async () => {
    try {
      const { count, error } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setPlayerCount(count);
      } else {
        // Don't set a fallback value, keep it null to show loading state
        console.error("Error fetching player count:", error);
      }
    } catch (error) {
      // Don't set a fallback value, keep it null to show loading state
      console.error("Error fetching player count:", error);
    }
  };

  const calculateDaysLeftInMonth = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = endOfMonth.getDate() - now.getDate() + 1;
    setDaysLeftInMonth(daysLeft);
  };

  return (
    <main className="min-h-screen bg-background overflow-hidden relative font-heading">
      <Navbar />

      {/* Animated Background Shapes */}
      <div className="hidden sm:block">
        <FloatingShape
          color="purple"
          size={300}
          top="15%"
          left="5%"
          delay={0}
        />
        <FloatingShape
          color="pink"
          size={200}
          top="65%"
          left="80%"
          delay={1}
          rotation
        />
        <FloatingShape
          color="yellow"
          size={150}
          top="35%"
          left="75%"
          delay={0.5}
        />
        <FloatingShape
          color="purple"
          size={100}
          top="85%"
          left="15%"
          delay={1.5}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Left Column - Title and Motivation Message */}
          <div className="flex-1">
            {/* Event Tag */}
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-foreground px-3 py-1.5 rounded-full mb-4 md:mb-6 shadow-glow">
              <Zap className="w-3 h-3" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === "en"
                  ? "Live Competition"
                  : "Compétition en Direct"}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="block text-foreground">CSS</span>
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                BATTLE
              </span>
              <span className="block text-battle-accent">
                {language === "en" ? "CHAMPIONSHIP" : "CHAMPIONNAT"}
              </span>
            </h1>

            {/* Motivation Message */}
            <div className="bg-gradient-to-r from-battle-purple/20 to-indigo-600/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-battle-purple/30">
              <p className="text-base md:text-lg text-foreground/90 italic">
                {language === "en"
                  ? "Push your CSS skills to the limit. Compete with the best developers worldwide."
                  : "Poussez vos compétences CSS à l'extrême. Affrontez les meilleurs développeurs du monde entier."}
              </p>
            </div>
          </div>

          {/* Right Column - Countdown Timer and Buttons */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Creative Countdown Timer */}
            <div className="bg-gradient-to-r from-battle-purple to-indigo-600 rounded-xl p-4 shadow-xl border-2 border-battle-purple/50 w-full max-w-xs mb-6">
              <div className="text-center">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  {language === "en" ? "Time Remaining" : "Temps Restant"}
                </h3>
                <div className="flex justify-center space-x-2">
                  <div className="flex flex-col items-center">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg w-12 h-12 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-battle-purple">
                        {timeLeft.days.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs mt-1 text-foreground/90 font-medium">
                      {language === "en" ? "DAYS" : "JRS"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg w-12 h-12 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-battle-purple">
                        {timeLeft.hours.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs mt-1 text-foreground/90 font-medium">
                      {language === "en" ? "HRS" : "HRS"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg w-12 h-12 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-battle-purple">
                        {timeLeft.minutes.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs mt-1 text-foreground/90 font-medium">
                      {language === "en" ? "MIN" : "MIN"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg w-12 h-12 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-battle-purple">
                        {timeLeft.seconds.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs mt-1 text-foreground/90 font-medium">
                      {language === "en" ? "SEC" : "SEC"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              {/* Register Button - Only show when not logged in */}
              {!user && !isAdmin && (
                <button
                  onClick={() =>
                    window.open("https://css-battle-isfo.vercel.app/", "_blank")
                  }
                  className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow px-4 py-2 rounded-lg font-semibold text-foreground text-sm"
                >
                  {t("navbar.register")}
                </button>
              )}

              {/* Daily Challenge Button */}
              <a
                href="https://cssbattle.dev/daily"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center bg-gradient-primary text-foreground px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform shadow-glow text-sm"
              >
                {language === "en"
                  ? "View Today's Challenge"
                  : "Voir Défi du Jour"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="relative z-10 container mx-auto px-4 pb-8 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-6xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-pink/30 p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-glow-pink">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-battle-pink rounded-lg flex items-center justify-center mb-3 shadow-glow-pink">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-background" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1 text-foreground">
                {language === "en" ? "Players" : "Joueurs"}
              </h3>
              <p className="text-xl md:text-2xl font-bold text-battle-pink mb-1">
                {playerCount !== null ? playerCount.toLocaleString() : "..."}
              </p>
              <p className="text-sm text-foreground/70">
                {language === "en"
                  ? "Developers competing"
                  : "Développeurs en compétition"}
              </p>
            </div>
          </Card>

          {/* Event Information Card */}
          <Card className="bg-gradient-primary p-4 md:p-6 text-center shadow-glow flex flex-col justify-between h-full">
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <div className="bg-background/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-lg">
                <span className="text-white">
                  {language === "en" ? "Online Event" : "Événement en Ligne"}
                </span>
              </div>
              <div className="bg-background/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-lg">
                <span className="text-white">
                  {language === "en"
                    ? "All Skill Levels"
                    : "Tous Niveaux de Compétence"}
                </span>
              </div>
              <div className="bg-background/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-lg">
                <span className="text-white">
                  {language === "en"
                    ? "Live Leaderboard"
                    : "Classement en Direct"}
                </span>
              </div>
            </div>

            {/* Monthly Counter Card */}
            <Card className="mt-4 bg-background/30 backdrop-blur-sm border-foreground/20 p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-foreground" />
                <h3 className="text-sm md:text-base font-bold text-foreground">
                  {language === "en"
                    ? "Days Left This Month"
                    : "Jours Restants Ce Mois"}
                </h3>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">
                {daysLeftInMonth}
              </p>
            </Card>
          </Card>
        </div>
      </section>

      {/* Removed the separate Event Details section since it's now integrated above */}
    </main>
  );
};

export default Index;
