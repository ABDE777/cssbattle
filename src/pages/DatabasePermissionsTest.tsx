import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DatabasePermissionsTest = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Select permission
      results.selectTest = await supabase
        .from('players')
        .select('id, full_name')
        .limit(2);

      // Test 2: Insert permission (with a test record)
      results.insertTest = await supabase
        .from('players')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: "Test User",
            email: "test@example.com",
            group_name: "DD101",
            score: 0
          }
        ]);

      // Test 3: Update permission
      results.updateTest = await supabase
        .from('players')
        .update({ updated_at: new Date().toISOString() })
        .limit(1);

      // Test 4: Delete permission with non-existent record (should not error)
      results.deleteNonExistentTest = await supabase
        .from('players')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      // Test 5: Full delete test cycle
      // First insert a test record
      const { data: insertData, error: insertError } = await supabase
        .from('players')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000002',
            full_name: "Delete Test User",
            email: "delete-test@example.com",
            group_name: "DD101",
            score: 0
          }
        ])
        .select();

      if (insertError) {
        results.deleteInsertError = insertError;
      } else {
        results.deleteInsertTest = insertData;
        // Now try to delete it
        if (insertData && Array.isArray(insertData) && insertData.length > 0) {
          const testPlayerId = insertData[0].id;
          const { data: deleteData, error: deleteError } = await supabase
            .from('players')
            .delete()
            .eq('id', testPlayerId)
            .select();
          
          results.deleteTest = { data: deleteData, error: deleteError };
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
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="border-battle-purple/50 hover:bg-battle-purple/10"
          >
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Database Permissions Test
          </h1>
          <div></div>
        </div>
        
        <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 mb-6">
          <Button 
            onClick={runTests}
            disabled={loading}
            className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
          >
            {loading ? "Running Tests..." : "Run Database Permission Tests"}
          </Button>
        </Card>
        
        {testResults && (
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Test Results</h2>
            <pre className="bg-background/50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatabasePermissionsTest;