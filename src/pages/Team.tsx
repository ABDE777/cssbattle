import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Team = () => {
  const { language } = useLanguage();

  const teamMembers = [
    {
      name: "ABD EL MONIM MAZGOURA",
      email: "mazgouraabdalmounim@gmail.com",
      portfolio: "https://abdelmonim-mazgoura.vercel.app/",
      role:
        language === "en" ? "Full Stack Developer" : "Développeur Full Stack",
      image: "/team/ABDEL.png",
    },
    {
      name: "IBRAHIM CHALLAL",
      email: "i.challal9970@gmail.com",
      portfolio: "https://portfolio-challal.vercel.app",
      role:
        language === "en" ? "Full Stack Developer" : "Développeur Full Stack",
      image: "/team/ibrahim.jpg",
    },
    {
      name: "YOUNES LAHLIBI",
      email: "youneslahlibi@gmai.com",
      portfolio: "https://www.linkedin.com/in/youneslahlibi/",
      role:
        language === "en" ? "Full Stack Developer" : "Développeur Full Stack",
      image: "/team/younes.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {language === "en"
              ? "Our Development Team"
              : "Notre Équipe de Développement"}
          </h1>
          <p className="text-foreground/80 max-w-2xl mx-auto">
            {language === "en"
              ? "Meet the talented developers who brought CSS Battle Championship to life."
              : "Découvrez les développeurs talentueux qui ont donné vie à CSS Battle Championship."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 text-center"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-battle-purple/30">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initial-based image if the image fails to load
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-primary flex items-center justify-center">
                            <span class="text-2xl font-bold text-foreground">
                              ${member.name.charAt(0)}
                            </span>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-battle-purple text-sm mb-3">
                    {member.role}
                  </p>
                  <p className="text-foreground/80 text-xs mb-4">
                    {member.email}
                  </p>
                </div>

                <div>
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-primary text-foreground px-3 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform w-full max-w-[180px]"
                  >
                    {language === "en" ? "View Portfolio" : "Voir Portfolio"}
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
