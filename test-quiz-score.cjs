const { createClient } = require("@supabase/supabase-js");

// Replace with your actual Supabase URL and public key
const SUPABASE_URL = "https://ubjttptjigwbjwqyiwmi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianR0cHRqaWd3Ymp3cXlpd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTI2NjgsImV4cCI6MjA3NjE4ODY2OH0.ZtCjm5IaMPRGoQpXu6L2iM7TzCPdGEL8iru2UQdpvLA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testQuizScoreOperations() {
  console.log("Testing quiz score operations...");

  try {
    // Test player ID (use an existing player ID from your database)
    const testPlayerId = "47728a9b-5022-4a61-b3c3-1b5344bb83a8"; // This should be a valid player ID

    // Check if a score already exists for this player
    console.log("Checking existing scores for player", testPlayerId);
    const { data: existingScores, error: checkError } = await supabase
      .from("quiz_scores")
      .select("id, score")
      .eq("player_id", testPlayerId)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing scores:", checkError);
      return;
    }

    console.log("Existing scores:", existingScores);

    const newScore = Math.floor(Math.random() * 6); // Random score between 0-5
    console.log("Attempting to save new score:", newScore);

    let error;
    if (existingScores && existingScores.length > 0) {
      // If score exists, update it
      console.log("Updating existing quiz score");
      const { error: updateError } = await supabase
        .from("quiz_scores")
        .update({
          score: newScore,
          total_questions: 6,
          quiz_title: "CSS Battle Quiz",
          completed_at: new Date().toISOString(),
        })
        .eq("player_id", testPlayerId);
      error = updateError;
    } else {
      // If no score exists, insert a new one
      console.log("Inserting new quiz score");
      const { error: insertError } = await supabase.from("quiz_scores").insert({
        player_id: testPlayerId,
        score: newScore,
        total_questions: 6,
        quiz_title: "CSS Battle Quiz",
      });
      error = insertError;
    }

    if (error) {
      console.error("Database operation failed:", error);
    } else {
      console.log("Quiz score operation successful!");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testQuizScoreOperations();
