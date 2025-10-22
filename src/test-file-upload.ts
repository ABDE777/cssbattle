// Test script for file upload to learning bucket
// This can be integrated into your React components

import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    publicUrl: string;
  };
  error?: string;
}

interface FileObject {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

interface ListResult {
  success: boolean;
  data?: FileObject[];
  error?: string;
}

interface DeleteResult {
  success: boolean;
  data?: { id: string }[];
  error?: string;
}

/**
 * Test file upload to learning bucket
 * @param file - File to upload
 * @param onProgress - Progress callback function
 * @returns Upload result
 */
export const testFileUpload = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('Testing file upload to learning bucket...');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Upload file to learning bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('learning')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        ...(onProgress && {
          onUploadProgress: (progress) => {
            onProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        })
      });

    if (error) {
      console.error('Upload failed:', error.message);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    console.log('Upload successful:', data);

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('learning')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl
      }
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List all files in the learning bucket
 * @returns List of files
 */
export const listLearningFiles = async (): Promise<ListResult> => {
  try {
    const { data, error } = await supabase.storage
      .from('learning')
      .list();

    if (error) {
      console.error('Failed to list files:', error.message);
      return {
        success: false,
        error: `Failed to list files: ${error.message}`
      };
    }

    console.log('Files in learning bucket:', data);
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('List error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a file from the learning bucket
 * @param filePath - Path of the file to delete
 * @returns Deletion result
 */
export const deleteLearningFile = async (filePath: string): Promise<DeleteResult> => {
  try {
    const { data, error } = await supabase.storage
      .from('learning')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete file:', error.message);
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }

    console.log('File deleted successfully:', data);
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example usage:
/*
// In a React component:
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const result = await testFileUpload(file, (progress) => {
    console.log(`Upload progress: ${progress}%`);
  });

  if (result.success) {
    console.log('File uploaded successfully:', result.data);
  } else {
    console.error('Upload failed:', result.error);
  }
};

const handleListFiles = async () => {
  const result = await listLearningFiles();
  if (result.success) {
    console.log('Files:', result.data);
  } else {
    console.error('Failed to list files:', result.error);
  }
};
*/