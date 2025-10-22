import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  created_at: string;
  file_data?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

const TestResourceFetch = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch learning resources...");

        const { data, error } = await supabase
          .from("learning_resources")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          setError(error.message);
          toast({
            title: "Error",
            description: `Failed to load learning resources: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log("Fetched resources:", data);
        setResources(data as LearningResource[]);
        setError(null);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          title: "Error",
          description: "Failed to load learning resources",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [toast]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Resource Fetch</h1>

      {loading && <p>Loading resources...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <p>Found {resources.length} resources</p>
          {resources.map((resource) => (
            <div key={resource.id} className="border p-4 mb-2 rounded">
              <h2 className="font-bold">{resource.title}</h2>
              <p>{resource.description}</p>
              <p>Type: {resource.type}</p>
              <p>Created: {resource.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestResourceFetch;
