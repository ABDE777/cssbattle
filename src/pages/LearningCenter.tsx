import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const LearningCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language } = useLanguage();

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  // YouTube video ID (extracted from https://youtu.be/tCDvOQI3pco)
  const YOUTUBE_VIDEO_ID = "tCDvOQI3pco";

  // Video state
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoCompletionChecked, setVideoCompletionChecked] = useState(false);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [quizCompletionChecked, setQuizCompletionChecked] = useState(false);

  // Check if user has already completed the quiz
  useEffect(() => {
    setQuizCompletionChecked(false);

    const checkQuizCompletion = async () => {
      if (!user) return;

      setTimeout(async () => {
        try {
          const completionKey = `quiz_completed_${user.id}`;
          const localStorageCompleted = localStorage.getItem(completionKey) === "true";

          if (localStorageCompleted) {
            setQuizCompleted(true);
            const scoreKey = `quiz_score_${user.id}`;
            const savedScore = localStorage.getItem(scoreKey);
            if (savedScore) {
              setQuizScore(parseInt(savedScore, 10));
            }
            setQuizCompletionChecked(true);
            return;
          }

          const { data, error } = await supabase
            .from("quiz_scores")
            .select("score")
            .eq("player_id", user.id)
            .limit(1);

          if (error) {
            console.error("Error checking quiz completion:", error);
            setQuizCompletionChecked(true);
            return;
          }

          if (data && data.length > 0) {
            setQuizCompleted(true);
            setQuizScore(data[0].score);
            const completionKey = `quiz_completed_${user.id}`;
            const scoreKey = `quiz_score_${user.id}`;
            localStorage.setItem(completionKey, "true");
            localStorage.setItem(scoreKey, data[0].score.toString());
          }
        } catch (error) {
          console.error("Failed to check quiz completion:", error);
        } finally {
          setQuizCompletionChecked(true);
        }
      }, 100);
    };

    checkQuizCompletion();
  }, [user, language]);

  useEffect(() => {
    const saveScore = async (score: number) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("quiz_scores").insert({
          player_id: user.id,
          score: score,
          total_questions: quizQuestions.length,
          quiz_title: "CSS Battle Quiz",
        });

        if (error) throw error;

        const completionKey = `quiz_completed_${user.id}`;
        const scoreKey = `quiz_score_${user.id}`;
        localStorage.setItem(completionKey, "true");
        localStorage.setItem(scoreKey, score.toString());

        setScoreSaved(true);
        toast({
          title: "Success",
          description: "Quiz completed successfully! Your score has been saved.",
        });
      } catch (e) {
        console.error("Failed to save quiz score", e);
        toast({
          title: "Error",
          description: "Failed to save quiz score. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (quizCompleted && !scoreSaved) {
      saveScore(quizScore);
    }
  }, [quizCompleted, scoreSaved, user, quizScore, toast]);

  // Sample quiz questions
  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question:
        language === "en"
          ? "What is the main purpose of CSS Battle?"
          : "Quel est le but principal de CSS Battle ?",
      options:
        language === "en"
          ? [
              "To compete in JavaScript coding challenges",
              "To improve CSS skills through visual challenges",
              "To learn HTML structure",
              "To practice database queries",
            ]
          : [
              "Participer à des défis de codage JavaScript",
              "Améliorer les compétences CSS grâce à des défis visuels",
              "Apprendre la structure HTML",
              "Pratiquer les requêtes de base de données",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "CSS Battle is a platform designed to help developers improve their CSS skills through fun, visual challenges."
          : "CSS Battle est une plateforme conçue pour aider les développeurs à améliorer leurs compétences CSS grâce à des défis visuels amusants.",
    },
    {
      id: 2,
      question:
        language === "en"
          ? "How are scores calculated in CSS Battle?"
          : "Comment les scores sont-ils calculés dans CSS Battle ?",
      options:
        language === "en"
          ? [
              "Based on lines of code written",
              "Based on accuracy and code efficiency",
              "Based on time spent",
              "Based on number of attempts",
            ]
          : [
              "Basé sur le nombre de lignes de code écrites",
              "Basé sur la précision et l'efficacité du code",
              "Basé sur le temps passé",
              "Basé sur le nombre de tentatives",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "Scores are calculated based on how closely your CSS matches the target image, with efficiency measured by code length."
          : "Les scores sont calculés en fonction de la ressemblance entre votre CSS et l'image cible, avec une efficacité mesurée par la longueur du code.",
    },
    {
      id: 3,
      question:
        language === "en"
          ? "Which CSS property is most important in CSS Battle?"
          : "Quelle propriété CSS est la plus importante dans CSS Battle ?",
      options:
        language === "en"
          ? ["background-color", "position", "clip-path", "All of the above"]
          : [
              "background-color",
              "position",
              "clip-path",
              "Toutes les réponses ci-dessus",
            ],
      correctAnswer: 3,
      explanation:
        language === "en"
          ? "CSS Battle challenges often require a combination of properties, including positioning, background colors, and clip-path for complex shapes."
          : "Les défis CSS Battle nécessitent souvent une combinaison de propriétés, notamment le positionnement, les couleurs d'arrière-plan et clip-path pour les formes complexes.",
    },
    {
      id: 4,
      question:
        language === "en" ? "What does CSS stand for?" : "Que signifie CSS ?",
      options:
        language === "en"
          ? [
              "Computer Style Sheets",
              "Creative Style System",
              "Cascading Style Sheets",
              "Colorful Style Sheets",
            ]
          : [
              "Computer Style Sheets",
              "Creative Style System",
              "Cascading Style Sheets",
              "Colorful Style Sheets",
            ],
      correctAnswer: 2,
      explanation:
        language === "en"
          ? "CSS stands for Cascading Style Sheets, which is used to style and layout web pages."
          : "CSS signifie Cascading Style Sheets, utilisé pour styliser et mettre en page les pages web.",
    },
    {
      id: 5,
      question:
        language === "en"
          ? "Which CSS property is used to change the text color?"
          : "Quelle propriété CSS est utilisée pour changer la couleur du texte ?",
      options:
        language === "en"
          ? ["font-color", "text-color", "color", "text-style"]
          : ["font-color", "text-color", "color", "text-style"],
      correctAnswer: 2,
      explanation:
        language === "en"
          ? "The 'color' property is used to set the color of text in CSS."
          : "La propriété 'color' est utilisée pour définir la couleur du texte en CSS.",
    },
    {
      id: 6,
      question:
        language === "en"
          ? "What is the CSS Grid 'fr' unit used for?"
          : "À quoi sert l'unité CSS Grid 'fr' ?",
      options:
        language === "en"
          ? [
              "To set font size",
              "To represent a fraction of available space",
              "To create flexible borders",
              "To define frame rates",
            ]
          : [
              "Pour définir la taille de la police",
              "Pour représenter une fraction de l'espace disponible",
              "Pour créer des bordures flexibles",
              "Pour définir les fréquences d'images",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "The 'fr' unit in CSS Grid represents a fraction of the available space in the grid container."
          : "L'unité 'fr' dans CSS Grid représente une fraction de l'espace disponible dans le conteneur de la grille.",
    },
  ];

  // Check if user has already completed the video
  useEffect(() => {
    setVideoCompletionChecked(false);

    const checkVideoCompletion = async () => {
      if (!user) return;

      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from("players")
            .select("video_completed")
            .eq("id", user.id)
            .limit(1);

          if (error) {
            console.error("Error checking video completion:", error);
            setVideoCompletionChecked(true);
            return;
          }

          if (data && data.length > 0 && data[0].video_completed) {
            setVideoCompleted(true);
          }
        } catch (error) {
          console.error("Failed to check video completion:", error);
        } finally {
          setVideoCompletionChecked(true);
        }
      }, 100);
    };

    checkVideoCompletion();
  }, [user, language]);

  // Save video completion status
  const saveVideoCompletion = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({
          video_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Failed to save video completion:", error);
      } else {
        console.log("Video completion saved for user", user.id);
      }
    } catch (error) {
      console.error("Failed to save video completion:", error);
    }
  };

  const handleVideoComplete = async () => {
    setVideoCompleted(true);
    await saveVideoCompletion();
    toast({
      title: language === "en" ? "Video Completed!" : "Vidéo terminée !",
      description:
        language === "en"
          ? "You can now take the quiz below"
          : "Vous pouvez maintenant passer le quiz ci-dessous",
      duration: 3000,
    });
  };

  const handleVideoReset = async () => {
    setVideoCompleted(false);
    if (user) {
      await supabase
        .from("players")
        .update({
          video_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizCompleted) {
      toast({
        title: language === "en" ? "Quiz Already Completed" : "Quiz déjà terminé",
        description:
          language === "en"
            ? "You have already completed this quiz."
            : "Vous avez déjà terminé ce quiz.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnswer(answerIndex);
  };

  const handleQuizSubmit = () => {
    if (quizCompleted) {
      toast({
        title: language === "en" ? "Quiz Already Completed" : "Quiz déjà terminé",
        description:
          language === "en"
            ? "You have already completed this quiz."
            : "Vous avez déjà terminé ce quiz.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAnswer === null) {
      toast({
        title: language === "en" ? "No Answer Selected" : "Aucune réponse sélectionnée",
        description:
          language === "en"
            ? "Please select an answer before submitting"
            : "Veuillez sélectionner une réponse avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    const currentQ = quizQuestions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizCompleted(true);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={200} top="10%" left="5%" delay={0} />
      <FloatingShape color="pink" size={150} top="70%" left="85%" delay={1} rotation />
      <FloatingShape color="yellow" size={100} top="40%" left="80%" delay={0.5} />
      <FloatingShape color="purple" size={120} top="85%" left="15%" delay={1.5} />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              {t("learning.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("learning.subtitle")}
            </p>
          </div>

          {/* Video Section */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {videoCompleted && <CheckCircle className="text-green-500" />}
                {language === "en" ? "CSS Battle Tutorial" : "Tutoriel CSS Battle"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1&controls=1&disablekb=1`}
                  title="CSS Battle Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>

              <div className="flex gap-2 justify-center">
                {!videoCompleted && (
                  <Button onClick={handleVideoComplete} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {language === "en" ? "Mark as Complete" : "Marquer comme terminé"}
                  </Button>
                )}
                {(videoCompleted || isAdmin) && (
                  <Button onClick={handleVideoReset} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {language === "en" ? "Reset" : "Réinitialiser"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Section */}
          {videoCompleted ? (
            quizCompleted ? (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    {language === "en" ? "Quiz Completed!" : "Quiz terminé !"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-2xl font-bold mb-4">
                    {language === "en" ? "Your Score:" : "Votre score :"}
                  </p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                    {quizScore} / {quizQuestions.length}
                  </p>
                  <p className="text-muted-foreground">
                    {language === "en"
                      ? "You can only take this quiz once. Your score has been saved."
                      : "Vous ne pouvez passer ce quiz qu'une seule fois. Votre score a été enregistré."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle>
                    {language === "en" ? "Quiz" : "Quiz"} - {language === "en" ? "Question" : "Question"} {currentQuestion + 1}/{quizQuestions.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {quizQuestions[currentQuestion].question}
                    </h3>
                    <div className="space-y-3">
                      {quizQuestions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showResult}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            selectedAnswer === index
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          } ${showResult ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {showResult && (
                    <div
                      className={`p-4 rounded-lg mb-4 ${
                        selectedAnswer === quizQuestions[currentQuestion].correctAnswer
                          ? "bg-green-500/10 border border-green-500"
                          : "bg-red-500/10 border border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {selectedAnswer === quizQuestions[currentQuestion].correctAnswer ? (
                          <>
                            <CheckCircle className="text-green-500" />
                            <span className="font-semibold text-green-500">
                              {language === "en" ? "Correct!" : "Correct !"}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="text-red-500" />
                            <span className="font-semibold text-red-500">
                              {language === "en" ? "Incorrect" : "Incorrect"}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm">{quizQuestions[currentQuestion].explanation}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleQuizSubmit}
                    disabled={selectedAnswer === null || showResult}
                    className="w-full"
                  >
                    {currentQuestion < quizQuestions.length - 1
                      ? language === "en"
                        ? "Next Question"
                        : "Question suivante"
                      : language === "en"
                      ? "Finish Quiz"
                      : "Terminer le quiz"}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "en" ? "Complete the Video First" : "Terminez d'abord la vidéo"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "Please watch the complete tutorial video before taking the quiz"
                    : "Veuillez regarder la vidéo complète avant de passer le quiz"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LearningCenter;
