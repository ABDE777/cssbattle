import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Mail, MailOpen, Calendar, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface ContactMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
}

interface Player {
  id: string;
  full_name: string;
  email: string;
  group_name: string | null;
  score: number;
  cssbattle_profile_link: string | null;
  phone: string | null;
  created_at: string;
  video_completed: boolean | null;
}

const AdminMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isAdmin, loading: adminLoading } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (adminLoading) return; // wait for admin context to init
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchMessages();
  }, [isAdmin, adminLoading, navigate, admin]);

  const fetchMessages = async () => {
    try {
      // Ensure admin is available
      if (!admin?.email) {
        console.warn("Admin email not available");
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch messages sent to the current admin
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("recipient_email", admin.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages((data as ContactMessage[]) || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "read", updated_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message marked as read",
      });

      fetchMessages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const handleViewPlayerDetails = (playerId: string) => {
    // Navigate to player profile page
    navigate(`/admin/player/${playerId}`);
  };

  const filteredMessages = messages.filter(
    (msg) => statusFilter === "all" || msg.status === statusFilter
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        {/* Transparent backdrop - allows background to show through */}
        <div className="fixed inset-0 bg-black/0" />

        {/* Slide-in panel */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-auto">
          <div className="relative w-screen max-w-md">
            <div className="flex h-full flex-col bg-background border-l border-battle-purple/20 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-6 border-b border-battle-purple/20">
                <h2 className="text-lg font-semibold text-foreground">
                  My Messages
                </h2>
              </div>

              {/* Loading content */}
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-foreground">
                  Loading messages...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Transparent backdrop - allows background to show through but still catches clicks */}
      <div
        className="fixed inset-0 bg-black/0 transition-opacity pointer-events-auto"
        onClick={() => navigate("/admin/dashboard")}
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-auto">
        <div className="relative w-screen max-w-md">
          <div className="flex h-full flex-col bg-background border-l border-battle-purple/20 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 border-b border-battle-purple/20">
              <h2 className="text-lg font-semibold text-foreground">
                My Messages
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/dashboard")}
                className="text-foreground hover:bg-battle-purple/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Filter controls */}
            <div className="px-4 py-3 border-b border-battle-purple/20">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-background border-primary/30">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Messages content */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredMessages.length === 0 ? (
                <Card className="p-8 text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    No messages found
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <Card
                      key={message.id}
                      className="p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {message.status === "unread" ? (
                            <Mail className="w-4 h-4 text-primary" />
                          ) : (
                            <MailOpen className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <h3 className="font-semibold text-foreground text-sm">
                              {message.subject}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{message.sender_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={
                              message.status === "unread"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {message.status}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(message.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-lg mb-3">
                        <p className="text-foreground text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {message.status === "unread" && (
                          <Button
                            onClick={() => handleMarkAsRead(message.id)}
                            variant="outline"
                            size="sm"
                            className="border-primary/50 text-xs h-8"
                          >
                            <MailOpen className="w-3 h-3 mr-1" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          onClick={() =>
                            handleViewPlayerDetails(message.sender_id)
                          }
                          variant="outline"
                          size="sm"
                          className="border-battle-purple/50 hover:bg-battle-purple/10 text-xs h-8"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Player
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
