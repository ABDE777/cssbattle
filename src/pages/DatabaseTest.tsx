import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DatabaseTest = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Get current user
      const { data: { user } } = await supabase.auth.getUser();
      results.currentUser = user;
      
      // Test 2: Get all players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*');
      results.players = players;
      results.playersError = playersError;
      
      // Test 3: If user exists, try to find them in players table
      if (user) {
        const { data: userInPlayers, error: userInPlayersError } = await supabase
          .from('players')
          .select('*')
          .eq('email', user.email);
        results.userInPlayers = userInPlayers;
        results.userInPlayersError = userInPlayersError;
        
        // Test 4: Try to update a field
        if (userInPlayers && userInPlayers.length > 0) {
          const playerId = userInPlayers[0].id;
          const { data: updateResult, error: updateError } = await supabase
            .from('players')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', playerId)
            .select();
          results.updateTest = updateResult;
          results.updateError = updateError;
        }
      }
    } catch (error) {
      results.error = error;
    } finally {
      setLoading(false);
      setTestResults(results);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Database Test</h1>
        
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 mb-6">
          <Button 
            onClick={runTests}
            disabled={loading}
            className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
          >
            {loading ? "Running Tests..." : "Run Database Tests"}
          </Button>
        </Card>
        
        {testResults && (
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Test Results</h2>
            <pre className="bg-background/50 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatabaseTest;