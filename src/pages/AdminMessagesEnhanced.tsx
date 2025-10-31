import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Mail, MailOpen, Calendar, User, Eye, Search } from "lucide-react";
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
  updated_at: string;
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

const AdminMessagesEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isAdmin, loading: adminLoading } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchMessages();
  }, [isAdmin, adminLoading, navigate, admin]);

  const fetchMessages = async () => {
    try {
      if (!admin?.email) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch messages where admin is either sender OR recipient
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .or(`recipient_email.eq.${admin.email},sender_email.eq.${admin.email}`)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages((data as ContactMessage[]) || []);
    } catch (error) {
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
    navigate(`/admin/player/${playerId}`);
  };

  // Filter and search messages
  const filteredMessages = messages.filter((msg) => {
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      msg.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Group messages by conversation partner (either sender or recipient)
  let messagesBySender = filteredMessages.reduce((acc, msg) => {
    // Determine the conversation partner (the person who is NOT the admin)
    const isAdminSender = msg.sender_email === admin?.email;
    const partnerId = isAdminSender ? msg.recipient_email : msg.sender_id;
    const partnerName = isAdminSender ? "To: " + msg.recipient_email : msg.sender_name;
    const partnerEmail = isAdminSender ? msg.recipient_email : msg.sender_email;

    const existing = acc.find((item) => 
      (item.partner_id === partnerId) || 
      (item.partner_email === partnerEmail)
    );
    
    if (existing) {
      existing.messages.push(msg);
      // Only count as unread if admin is recipient and status is unread
      if (!isAdminSender && msg.status === "unread") existing.unreadCount++;
    } else {
      acc.push({
        partner_id: partnerId,
        sender_id: msg.sender_id,
        sender_name: partnerName,
        sender_email: partnerEmail,
        partner_email: partnerEmail,
        messages: [msg],
        unreadCount: (!isAdminSender && msg.status === "unread") ? 1 : 0,
        latestMessage: msg,
      });
    }
    return acc;
  }, [] as Array<{ partner_id: string; sender_id: string; sender_name: string; sender_email: string; partner_email: string; messages: ContactMessage[]; unreadCount: number; latestMessage: ContactMessage }>);

  // Filter by player search term if provided
  if (playerSearchTerm !== "") {
    messagesBySender = messagesBySender.filter(
      (sender) =>
        sender.sender_name
          .toLowerCase()
          .includes(playerSearchTerm.toLowerCase()) ||
        sender.sender_email
          .toLowerCase()
          .includes(playerSearchTerm.toLowerCase())
    );
  }

  // Sort by latest message
  messagesBySender.sort(
    (a, b) =>
      new Date(
        b.latestMessage.updated_at || b.latestMessage.created_at
      ).getTime() -
      new Date(
        a.latestMessage.updated_at || a.latestMessage.created_at
      ).getTime()
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        <div className="fixed inset-0 bg-black/0" />
        <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-auto">
          <div className="relative w-screen max-w-md">
            <div className="flex h-full flex-col bg-background border-l border-battle-purple/20 shadow-xl">
              <div className="flex items-center justify-between px-4 py-6 border-b border-battle-purple/20">
                <h2 className="text-lg font-semibold text-foreground">
                  My Messages
                </h2>
              </div>
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
      <div
        className="fixed inset-0 bg-black/0 transition-opacity pointer-events-auto"
        onClick={() => navigate("/admin/dashboard")}
      />

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

            {/* Search and Filter */}
            <div className="px-4 py-3 border-b border-battle-purple/20 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players by name..."
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  className="pl-10 pr-10 bg-background border-primary/30"
                />
                {playerSearchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setPlayerSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 bg-background border-primary/30 text-sm h-9"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-5"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-background border-primary/30 text-sm h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Messages content */}
            <div className="flex-1 overflow-y-auto p-4">
              {messagesBySender.length === 0 ? (
                <Card className="p-8 text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    No messages found
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {messagesBySender.map((sender) => (
                    <Card
                      key={sender.partner_id}
                      className="p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate">
                              {sender.sender_name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {sender.sender_email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 ml-2">
                          {sender.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5"
                            >
                              {sender.unreadCount}
                            </Badge>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(
                              sender.latestMessage.updated_at ||
                                sender.latestMessage.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Show latest message preview */}
                      <div className="p-3 bg-muted/30 rounded-lg mb-3">
                        <p className="text-xs font-semibold text-foreground mb-1">
                          {sender.latestMessage.subject}
                        </p>
                        <p className="text-foreground/70 text-xs line-clamp-2">
                          {sender.latestMessage.message}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {sender.latestMessage.status === "unread" && 
                         sender.latestMessage.sender_email !== admin?.email && (
                          <Button
                            onClick={() =>
                              handleMarkAsRead(sender.latestMessage.id)
                            }
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
                            handleViewPlayerDetails(sender.sender_id)
                          }
                          variant="outline"
                          size="sm"
                          className="border-battle-purple/50 hover:bg-battle-purple/10 text-xs h-8"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Player ({sender.messages.length})
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

export default AdminMessagesEnhanced;
