import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FloatingShape from "@/components/FloatingShape";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  Trophy,
  BookOpen,
  PlusCircle,
  RefreshCw,
  Target,
  Edit,
  Search,
  Filter,
  Calendar,
  File,
  Video,
  Link,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizScore {
  id: string;
  player_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_title: string;
  players: {
    full_name: string;
    email: string;
    group_name: string | null;
  };
}

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "doc" | "link" | "video";
  created_at: string;
  file_data?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

const AdminLearningManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingResource, setEditingResource] =
    useState<LearningResource | null>(null);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    type: "link" as "pdf" | "doc" | "link" | "video",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("quiz");

  // Resource filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [visibleResources, setVisibleResources] = useState(5);
  const [filteredResources, setFilteredResources] = useState<
    LearningResource[]
  >([]);

  // Calculate statistics
  const totalQuizScores = quizScores.length;
  const totalResources = resources.length;
  const averageScore =
    quizScores.length > 0
      ? quizScores.reduce((sum, score) => sum + score.score, 0) /
        quizScores.length
      : 0;

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchQuizScores(), fetchResources()]);
    setLoading(false);
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQuizScores();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, adminLoading, navigate]);

  // Filter resources based on search term and type filter
  useEffect(() => {
    let result = [...resources];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (resourceTypeFilter !== "all") {
      result = result.filter(
        (resource) => resource.type === resourceTypeFilter
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredResources(result);
    setVisibleResources(5); // Reset to show only 5 resources when filters change
  }, [resources, searchTerm, resourceTypeFilter, sortBy]);

  const fetchQuizScores = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select(
          `
          *,
          players (
            full_name,
            email,
            group_name
          )
        `
        )
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setQuizScores(data || []);
    } catch (error) {
      console.error("Failed to fetch quiz scores:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz scores",
        variant: "destructive",
      });
    }
  };

  const fetchResources = async () => {
    try {
      // Don't load file_data by default - only load it when downloading
      const { data, error } = await supabase
        .from("learning_resources")
        .select(
          "id, title, description, url, type, created_at, file_name, file_size, file_type, created_by"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as LearningResource[]) || []);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !admin) {
      console.log("No file selected or no admin user");
      return null;
    }

    // Check file size (limit to 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size exceeds 50MB limit",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploadingFile(true);

      // Convert file to base64 for database storage
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile); // This will create a data URL with base64 encoding
      });

      // Extract base64 data (remove the data URL prefix)
      const base64Data = fileData.split(",")[1] || fileData;

      // Return file information to be stored in the database
      return {
        file_data: base64Data,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
      };
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: `Failed to process file: ${error.message || error}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddResource = async () => {
    if (!admin) {
      toast({
        title: "Error",
        description: "Admin user not found",
        variant: "destructive",
      });
      return;
    }

    if (!newResource.title) {
      toast({
        title: "Error",
        description: "Please enter a title for the resource",
        variant: "destructive",
      });
      return;
    }

    if (!newResource.url && !selectedFile) {
      toast({
        title: "Error",
        description: "Please either upload a file or enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare resource data
      const resourceData: {
        title: string;
        description: string;
        type: "pdf" | "doc" | "link" | "video";
        created_by: string;
        file_data?: string;
        file_name?: string;
        file_size?: number;
        file_type?: string;
        url?: string | null;
      } = {
        title: newResource.title,
        description: newResource.description || "",
        type: newResource.type,
        created_by: admin.id,
      };

      // Handle file upload if a file is selected
      if (selectedFile) {
        const fileData = await handleFileUpload();
        if (!fileData) {
          // File upload failed, stop the process
          console.log("File upload failed, stopping resource creation");
          return;
        }

        // Store file data in the resource object
        resourceData.file_data = fileData.file_data;
        resourceData.file_name = fileData.file_name;
        resourceData.file_size = fileData.file_size;
        resourceData.file_type = fileData.file_type;
        resourceData.url = null; // No URL for file resources
      } else {
        // Store URL for link resources
        resourceData.url = newResource.url;
        resourceData.file_data = null;
        resourceData.file_name = null;
        resourceData.file_size = null;
        resourceData.file_type = null;
      }

      console.log("Inserting resource into database:", resourceData);

      const { data, error } = await supabase
        .from("learning_resources")
        .insert(resourceData);

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      console.log("Resource inserted successfully:", data);

      toast({
        title: "Success",
        description: "Resource added successfully",
      });

      setNewResource({
        title: "",
        description: "",
        url: "",
        type: "link",
      });
      setSelectedFile(null);
      setShowAddResource(false);
      fetchResources();
    } catch (error) {
      console.error("Failed to add resource:", error);
      toast({
        title: "Error",
        description: `Failed to add resource: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource: LearningResource) => {
    setEditingResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description || "",
      url: resource.url || "",
      type: resource.type,
    });
    setShowAddResource(true);
  };

  const handleUpdateResource = async () => {
    if (!admin || !editingResource) return;

    if (!newResource.title) {
      toast({
        title: "Error",
        description: "Please enter a title for the resource",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const resourceData: {
        title: string;
        description: string;
        type: "pdf" | "doc" | "link" | "video";
        file_data?: string;
        file_name?: string;
        file_size?: number;
        file_type?: string;
        url?: string | null;
      } = {
        title: newResource.title,
        description: newResource.description || "",
        type: newResource.type,
      };

      // Handle file upload if a new file is selected
      if (selectedFile) {
        const fileData = await handleFileUpload();
        if (!fileData) {
          return;
        }

        resourceData.file_data = fileData.file_data;
        resourceData.file_name = fileData.file_name;
        resourceData.file_size = fileData.file_size;
        resourceData.file_type = fileData.file_type;
        resourceData.url = null;
      } else if (newResource.url && !editingResource.file_data) {
        // Only update URL if there was no file before
        resourceData.url = newResource.url;
      }

      const { error } = await supabase
        .from("learning_resources")
        .update(resourceData)
        .eq("id", editingResource.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource updated successfully",
      });

      setNewResource({
        title: "",
        description: "",
        url: "",
        type: "link",
      });
      setSelectedFile(null);
      setShowAddResource(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      console.error("Failed to update resource:", error);
      toast({
        title: "Error",
        description: `Failed to update resource: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("learning_resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });

      fetchResources();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "doc":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "video":
        return <Video className="w-4 h-4 text-purple-500" />;
      case "link":
        return <Link className="w-4 h-4 text-green-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  // Load more resources
  const loadMoreResources = () => {
    setVisibleResources((prev) => Math.min(prev + 5, filteredResources.length));
  };

  // Load less resources
  const loadLessResources = () => {
    setVisibleResources((prev) => Math.max(5, prev - 5));
  };

  if (loading && quizScores.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16 overflow-hidden relative">
      {/* Animated Background Shapes */}
      <FloatingShape
        color="purple"
        size={300}
        top="5%"
        left="10%"
        delay={0.5}
      />
      <FloatingShape color="pink" size={150} top="20%" left="50%" delay={1} />
      <FloatingShape color="pink" size={200} top="70%" left="70%" delay={0} />
      <FloatingShape color="purple" size={250} top="8%" left="85%" delay={0} />
      <FloatingShape
        color="pink"
        size={180}
        top="75%"
        left="10%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={130}
        top="45%"
        left="80%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={150}
        top="80%"
        left="20%"
        delay={1.5}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="border-primary/50 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center flex-1">
            Learning Management
          </h1>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-primary/50 w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Total Quiz Scores
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalQuizScores}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Total Resources
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalResources}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {averageScore.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quiz" className="text-lg py-3">
              <Trophy className="w-5 h-5 mr-2" />
              Quiz Management
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-lg py-3">
              <BookOpen className="w-5 h-5 mr-2" />
              Resource Management
            </TabsTrigger>
          </TabsList>

          {/* Quiz Management Tab */}
          <TabsContent value="quiz">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-primary" />
                  Quiz Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {quizScores.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No quiz scores yet
                    </p>
                  ) : (
                    quizScores.map((score) => (
                      <div
                        key={score.id}
                        className="p-4 bg-background/50 rounded-lg border border-primary/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {score.players?.full_name || "Unknown Player"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {score.players?.email || "No email"}
                            </p>
                            {score.players?.group_name && (
                              <Badge variant="secondary" className="mt-1">
                                {score.players.group_name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {score.score}/{score.total_questions}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                score.completed_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {score.quiz_title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resource Management Tab */}
          <TabsContent value="resources">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-primary" />
                    Learning Resources
                  </CardTitle>
                  <div className="flex gap-2">
                    <Dialog
                      open={showAddResource}
                      onOpenChange={setShowAddResource}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingResource(null);
                            setNewResource({
                              title: "",
                              description: "",
                              url: "",
                              type: "link",
                            });
                            setSelectedFile(null);
                          }}
                          className="bg-gradient-primary"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Resource
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingResource
                              ? "Edit Resource"
                              : "Add New Resource"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Title *</Label>
                            <Input
                              value={newResource.title}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Resource title"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newResource.description}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Brief description"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={newResource.type}
                              onValueChange={(
                                value: "link" | "pdf" | "doc" | "video"
                              ) =>
                                setNewResource({ ...newResource, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="doc">Document</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Upload File or Enter URL</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  console.log("File selected:", file);
                                  if (file) {
                                    console.log("File details:", {
                                      name: file.name,
                                      size: file.size,
                                      type: file.type,
                                    });
                                  }
                                  setSelectedFile(file);
                                }}
                                className="flex-1"
                              />
                              <span className="text-muted-foreground self-center">
                                OR
                              </span>
                              <Input
                                value={newResource.url}
                                onChange={(e) =>
                                  setNewResource({
                                    ...newResource,
                                    url: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                                className="flex-1"
                                disabled={!!selectedFile}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={
                                editingResource
                                  ? handleUpdateResource
                                  : handleAddResource
                              }
                              disabled={loading || uploadingFile}
                              className="flex-1"
                            >
                              {uploadingFile
                                ? "Uploading..."
                                : editingResource
                                ? "Update Resource"
                                : "Add Resource"}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowAddResource(false);
                                setEditingResource(null);
                                setNewResource({
                                  title: "",
                                  description: "",
                                  url: "",
                                  type: "link",
                                });
                                setSelectedFile(null);
                              }}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="mb-6 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Type Filter */}
                    <div>
                      <select
                        value={resourceTypeFilter}
                        onChange={(e) => setResourceTypeFilter(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Filter resources by type"
                      >
                        <option value="all">All Types</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">Document</option>
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as "date" | "title")
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Sort resources by"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="title">Sort by Title</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredResources.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No resources found
                    </p>
                  ) : (
                    <>
                      {/* Resource Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResources
                          .slice(0, visibleResources)
                          .map((resource) => (
                            <Card
                              key={resource.id}
                              className="bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer h-48 flex flex-col"
                            >
                              <CardContent className="p-4 flex flex-col h-full">
                                <div className="flex items-start mb-2">
                                  <div className="mr-3 mt-1">
                                    {getResourceIcon(resource.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground truncate">
                                      {resource.title}
                                    </h3>
                                  </div>
                                </div>
                                <div className="mt-2 flex-grow">
                                  <p className="text-xs text-muted-foreground line-clamp-3">
                                    {resource.description}
                                  </p>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {resource.type.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-foreground/50">
                                    {new Date(
                                      resource.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditResource(resource)}
                                    className="flex-1"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  {resource.type === "link" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(resource.url, "_blank")
                                      }
                                      className="flex-1"
                                    >
                                      <Link className="w-3 h-3 mr-1" />
                                      Visit
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        // If it's a file resource, download it
                                        if (resource.file_name) {
                                          try {
                                            // Fetch the full resource data from the database to get the file data
                                            const { data, error } =
                                              await supabase
                                                .from("learning_resources")
                                                .select(
                                                  "file_data, file_name, file_type"
                                                )
                                                .eq("id", resource.id)
                                                .single();

                                            if (error) throw error;

                                            if (data && data.file_data) {
                                              try {
                                                // Convert base64 to binary data
                                                const byteCharacters = atob(
                                                  data.file_data
                                                );
                                                const byteNumbers = new Array(
                                                  byteCharacters.length
                                                );
                                                for (
                                                  let i = 0;
                                                  i < byteCharacters.length;
                                                  i++
                                                ) {
                                                  byteNumbers[i] =
                                                    byteCharacters.charCodeAt(
                                                      i
                                                    );
                                                }
                                                const byteArray =
                                                  new Uint8Array(byteNumbers);
                                                const blob = new Blob(
                                                  [byteArray],
                                                  {
                                                    type:
                                                      data.file_type ||
                                                      "application/octet-stream",
                                                  }
                                                );

                                                // Create download link
                                                const url =
                                                  URL.createObjectURL(blob);
                                                const a =
                                                  document.createElement("a");
                                                a.href = url;
                                                a.download =
                                                  data.file_name || "download";
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                              } catch (processingError) {
                                                console.error(
                                                  "Error processing file data:",
                                                  processingError
                                                );
                                                // Fallback: try to create a blob directly from the data
                                                try {
                                                  const blob = new Blob(
                                                    [data.file_data],
                                                    {
                                                      type:
                                                        data.file_type ||
                                                        "application/octet-stream",
                                                    }
                                                  );
                                                  const url =
                                                    URL.createObjectURL(blob);
                                                  const a =
                                                    document.createElement("a");
                                                  a.href = url;
                                                  a.download =
                                                    data.file_name ||
                                                    "download";
                                                  document.body.appendChild(a);
                                                  a.click();
                                                  document.body.removeChild(a);
                                                  URL.revokeObjectURL(url);
                                                } catch (fallbackError) {
                                                  console.error(
                                                    "Fallback error:",
                                                    fallbackError
                                                  );
                                                  toast({
                                                    title: "Error",
                                                    description:
                                                      "Failed to process file data. The file may be corrupted.",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error(
                                              "Error downloading file:",
                                              error
                                            );
                                            toast({
                                              title: "Error",
                                              description:
                                                "Failed to download file. There was a database error.",
                                              variant: "destructive",
                                            });
                                          }
                                        }
                                      }}
                                      className="flex-1"
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>

                      {/* Load More/Less Buttons */}
                      <div className="flex justify-center gap-4 mt-6">
                        {visibleResources < filteredResources.length && (
                          <Button
                            onClick={loadMoreResources}
                            variant="outline"
                            className="border-primary/50 hover:bg-primary/10"
                          >
                            <ChevronRight className="w-4 h-4 mr-2" />
                            View More
                          </Button>
                        )}

                        {visibleResources > 5 && (
                          <Button
                            onClick={loadLessResources}
                            variant="outline"
                            className="border-primary/50 hover:bg-primary/10"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            View Less
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLearningManagement;
