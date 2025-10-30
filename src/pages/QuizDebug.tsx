import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QuizDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    if (!user) {
      setDebugInfo("No user authenticated");
      return;
    }

    setLoading(true);
    let info = `=== Quiz Debug Test ===\n`;
    info += `User ID: ${user.id}\n`;
    info += `User Email: ${user.email}\n\n`;

    try {
      // Test 1: Check if user exists in players table
      info += "1. Checking if user exists in players table...\n";
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single();

      if (playerError) {
        info += `   Error: ${playerError.message} (Code: ${playerError.code})\n`;
      } else {
        info += `   Success: Found player ${playerData.full_name} (${playerData.email})\n`;
      }

      // Test 2: Check existing quiz scores
      info += "\n2. Checking existing quiz scores...\n";
      const { data: existingScores, error: scoresError } = await supabase
        .from("quiz_scores")
        .select("*")
        .eq("player_id", user.id);

      if (scoresError) {
        info += `   Error: ${scoresError.message}\n`;
      } else {
        info += `   Found ${existingScores.length} existing scores\n`;
        if (existingScores.length > 0) {
          info += `   Latest score: ${existingScores[0].score}/${existingScores[0].total_questions}\n`;
        }
      }

      // Test 3: Try to insert a test score
      info += "\n3. Attempting to insert test score...\n";
      const testScore = {
        player_id: user.id,
        score: 3,
        total_questions: 6,
        quiz_title: "Debug Test Quiz",
        completed_at: new Date().toISOString(),
      };

      const { data: insertData, error: insertError } = await supabase
        .from("quiz_scores")
        .insert(testScore);

      if (insertError) {
        info += `   Error: ${insertError.message}\n`;
      } else {
        info += "   Success: Test score inserted\n";
        
        // Clean up
        await supabase
          .from("quiz_scores")
          .delete()
          .eq("player_id", user.id)
          .eq("quiz_title", "Debug Test Quiz");
      }

    } catch (error) {
      info += `Exception: ${(error as Error).message}\n`;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Debug Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>User ID: {user?.id || "Not authenticated"}</p>
              <p>User Email: {user?.email || "Not authenticated"}</p>
            </div>
            
            <Button onClick={runDebugTest} disabled={loading || !user}>
              {loading ? "Running Debug Test..." : "Run Debug Test"}
            </Button>

            {debugInfo && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Debug Results:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {debugInfo}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizDebug;