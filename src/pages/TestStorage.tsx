import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TestStorage = () => {
  const { toast } = useToast();
  const [bucketInfo, setBucketInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const checkBucket = async () => {
    setLoading(true);
    try {
      // Check if bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket("learning");
      
      if (bucketError) {
        console.error("Bucket error:", bucketError);
        setBucketInfo({ error: bucketError.message });
        toast({
          title: "Error",
          description: `Bucket error: ${bucketError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      setBucketInfo(bucketData);
      console.log("Bucket info:", bucketData);
      
      toast({
        title: "Success",
        description: "Bucket exists and is accessible",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      setBucketInfo({ error: error.message });
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.createBucket("learning", {
        public: true,
      });
      
      if (error) {
        console.error("Create bucket error:", error);
        toast({
          title: "Error",
          description: `Failed to create bucket: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Bucket created:", data);
      setBucketInfo(data);
      
      toast({
        title: "Success",
        description: "Bucket created successfully",
      });
      
      // Check bucket after creation
      setTimeout(checkBucket, 1000);
    } catch (error) {
      console.error("Unexpected error creating bucket:", error);
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setLoading(true);
    try {
      // Create a simple test file
      const testContent = "This is a test file for storage testing";
      const blob = new Blob([testContent], { type: "text/plain" });
      const file = new File([blob], "test-file.txt", { type: "text/plain" });
      
      const filePath = `test/${Date.now()}_test-file.txt`;
      
      const { data, error } = await supabase.storage
        .from("learning")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      if (error) {
        console.error("Upload error:", error);
        setUploadResult({ error: error.message });
        toast({
          title: "Error",
          description: `Upload failed: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Upload successful:", data);
      setUploadResult(data);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("learning")
        .getPublicUrl(filePath);
      
      console.log("Public URL:", publicUrl);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Unexpected upload error:", error);
      setUploadResult({ error: error.message });
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBucket();
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Storage Bucket Test
          </h1>
          <p className="text-foreground/80">
            Diagnose and test the learning storage bucket
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
            <CardHeader>
              <CardTitle>Bucket Information</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !bucketInfo ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-battle-purple"></div>
                </div>
              ) : bucketInfo ? (
                <div className="space-y-2">
                  {bucketInfo.error ? (
                    <div className="text-red-500">
                      <strong>Error:</strong> {bucketInfo.error}
                    </div>
                  ) : (
                    <>
                      <div><strong>ID:</strong> {bucketInfo.id}</div>
                      <div><strong>Name:</strong> {bucketInfo.name}</div>
                      <div><strong>Public:</strong> {bucketInfo.public ? "Yes" : "No"}</div>
                      <div><strong>Created:</strong> {new Date(bucketInfo.created_at).toLocaleString()}</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-foreground/50">No bucket information</div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button onClick={checkBucket} disabled={loading} variant="outline">
                  Check Bucket
                </Button>
                <Button onClick={createBucket} disabled={loading}>
                  Create Bucket
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
            <CardHeader>
              <CardTitle>Upload Test</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadResult ? (
                <div className="space-y-2">
                  {uploadResult.error ? (
                    <div className="text-red-500">
                      <strong>Error:</strong> {uploadResult.error}
                    </div>
                  ) : (
                    <>
                      <div><strong>Path:</strong> {uploadResult.path}</div>
                      <div><strong>ID:</strong> {uploadResult.id}</div>
                      <div><strong>Created:</strong> {new Date(uploadResult.created_at).toLocaleString()}</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-foreground/50">No upload test performed</div>
              )}
              
              <Button onClick={testUpload} disabled={loading} className="mt-4">
                Test Upload
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestStorage;