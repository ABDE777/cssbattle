import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  parseExcelFile,
  createPlayerTemplate,
  getPlayerTemplateFilename,
  PlayerData,
} from "@/lib/excelUtils";
import { GROUP_OPTIONS } from "@/constants/groups";

interface ImportPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportPlayersModal = ({
  isOpen,
  onClose,
  onImportComplete,
}: ImportPlayersModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPlayers, setProcessedPlayers] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<
    Array<{ row: number; message: string }>
  >([]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateBlob = createPlayerTemplate();
    const filename = getPlayerTemplateFilename();

    // Create download link
    const url = URL.createObjectURL(templateBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setValidationResults([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setErrors([]);
      setValidationResults([]);
    }
  };

  const validatePlayers = async (players: PlayerData[]) => {
    const results: Array<{ row: number; message: string }> = [];
    const validGroups = GROUP_OPTIONS.map((g) => g.value);

    players.forEach((player, index) => {
      // Check for required fields
      if (!player.full_name) {
        results.push({ row: index + 2, message: "Missing full name" });
      }

      if (!player.email) {
        results.push({ row: index + 2, message: "Missing email" });
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(player.email)) {
          results.push({ row: index + 2, message: "Invalid email format" });
        }
      }

      if (!player.group_name) {
        results.push({ row: index + 2, message: "Missing group" });
      } else if (!validGroups.includes(player.group_name)) {
        results.push({
          row: index + 2,
          message: `Invalid group: ${player.group_name}`,
        });
      }
    });

    return results;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    setValidationResults([]);
    setProcessedPlayers(0);

    try {
      // Parse the Excel file
      const players = await parseExcelFile(file);

      // Validate players
      const validationErrors = await validatePlayers(players);
      if (validationErrors.length > 0) {
        setValidationResults(validationErrors);
        toast({
          title: "Validation Errors",
          description: `Found ${validationErrors.length} validation errors. Please check the details below.`,
          variant: "destructive",
        });
        return;
      }

      // Import players in batches to avoid overwhelming the system
      let successCount = 0;
      const importErrors: string[] = [];
      const BATCH_SIZE = 10; // Process 10 players at a time

      for (let i = 0; i < players.length; i += BATCH_SIZE) {
        const batch = players.slice(i, i + BATCH_SIZE);
        
        await Promise.all(
          batch.map(async (player) => {
            try {
              // Generate a random password for the player
              const password = Math.random().toString(36).slice(-8);

              // Create user in Supabase Auth
              const { data: authData, error: authError } =
                await supabase.auth.signUp({
                  email: player.email,
                  password: password,
                  options: {
                    data: {
                      full_name: player.full_name,
                    },
                    emailRedirectTo: `${window.location.origin}/login`,
                  },
                });

              if (authError) {
                importErrors.push(
                  `Row ${players.indexOf(player) + 2}: ${authError.message}`
                );
                return;
              }

              if (authData.user) {
                // Insert user data into players table
                const { error: insertError } = await supabase
                  .from("players")
                  .insert([
                    {
                      id: authData.user.id,
                      full_name: player.full_name,
                      email: player.email,
                      group_name: player.group_name,
                      phone: player.phone || null,
                      cssbattle_profile_link: player.cssbattle_profile_link || null,
                      verified_ofppt: player.verified_ofppt || false,
                      score: 0,
                    },
                  ]);

                if (insertError) {
                  importErrors.push(
                    `Row ${players.indexOf(player) + 2}: ${insertError.message}`
                  );
                  return;
                }

                successCount++;
                setProcessedPlayers(successCount);
              }
            } catch (error) {
              importErrors.push(
                `Row ${players.indexOf(player) + 2}: ${(error as Error).message}`
              );
            }
          })
        );
      }

      setProcessedPlayers(successCount);
      setErrors(importErrors);

      if (importErrors.length === 0) {
        toast({
          title: "Success",
          description: `Successfully imported ${successCount} players!`,
        });
        onImportComplete();
        onClose();
      } else {
        toast({
          title: "Partial Success",
          description: `Imported ${successCount} players with ${importErrors.length} errors.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: `Failed to import players: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setValidationResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card/90 backdrop-blur-sm border-battle-purple/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">
              Import Players from Excel
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-foreground hover:bg-battle-purple/10 hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Template Download */}
            <div className="p-4 bg-background/50 rounded-lg border border-battle-purple/30">
              <h4 className="font-semibold text-foreground mb-2">
                Download Template
              </h4>
              <p className="text-sm text-foreground/80 mb-3">
                Download the Excel template to ensure your data is formatted
                correctly.
              </p>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* File Upload */}
            <div
              className="border-2 border-dashed border-battle-purple/50 rounded-lg p-8 text-center cursor-pointer hover:bg-battle-purple/5 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-battle-purple/50 mb-3" />
              <p className="font-medium text-foreground mb-1">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-foreground/70">
                {file ? "File selected" : "Excel files only (.xlsx, .xls)"}
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <h4 className="font-semibold text-red-500">
                    Validation Errors
                  </h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {validationResults.map((result, index) => (
                    <p key={index} className="text-sm text-foreground mb-1">
                      Row {result.row}: {result.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Import Errors */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <h4 className="font-semibold text-red-500">Import Errors</h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-foreground mb-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {processedPlayers > 0 && errors.length === 0 && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <h4 className="font-semibold text-green-500">
                    Successfully imported {processedPlayers} players!
                  </h4>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-battle-purple/50 hover:bg-battle-purple/10 hover:text-foreground"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1 bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Players
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportPlayersModal;
