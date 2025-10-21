import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "doc" | "link" | "video";
  file_data?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_at?: string;
}

const Resources = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<LearningResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [visibleResources, setVisibleResources] = useState(6);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Fetch learning resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const { data, error } = await supabase
          .from("learning_resources")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching resources:", error);
          toast({
            title: language === "en" ? "Error" : "Erreur",
            description:
              language === "en"
                ? "Failed to load learning resources"
                : "Échec du chargement des ressources",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setResources(data as LearningResource[]);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [language, toast]);

  // Filter and sort resources
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
      result = result.filter((resource) => resource.type === resourceTypeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredResources(result);
    setVisibleResources(6);
  }, [resources, searchTerm, resourceTypeFilter, sortBy]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Play className="w-5 h-5 text-purple-500" />;
      case "link":
        return <ExternalLink className="w-5 h-5 text-green-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const loadMoreResources = () => {
    setVisibleResources((prev) => Math.min(prev + 6, filteredResources.length));
  };

  const loadLessResources = () => {
    setVisibleResources((prev) => Math.max(6, prev - 6));
  };

  const openResourceModal = (resource: LearningResource) => {
    setSelectedResource(resource);
    setIsResourceModalOpen(true);
  };

  const closeResourceModal = () => {
    setIsResourceModalOpen(false);
    setSelectedResource(null);
  };

  const handleResourceAction = (resource: LearningResource) => {
    if (resource.type === "link") {
      window.open(resource.url, "_blank");
    } else {
      // For files, trigger download
      if (resource.file_data) {
        const link = document.createElement("a");
        link.href = resource.file_data;
        link.download = resource.file_name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={200} top="10%" left="5%" delay={0} />
      <FloatingShape color="pink" size={150} top="70%" left="85%" delay={1} rotation />
      <FloatingShape color="yellow" size={100} top="40%" left="80%" delay={0.5} />
      <FloatingShape color="purple" size={120} top="85%" left="15%" delay={1.5} />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              {language === "en" ? "Learning Resources" : "Ressources d'apprentissage"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "en"
                ? "Browse our comprehensive collection of learning materials, tutorials, and references"
                : "Parcourez notre collection complète de matériel pédagogique, tutoriels et références"}
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={language === "en" ? "Search resources..." : "Rechercher des ressources..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>

                {/* Type Filter */}
                <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={language === "en" ? "All Types" : "Tous les types"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "en" ? "All Types" : "Tous les types"}</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">{language === "en" ? "Document" : "Document"}</SelectItem>
                    <SelectItem value="video">{language === "en" ? "Video" : "Vidéo"}</SelectItem>
                    <SelectItem value="link">{language === "en" ? "Link" : "Lien"}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "title")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{language === "en" ? "Newest First" : "Plus récent"}</SelectItem>
                    <SelectItem value="title">{language === "en" ? "Title A-Z" : "Titre A-Z"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          {loadingResources ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                {language === "en" ? "Loading resources..." : "Chargement des ressources..."}
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "en" ? "No Resources Found" : "Aucune ressource trouvée"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "Try adjusting your filters or check back later"
                    : "Essayez d'ajuster vos filtres ou revenez plus tard"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredResources.slice(0, visibleResources).map((resource) => (
                  <Card
                    key={resource.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40"
                    onClick={() => openResourceModal(resource)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getResourceIcon(resource.type)}
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {resource.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {resource.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResourceAction(resource);
                        }}
                      >
                        {resource.type === "link" ? (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {language === "en" ? "Visit" : "Visiter"}
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            {language === "en" ? "Download" : "Télécharger"}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredResources.length > 6 && (
                <div className="flex items-center justify-center gap-4">
                  {visibleResources > 6 && (
                    <Button
                      variant="outline"
                      onClick={loadLessResources}
                      className="group hover:border-primary"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2 group-hover:text-primary" />
                      {language === "en" ? "View Less" : "Voir moins"}
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {language === "en"
                      ? `Showing ${visibleResources} of ${filteredResources.length}`
                      : `Affichage de ${visibleResources} sur ${filteredResources.length}`}
                  </span>
                  {visibleResources < filteredResources.length && (
                    <Button
                      variant="outline"
                      onClick={loadMoreResources}
                      className="group hover:border-primary"
                    >
                      {language === "en" ? "Load More" : "Charger plus"}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:text-primary" />
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Resource Detail Modal */}
      <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedResource && getResourceIcon(selectedResource.type)}
              {selectedResource?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  {language === "en" ? "Description" : "Description"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedResource.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResourceAction(selectedResource)}
                  className="flex-1"
                >
                  {selectedResource.type === "link" ? (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {language === "en" ? "Visit Link" : "Visiter le lien"}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {language === "en" ? "Download" : "Télécharger"}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={closeResourceModal}>
                  <X className="w-4 h-4 mr-2" />
                  {language === "en" ? "Close" : "Fermer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resources;
