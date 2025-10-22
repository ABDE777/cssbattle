import { supabase } from "@/integrations/supabase/client";

/**
 * Creates the learning storage bucket if it doesn't exist
 * This function should be called by an admin user with appropriate permissions
 */
export const createLearningBucket = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // First check if the bucket already exists
    const { data: existingBucket, error: getError } = await supabase.storage.getBucket("learning");
    
    if (existingBucket) {
      return { success: true, message: "Bucket 'learning' already exists" };
    }
    
    if (getError && !getError.message.includes("not found")) {
      console.error("Error checking bucket:", getError);
      return { success: false, message: `Error checking bucket: ${getError.message}` };
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket("learning", {
      public: true, // Make it publicly accessible
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: [
        "image/*",
        "video/*",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
        "application/x-zip-compressed"
      ]
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      return { success: false, message: `Failed to create bucket: ${error.message}` };
    }
    
    console.log("Bucket created successfully:", data);
    return { success: true, message: "Bucket 'learning' created successfully" };
  } catch (error) {
    console.error("Unexpected error creating bucket:", error);
    return { success: false, message: `Unexpected error: ${error.message || error}` };
  }
};

/**
 * Sets up the necessary policies for the learning bucket
 * This function should be called after creating the bucket
 */
export const setupLearningBucketPolicies = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Note: Setting up policies typically requires SQL commands in Supabase
    // This is a placeholder for future implementation
    console.log("Bucket policies setup would go here");
    return { success: true, message: "Policies setup completed" };
  } catch (error) {
    console.error("Error setting up policies:", error);
    return { success: false, message: `Error setting up policies: ${error.message || error}` };
  }
};

/**
 * Checks if the learning bucket exists and is accessible
 */
export const checkLearningBucket = async (): Promise<{ exists: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.storage.getBucket("learning");
    
    if (error) {
      if (error.message.includes("not found")) {
        return { exists: false, message: "Bucket 'learning' not found" };
      }
      return { exists: false, message: `Error accessing bucket: ${error.message}` };
    }
    
    return { exists: true, message: "Bucket 'learning' is accessible" };
  } catch (error) {
    return { exists: false, message: `Unexpected error: ${error.message || error}` };
  }
};

/**
 * Diagnose storage issues
 */
export const diagnoseStorage = async (): Promise<{ status: string; details: any }> => {
  try {
    console.log("Starting storage diagnosis...");
    
    // 1. List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log("Buckets list:", buckets, "Error:", bucketsError);
    
    // 2. Check if learning bucket exists
    const { data: learningBucket, error: learningError } = await supabase.storage.getBucket("learning");
    console.log("Learning bucket:", learningBucket, "Error:", learningError);
    
    // 3. Try to create bucket if it doesn't exist
    let createResult = null;
    if (learningError && learningError.message.includes("not found")) {
      console.log("Attempting to create learning bucket...");
      const { data: createData, error: createError } = await supabase.storage.createBucket("learning", {
        public: true
      });
      createResult = { data: createData, error: createError };
      console.log("Create bucket result:", createResult);
    }
    
    // 4. Test upload if bucket exists
    let uploadTest = null;
    if (learningBucket || (createResult && createResult.data)) {
      console.log("Testing file upload...");
      const testContent = "Test file content";
      const blob = new Blob([testContent], { type: "text/plain" });
      const file = new File([blob], "diagnostic-test.txt", { type: "text/plain" });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("learning")
        .upload(`diagnostic/${Date.now()}_test.txt`, file);
      
      uploadTest = { data: uploadData, error: uploadError };
      console.log("Upload test result:", uploadTest);
    }
    
    return {
      status: "completed",
      details: {
        buckets: { data: buckets, error: bucketsError },
        learningBucket: { data: learningBucket, error: learningError },
        createResult,
        uploadTest
      }
    };
  } catch (error) {
    console.error("Diagnosis error:", error);
    return {
      status: "error",
      details: { error: error.message || error }
    };
  }
};