// Simple script to check if learning resources exist in the database
import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase URL and public key
const SUPABASE_URL = "https://ubjttptjigwbjwqyiwmi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianR0cHRqaWd3Ymp3cXlpd21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTI2NjgsImV4cCI6MjA3NjE4ODY2OH0.ZtCjm5IaMPRGoQpXu6L2iM7TzCPdGEL8iru2UQdpvLA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkResources() {
  console.log("Checking learning resources...");

  try {
    const { data, error } = await supabase
      .from("learning_resources")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Error fetching resources:", error);
      return;
    }

    console.log("Found resources:", data);
    console.log("Total resources count:", data ? data.length : 0);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

checkResources();
