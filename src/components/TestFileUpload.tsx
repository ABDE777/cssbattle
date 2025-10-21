// Test component for file upload to learning bucket
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  testFileUpload,
  listLearningFiles,
  deleteLearningFile,
} from "@/test-file-upload";

interface UploadedFile {
  path: string;
  publicUrl: string;
}

interface FileObject {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

const TestFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await testFileUpload(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        setUploadedFile(result.data);
        console.log("File uploaded successfully:", result.data);
      } else {
        console.error("Upload failed:", result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleListFiles = async () => {
    setLoading(true);
    try {
      const result = await listLearningFiles();
      if (result.success) {
        setFiles(result.data);
        console.log("Files:", result.data);
      } else {
        console.error("Failed to list files:", result.error);
      }
    } catch (error) {
      console.error("List error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      const result = await deleteLearningFile(filePath);
      if (result.success) {
        console.log("File deleted successfully");
        // Refresh the file list
        handleListFiles();
      } else {
        console.error("Failed to delete file:", result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4">
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">
          Test File Upload to Learning Bucket
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select a file to upload
            </label>
            <Input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="mb-2"
            />
            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Upload Successful!</h3>
              <p className="text-sm text-green-700 mt-1">
                File path: {uploadedFile.path}
              </p>
              <a
                href={uploadedFile.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                View uploaded file
              </a>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleListFiles} disabled={loading}>
              {loading ? "Loading..." : "List Files"}
            </Button>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Files in Learning Bucket:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-mono text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFile(file.name)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TestFileUpload;
