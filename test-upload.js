// Test script to upload files to the learning bucket
// This script can be run in a Node.js environment with Supabase client

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required environment variables
if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL environment variable");
  process.exit(1);
}

if (!supabaseKey) {
  console.error(
    "Missing VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable"
  );
  console.error(
    "Note: For storage operations, you may need the service role key which has full access."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a simple text file as an ArrayBuffer for Node.js
function createTestFileBuffer(content) {
  return Buffer.from(content, "utf-8");
}

async function createLearningBucket() {
  try {
    console.log("Attempting to create learning bucket...");

    // Note: The Supabase JS client doesn't have a direct method to create buckets
    // We'll need to use the REST API directly or do this manually in the Supabase dashboard

    console.log(
      "Please create the learning bucket manually in the Supabase dashboard:"
    );
    console.log("1. Go to your Supabase project dashboard");
    console.log("2. Navigate to Storage in the left sidebar");
    console.log("3. Click Create Bucket");
    console.log('4. Enter "learning" as the bucket name');
    console.log("5. Enable public access");
    console.log("6. Set file size limit to 50MB");
    console.log(
      "7. Set allowed MIME types to include image/*, video/*, application/pdf, etc."
    );

    return false;
  } catch (error) {
    console.error("Error creating bucket:", error.message);
    return false;
  }
}

async function setupStoragePolicies() {
  console.log(
    "Please set up the following storage policies in the Supabase SQL Editor:"
  );
  console.log(`
-- Allow public read access to learning bucket
CREATE POLICY "Public read access to learning bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'learning');

-- Allow authenticated users to upload to learning bucket
CREATE POLICY "Authenticated users can upload to learning bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'learning');

-- Allow admins to update learning bucket objects
CREATE POLICY "Admins can update learning bucket objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'learning');

-- Allow admins to delete learning bucket objects
CREATE POLICY "Admins can delete learning bucket objects"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'learning');
  `);
}

async function testFileUpload() {
  try {
    console.log("Testing file upload to learning bucket...");

    // First, check if the learning bucket exists
    console.log("Checking if learning bucket exists...");
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();
    if (bucketError) {
      console.error("Failed to list buckets:", bucketError.message);
      if (bucketError.message.includes("service key")) {
        console.log(
          "Note: You may need to use the service role key for storage operations."
        );
        console.log(
          "The service role key can be found in your Supabase project settings under API."
        );
      }
      return;
    }

    const learningBucket = buckets.find((bucket) => bucket.name === "learning");
    if (!learningBucket) {
      console.log("Learning bucket does not exist.");
      const created = await createLearningBucket();
      if (!created) {
        console.log(
          "Please create the bucket manually and run this script again."
        );
        await setupStoragePolicies();
        return;
      }
    } else {
      console.log("Learning bucket exists:", learningBucket);
    }

    // Create a test file
    const testContent = "This is a test file for learning resources";
    const fileBuffer = createTestFileBuffer(testContent);
    const fileName = `test-file-${Date.now()}.txt`;

    console.log("Attempting to upload file...");

    // Upload file to learning bucket
    const { data, error } = await supabase.storage
      .from("learning")
      .upload(fileName, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "text/plain",
      });

    if (error) {
      console.error("Upload failed:", error.message);

      // Provide guidance based on the error
      if (error.message.includes("row-level security")) {
        console.log(
          "RLS Error: The current user does not have permission to upload files."
        );
        console.log(
          "For server-side operations, you need to use the service role key."
        );
        console.log(
          "The service role key can be found in your Supabase project settings under API."
        );
        console.log("Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY");
      }

      return;
    }

    console.log("Upload successful:", data);

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("learning")
      .getPublicUrl(fileName);

    console.log("Public URL:", publicUrlData.publicUrl);

    // List files in the learning bucket to verify upload
    const { data: listData, error: listError } = await supabase.storage
      .from("learning")
      .list();

    if (listError) {
      console.error("Failed to list files:", listError.message);
    } else {
      console.log("Files in learning bucket:");
      listData.forEach((file) => {
        console.log(`- ${file.name} (${file.updated_at})`);
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
  }
}

// Run the test
testFileUpload();
