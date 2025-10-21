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

  const fetchPlayerCount = async () => {
    try {
      const { count, error } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setPlayerCount(count);
      } else {
        setPlayerCount(1000); // Default fallback value
      }
    } catch (error) {
      setPlayerCount(1000); // Default fallback value
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
      <FloatingShape color="purple" size={300} top="15%" left="5%" delay={0} />
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

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="text-center">
          {/* Event Tag */}
          <div className="inline-flex items-center gap-2 bg-gradient-primary text-foreground px-4 py-2 rounded-full mb-6 md:mb-8 shadow-glow">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {language === "en" ? "Live Competition" : "Compétition en Direct"}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-tight">
            <span className="block text-foreground">CSS</span>
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>
            <span className="block text-battle-accent">
              {language === "en" ? "CHAMPIONSHIP" : "CHAMPIONNAT"}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 mb-8 md:mb-12 max-w-3xl mx-auto">
            {language === "en"
              ? "Compete with other players. Write the cleanest code. Claim victory."
              : "Affrontez des autres joueurs. Écrivez le code le plus propre. Remportez la victoire."}
          </p>

          {/* Code Example */}
          <div className="max-w-2xl mx-auto mb-12 md:mb-16">
            <CodeBlock lines={codeExample} className="animate-float" />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="relative z-10 container mx-auto px-4 pb-8 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-pink/30 p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-glow-pink">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-battle-pink rounded-lg flex items-center justify-center mb-3 shadow-glow-pink">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-background" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1 text-foreground">
                {language === "en" ? "Players" : "Joueurs"}
              </h3>
              <p className="text-xl md:text-2xl font-bold text-battle-pink mb-1">
                {playerCount !== null ? playerCount.toLocaleString() : "20+"}
              </p>
              <p className="text-sm text-foreground/70">
                {language === "en"
                  ? "Developers competing"
                  : "Développeurs en compétition"}
              </p>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-accent/30 p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-glow-accent">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-battle-accent rounded-lg flex items-center justify-center mb-3 shadow-glow-accent">
                <Code2 className="w-5 h-5 md:w-6 md:h-6 text-background" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1 text-foreground">
                {language === "en" ? "Challenges" : "Défis"}
              </h3>
              <p className="text-xl md:text-2xl font-bold text-battle-accent mb-1">
                50+
              </p>
              <p className="text-sm text-foreground/70">
                {language === "en"
                  ? "Unique CSS battles"
                  : "Batailles CSS uniques"}
              </p>
            </div>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-glow">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 shadow-glow">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1 text-foreground">
                {language === "en" ? "Daily Challenge" : "Défi Quotidien"}
              </h3>
              <p className="text-sm text-foreground/70 mb-3">
                {language === "en"
                  ? "Test your skills"
                  : "Testez vos compétences"}
              </p>
              <a
                href="https://cssbattle.dev/daily"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-primary text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform shadow-glow"
              >
                {language === "en" ? "Take Challenge" : "Relever le Défi"}
              </a>
            </div>
          </Card>
        </div>
      </section>

      {/* Event Details */}
      <section className="relative z-10 container mx-auto px-4 pb-12 md:pb-20">
        <Card className="bg-gradient-primary p-6 md:p-8 text-center shadow-glow max-w-3xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center text-sm md:text-base">
            <div className="bg-background/20 backdrop-blur-sm px-3 md:px-5 py-1.5 md:py-2 rounded-lg">
              <span className="text-foreground/80">
                {language === "en" ? "Online Event" : "Événement en Ligne"}
              </span>
            </div>
            <div className="bg-background/20 backdrop-blur-sm px-3 md:px-5 py-1.5 md:py-2 rounded-lg">
              <span className="text-foreground/80">
                {language === "en"
                  ? "All Skill Levels"
                  : "Tous Niveaux de Compétence"}
              </span>
            </div>
            <div className="bg-background/20 backdrop-blur-sm px-3 md:px-5 py-1.5 md:py-2 rounded-lg">
              <span className="text-foreground/80">
                {language === "en"
                  ? "Live Leaderboard"
                  : "Classement en Direct"}
              </span>
            </div>
          </div>

          {/* Monthly Counter Card */}
          <Card className="mt-8 bg-background/30 backdrop-blur-sm border-foreground/20 p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-foreground" />
              <h3 className="text-lg md:text-xl font-bold text-foreground">
                {language === "en"
                  ? "Days Left This Month"
                  : "Jours Restants Ce Mois"}
              </h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-battle-accent">
              {daysLeftInMonth}
            </p>
          </Card>
        </Card>
      </section>
    </main>
  );
};

export default Index;
