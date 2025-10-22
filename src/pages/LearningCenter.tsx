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
import YouTubePlayer from "@/components/YouTubePlayer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import { supabase } from "@/integrations/supabase/client";
import {
  getQuizStorageData,
  saveQuizStorageData,
  clearQuizStorageData,
  syncQuizStorageWithDatabase,
} from "@/lib/quizStorage";

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
          // Always check the database first for the most up-to-date information
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
            // User has completed the quiz, sync with localStorage
            const score = data[0].score;
            setQuizCompleted(true);
            setQuizScore(score);
            syncQuizStorageWithDatabase(user.id, score);
          } else {
            // User has not completed the quiz, clear localStorage
            setQuizCompleted(false);
            setQuizScore(0);
            syncQuizStorageWithDatabase(user.id, null);
          }
        } catch (error) {
          console.error("Failed to check quiz completion:", error);
        } finally {
          setQuizCompletionChecked(true);
        }
      }, 100);
    };

    checkQuizCompletion();

    // Cleanup function
    return () => {
      // Clear any pending timeouts
    };
  }, [user, language]);

  useEffect(() => {
    const saveScore = async (score: number) => {
      if (!user) return;

      try {
        // First, check if a score already exists for this player
        const { data: existingScores, error: checkError } = await supabase
          .from("quiz_scores")
          .select("id")
          .eq("player_id", user.id)
          .limit(1);

        if (checkError) {
          throw new Error(
            `Failed to check existing scores: ${checkError.message}`
          );
        }

        let error;
        if (existingScores && existingScores.length > 0) {
          // If score exists, update it instead of inserting
          console.log("Updating existing quiz score for player", user.id);
          const { error: updateError } = await supabase
            .from("quiz_scores")
            .update({
              score: score,
              total_questions: 6, // Fixed value since we know the quiz has 6 questions
              quiz_title: "CSS Battle Quiz",
              completed_at: new Date().toISOString(),
            })
            .eq("player_id", user.id);
          error = updateError;
        } else {
          // If no score exists, insert a new one
          console.log("Inserting new quiz score for player", user.id);
          const { error: insertError } = await supabase
            .from("quiz_scores")
            .insert({
              player_id: user.id,
              score: score,
              total_questions: 6, // Fixed value since we know the quiz has 6 questions
              quiz_title: "CSS Battle Quiz",
            });
          error = insertError;
        }

        if (error)
          throw new Error(`Database operation failed: ${error.message}`);

        // Update localStorage with the latest information
        saveQuizStorageData(user.id, score);

        setScoreSaved(true);
        toast({
          title: language === "en" ? "Success" : "Succès",
          description:
            language === "en"
              ? "Quiz completed successfully! Your score has been saved."
              : "Quiz terminé avec succès ! Votre score a été enregistré.",
        });
      } catch (e) {
        console.error("Failed to save quiz score", e);
        const errorMessage =
          e instanceof Error ? e.message : "Unknown error occurred";

        // Clear localStorage on error to prevent stale data
        clearQuizStorageData(user.id);

        toast({
          title: language === "en" ? "Error" : "Erreur",
          description:
            language === "en"
              ? `Failed to save quiz score: ${errorMessage}. Please try again.`
              : `Échec de l'enregistrement du score du quiz : ${errorMessage}. Veuillez réessayer.`,
          variant: "destructive",
        });
      }
    };

    if (quizCompleted && !scoreSaved) {
      saveScore(quizScore);
    }
  }, [quizCompleted, scoreSaved, user, quizScore, toast, language]);

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
          } else {
            // Video not completed, ensure state is reset
            setVideoCompleted(false);
          }
        } catch (error) {
          console.error("Failed to check video completion:", error);
        } finally {
          setVideoCompletionChecked(true);
        }
      }, 100);
    };

    checkVideoCompletion();

    // Cleanup function
    return () => {
      // Clear any pending timeouts
    };
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
    // Only save if not already completed
    if (!videoCompleted) {
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
    }
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
        title:
          language === "en" ? "Quiz Already Completed" : "Quiz déjà terminé",
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
        title:
          language === "en" ? "Quiz Already Completed" : "Quiz déjà terminé",
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
        title:
          language === "en"
            ? "No Answer Selected"
            : "Aucune réponse sélectionnée",
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

  const handleQuizReset = () => {
    // Reset quiz state
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setScoreSaved(false);

    // Clear localStorage for this user
    if (user) {
      clearQuizStorageData(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes - Made responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop shapes */}
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
        {/* Mobile shapes - smaller and fewer to avoid clutter */}
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
              {t("learning.title")}
            </h1>
            <p className="text-muted-foreground">{t("learning.subtitle")}</p>
          </div>

          {/* Video Section */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {videoCompleted && <CheckCircle className="text-green-500" />}
                {language === "en"
                  ? "CSS Battle Tutorial"
                  : "Tutoriel CSS Battle"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YouTubePlayer
                videoId={YOUTUBE_VIDEO_ID}
                onVideoComplete={handleVideoComplete}
                onVideoReset={handleVideoReset}
                isCompleted={videoCompleted}
                isAdmin={isAdmin}
              />
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
                    {language === "en" ? "Quiz" : "Quiz"} -{" "}
                    {language === "en" ? "Question" : "Question"}{" "}
                    {currentQuestion + 1}/{quizQuestions.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {quizQuestions[currentQuestion].question}
                    </h3>
                    <div className="space-y-3">
                      {quizQuestions[currentQuestion].options.map(
                        (option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showResult}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                              selectedAnswer === index
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            } ${
                              showResult
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                          >
                            {option}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {showResult && (
                    <div
                      className={`p-4 rounded-lg mb-4 ${
                        selectedAnswer ===
                        quizQuestions[currentQuestion].correctAnswer
                          ? "bg-green-500/10 border border-green-500"
                          : "bg-red-500/10 border border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {selectedAnswer ===
                        quizQuestions[currentQuestion].correctAnswer ? (
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
                      <p className="text-sm">
                        {quizQuestions[currentQuestion].explanation}
                      </p>
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
                  {language === "en"
                    ? "Complete the Video First"
                    : "Terminez d'abord la vidéo"}
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
