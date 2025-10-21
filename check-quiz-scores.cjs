const { createClient } = require("@supabase/supabase-js");

// Replace with your actual Supabase URL and public key
const SUPABASE_URL = "https://ubjttptjigwbjwqyiwmi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianR0cHRqaWd3Ymp3cXlpd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTI2NjgsImV4cCI6MjA3NjE4ODY2OH0.ZtCjm5IaMPRGoQpXu6L2iM7TzCPdGEL8iru2UQdpvLA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkQuizScores() {
  console.log("Checking quiz scores...");

  try {
    // Check if there are any quiz scores
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Error fetching quiz scores:", error);
      return;
    }

    console.log("Found quiz scores:", data);
    console.log("Total quiz scores count:", data ? data.length : 0);

    // Check if there's a unique constraint issue
    if (data && data.length > 0) {
      const playerIds = data.map((score) => score.player_id);
      const uniquePlayerIds = [...new Set(playerIds)];
      console.log("Unique players with scores:", uniquePlayerIds.length);
      console.log("Total scores:", playerIds.length);

      if (playerIds.length !== uniquePlayerIds.length) {
        console.log(
          "⚠️  Duplicate scores found - this indicates the unique constraint is working"
        );
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

checkQuizScores();
