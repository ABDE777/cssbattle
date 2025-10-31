import { useState, useEffect, useRef } from "react";
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
import {
  X,
  Mail,
  MailOpen,
  Calendar,
  User,
  Eye,
  Send,
  Users,
  MessageCircle,
  Check,
  CheckCheck,
  Reply,
  Search,
} from "lucide-react";
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
  group_name?: string | null;
  score?: number | null;
  cssbattle_profile_link?: string | null;
  phone?: string | null;
  created_at?: string;
  video_completed?: boolean | null;
  profile_image_url?: string | null;
}

interface AdminContact {
  id: string;
  name: string;
  email: string;
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessagesPanel = ({ isOpen, onClose }: MessagesPanelProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    admin,
    isAdmin,
    loading: adminLoading,
    fetchUnreadMessageCount,
  } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // Store all players
  const [players, setPlayers] = useState<Player[]>([]); // Store players who contacted admin
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [playerMessages, setPlayerMessages] = useState<ContactMessage[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ContactMessage | null>(
    null
  );
  const [playerSearchTerm, setPlayerSearchTerm] = useState(""); // Add player search state
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [playerMessages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle keyboard visibility on mobile - improved version
  useEffect(() => {
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        // Check if keyboard is likely open by comparing viewport height
        const isKeyboardOpen =
          window.innerHeight - window.visualViewport.height > 100;
        setIsInputFocused(isKeyboardOpen);
      }
    };

    // Use visualViewport API for better mobile keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange
      );
      return () => {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange
        );
      };
    } else {
      // Fallback to focus/blur events
      const handleFocusIn = () => setIsInputFocused(true);
      const handleFocusOut = () => setIsInputFocused(false);

      const inputs = document.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        input.addEventListener("focusin", handleFocusIn);
        input.addEventListener("focusout", handleFocusOut);
      });

      return () => {
        inputs.forEach((input) => {
          input.removeEventListener("focusin", handleFocusIn);
          input.removeEventListener("focusout", handleFocusOut);
        });
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchPlayers(); // Fetch all players separately
    }
  }, [isOpen, isAdmin, admin]);

  // Removed the dependency on messages for fetchPlayers

  const fetchMessages = async () => {
    if (!isOpen) return;

    try {
      // Ensure admin is available
      if (!admin?.email) {
        console.warn("Admin email not available");
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch messages where admin is either sender OR recipient
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .or(`recipient_email.eq.${admin.email},sender_email.eq.${admin.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Type cast the data to ensure status is correct type
      const typedData = (data || []).map((msg) => ({
        ...msg,
        status: msg.status as "unread" | "read" | "replied",
      }));

      setMessages(typedData);
      setLoading(false);

      // Automatically mark unread messages sent TO admin as read when admin opens the panel
      const unreadMessages = typedData.filter(
        (msg) => msg.status === "unread" && msg.recipient_email === admin.email
      );
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (msg) => {
            const { error: updateError } = await supabase
              .from("contact_messages")
              .update({ status: "read", updated_at: new Date().toISOString() })
              .eq("id", msg.id);

            if (updateError) {
              console.error("Failed to mark message as read:", updateError);
            }
          })
        );
        // Refresh messages list and unread count after marking as read
        setTimeout(() => {
          fetchMessages();
          fetchUnreadMessageCount();
        }, 100);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchAdminContacts = async () => {
    try {
      // Fetch admin contacts directly from the admins table
      const { data, error } = await supabase
        .from("admins")
        .select("id, name, email")
        .order("name");

      if (error) {
        console.error("Error fetching admin contacts:", error);
        return [];
      }

      // Transform to match the expected format
      return (data || []).map((admin) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
      }));
    } catch (error) {
      console.error("Failed to fetch admin contacts:", error);
      return [];
    }
  };

  const fetchPlayers = async () => {
    try {
      // Fetch players who have been in conversation with the admin (either direction)
      if (!admin?.email) {
        setPlayers([]);
        setAllPlayers([]);
        return;
      }

      // Get all messages where admin is sender OR recipient
      const { data: contactMessages, error: messagesError } = await supabase
        .from("contact_messages")
        .select("sender_id, sender_email, recipient_email")
        .or(`recipient_email.eq.${admin.email},sender_email.eq.${admin.email}`);

      if (messagesError) throw messagesError;

      // Extract unique player emails/IDs (excluding admin)
      const playerEmails = new Set<string>();
      const playerIds = new Set<string>();

      contactMessages?.forEach((msg) => {
        // If admin is recipient, the sender is the player
        if (msg.recipient_email === admin.email) {
          if (msg.sender_id) playerIds.add(msg.sender_id);
          if (msg.sender_email && msg.sender_email !== admin.email) {
            playerEmails.add(msg.sender_email);
          }
        }
        // If admin is sender, the recipient is the player
        else if (msg.sender_email === admin.email) {
          if (msg.recipient_email && msg.recipient_email !== admin.email) {
            playerEmails.add(msg.recipient_email);
          }
        }
      });

      // Fetch player details using IDs or emails
      if (playerIds.size === 0 && playerEmails.size === 0) {
        setPlayers([]);
      } else {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, full_name, email, group_name, score, profile_image_url")
          .or(
            `id.in.(${Array.from(playerIds).join(",")}),email.in.(${Array.from(
              playerEmails
            )
              .map((e) => `"${e}"`)
              .join(",")})`
          )
          .order("full_name", { ascending: true });

        if (playersError) throw playersError;
        setPlayers(playersData || []);
      }

      // Fetch all players AND admins for search functionality
      const { data: allPlayersData, error: allPlayersError } = await supabase
        .from("players")
        .select("id, full_name, email, group_name, score, profile_image_url")
        .order("full_name", { ascending: true });

      if (allPlayersError) throw allPlayersError;

      // Fetch admins from database
      const adminContacts = await fetchAdminContacts();

      // Convert admin contacts to Player format and merge with players
      const adminPlayers: Player[] = adminContacts.map(
        (adminContact: AdminContact) => ({
          id: "00000000-0000-0000-0000-000000000000", // Placeholder ID for admins
          full_name: adminContact.name,
          email: adminContact.email,
          group_name: "Admin",
          score: null,
          profile_image_url: null,
        })
      );

      setAllPlayers([...(allPlayersData || []), ...adminPlayers]);
    } catch (error) {
      console.error("Failed to fetch players:", error);
      setPlayers([]);
      setAllPlayers([]);
    }
  };

  const fetchPlayerMessages = async (player: Player) => {
    if (!admin?.id || !admin?.email) {
      toast({
        title: "Error",
        description: "Admin not properly authenticated",
        variant: "destructive",
      });
      setLoading(false); // Make sure to set loading to false even when returning early
      return;
    }

    // Debug the admin object to see what's in it
    console.log("Admin object:", admin);
    console.log("Admin ID:", admin.id);
    console.log("Admin email:", admin.email);
    console.log("Player object:", player);

    try {
      setLoading(true); // Set loading to true when starting the fetch
      console.log("Fetching messages for player:", player);

      // Validate that admin.id is a proper UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(admin.id);

      // For invalid UUIDs, show an error
      if (!isValidUUID) {
        toast({
          title: "Error",
          description:
            "Admin data is corrupted. Please log out and log back in.",
          variant: "destructive",
        });
        return;
      }

      // Fetch messages between this player and the admin
      // We need to handle multiple cases:
      // 1. Player sends message to admin (sender_email = player.email, recipient_email = admin.email)
      // 2. Admin sends message to player (sender_email = admin.email, recipient_email = player.email)
      // Note: We always use sender_email for admins now since sender_id is set to null to avoid foreign key constraint issues

      // For all admins, we query by sender_email since sender_id is always null
      const query =
        `and(sender_email.eq.${player.email},recipient_email.eq.${admin.email}),` +
        `and(sender_email.eq.${admin.email},recipient_email.eq.${player.email})`;

      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .or(query)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching player messages:", error);
        throw error;
      }

      console.log("Fetched player messages:", data);

      // Type cast the data to ensure status is correct type
      const typedData = (data || []).map((msg) => ({
        ...msg,
        status: msg.status as "unread" | "read" | "replied",
      }));

      setPlayerMessages(typedData);
      setSelectedPlayer(player);

      // Mark messages as read (only the ones sent TO the admin FROM this player)
      const unreadMessages = typedData.filter(
        (msg) =>
          msg.status === "unread" &&
          msg.recipient_email === admin.email &&
          msg.sender_email === player.email
      );

      if (unreadMessages.length > 0) {
        console.log("Marking messages as read:", unreadMessages.length);
        await Promise.all(
          unreadMessages.map(async (msg) => {
            const { error: updateError } = await supabase
              .from("contact_messages")
              .update({ status: "read", updated_at: new Date().toISOString() })
              .eq("id", msg.id);

            if (updateError) {
              console.error("Failed to mark message as read:", updateError);
            }
          })
        );
        // Refresh messages list to update unread counts
        fetchMessages();
        // Also refresh the admin context unread count
        fetchUnreadMessageCount();
      }
    } catch (error) {
      console.error("Failed to fetch player messages:", error);
      // Enhanced error handling to provide more detailed error information
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Try to extract more details from the error object
        const errorObj = error as Record<string, unknown>;
        if ("message" in errorObj && typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        } else if (
          "details" in errorObj &&
          typeof errorObj.details === "string"
        ) {
          errorMessage = errorObj.details;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: "Failed to fetch conversation: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Always set loading to false in the finally block
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
    onClose(); // Close the panel when navigating
  };

  const handleSelectPlayer = (player: Player) => {
    console.log("Selecting player:", player);
    fetchPlayerMessages(player);
  };

  const handleSendMessage = async () => {
    if (!selectedPlayer || !newMessage.trim() || !admin?.email || !admin?.id) {
      toast({
        title: "Error",
        description: "Missing required information to send message",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate that admin.id is a proper UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(admin.id);

      // For invalid UUIDs, show an error
      if (!isValidUUID) {
        toast({
          title: "Error",
          description:
            "Admin data is corrupted. Please log out and log back in.",
          variant: "destructive",
        });
        return;
      }

      // Prepare message data with reply info if replying
      const messageText = replyToMessage
        ? `[Replying to: "${replyToMessage.message.substring(
            0,
            50
          )}..."] ${newMessage}`
        : newMessage;

      // For admins, we set sender_id to null and rely on sender_email
      // This is because admins are not in the players table, so their IDs would violate the foreign key constraint
      const messageData = {
        sender_id: null, // Always null for admins to avoid foreign key constraint issues
        sender_name: "Admin",
        sender_email: admin.email,
        recipient_email: selectedPlayer.email,
        subject: `Re: Message from ${selectedPlayer.full_name}`,
        message: messageText,
        status: "unread", // Changed from "replied" to "unread" so players see it as unread
      };

      // Try to insert the message
      const { error } = await supabase
        .from("contact_messages")
        .insert(messageData);

      if (error) {
        console.error("Failed to send message:", error);
        // If we get an RLS error, it means the admin can't insert messages
        if (
          error.message.includes("new row violates row-level security policy")
        ) {
          toast({
            title: "Error",
            description:
              "Admin messaging is not available. Please contact system administrator.",
            variant: "destructive",
          });
        } else {
          // Some other error occurred
          throw error;
        }
      } else {
        // Success
        setNewMessage("");
        setReplyToMessage(null);
        toast({
          title: "Success",
          description: "Message sent successfully!",
        });

        // Refresh messages
        // First refresh the main messages list, then fetch the specific conversation
        await fetchMessages();
        if (selectedPlayer) {
          await fetchPlayerMessages(selectedPlayer);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Enhanced error handling to provide more detailed error information
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Try to extract more details from the error object
        const errorObj = error as Record<string, unknown>;
        if ("message" in errorObj && typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        } else if (
          "details" in errorObj &&
          typeof errorObj.details === "string"
        ) {
          errorMessage = errorObj.details;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: "Failed to send message: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter(
    (msg) => statusFilter === "all" || msg.status === statusFilter
  );

  // Get unique players from messages
  const uniquePlayers = players.filter(
    (player, index, self) => index === self.findIndex((p) => p.id === player.id)
  );

  // Filter players based on search term
  // If there's a search term, search from ALL players (including those who haven't contacted admin yet)
  // Otherwise, show only players who have contacted the admin
  let filteredPlayers = playerSearchTerm
    ? allPlayers.filter(
        (player) =>
          player.full_name
            .toLowerCase()
            .includes(playerSearchTerm.toLowerCase()) ||
          player.email.toLowerCase().includes(playerSearchTerm.toLowerCase())
      )
    : players; // Show only players who contacted admin when not searching

  // Apply status filter
  if (statusFilter !== "all") {
    filteredPlayers = filteredPlayers.filter((player) => {
      const playerMessages = messages.filter(
        (msg) =>
          (msg.sender_email === player.email &&
            msg.recipient_email === admin?.email) ||
          (msg.recipient_email === player.email &&
            (msg.sender_id === admin?.id || msg.sender_email === admin?.email))
      );

      // Check if any messages match the status filter
      return playerMessages.some((msg) => msg.status === statusFilter);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Transparent backdrop - allows background to show through but still catches clicks */}
      <div
        className="fixed inset-0 bg-black/0 transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide-in panel - responsive for mobile */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-auto">
        <div className="relative w-screen max-w-4xl h-full">
          <div className="flex h-full bg-background border-l border-battle-purple/20 shadow-xl flex-col md:flex-row">
            {/* Sidebar for players list - hidden on mobile when chat is open */}
            <div
              className={`border-r border-battle-purple/20 flex flex-col md:w-1/3 ${
                selectedPlayer && isMobile ? "hidden" : "flex"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-battle-purple/20">
                <h2 className="text-lg font-semibold text-foreground">
                  Messages
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-foreground hover:bg-battle-purple/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Filter controls with player search */}
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-background border-primary/30">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Players list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-foreground">
                      Loading contacts...
                    </div>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {playerSearchTerm
                        ? "No players found matching your search"
                        : "No contacts found"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-battle-purple/10">
                    {filteredPlayers.map((player) => {
                      // Get messages for this player
                      // We need to handle both cases:
                      // 1. Messages FROM player TO admin (sender_email = player.email, recipient_email = admin.email)
                      // 2. Messages FROM admin TO player (sender_id = admin.id OR sender_email = admin.email, recipient_email = player.email)
                      const playerMessages = messages.filter(
                        (msg) =>
                          (msg.sender_email === player.email &&
                            msg.recipient_email === admin.email) ||
                          (msg.recipient_email === player.email &&
                            (msg.sender_id === admin?.id ||
                              msg.sender_email === admin?.email))
                      );
                      // Only count unread messages sent TO admin FROM this player
                      const unreadCount = playerMessages.filter(
                        (msg) =>
                          msg.status === "unread" &&
                          msg.sender_email === player.email &&
                          msg.recipient_email === admin.email
                      ).length;

                      return (
                        <div
                          key={player.id}
                          className={`p-4 cursor-pointer hover:bg-battle-purple/5 transition-colors ${
                            selectedPlayer?.id === player.id
                              ? "bg-battle-purple/10"
                              : ""
                          }`}
                          onClick={() => handleSelectPlayer(player)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {player.profile_image_url ? (
                                <img
                                  src={player.profile_image_url}
                                  alt={player.full_name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-foreground">
                                  {player.full_name}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {player.email}
                                </p>
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <Badge variant="default" className="rounded-full">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          {playerMessages.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {
                                playerMessages[playerMessages.length - 1]
                                  .message
                              }
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chat area - full width on mobile when chat is open */}
            <div
              className={`flex flex-col ${
                selectedPlayer && isMobile ? "w-full" : "md:w-2/3"
              } ${!selectedPlayer && isMobile ? "hidden md:flex" : "flex"}`}
            >
              {selectedPlayer ? (
                <>
                  {/* Chat header - with back button on mobile */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-battle-purple/20">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPlayer(null)}
                          className="text-foreground hover:bg-battle-purple/10 md:hidden"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5"
                          >
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </Button>
                      )}
                      {selectedPlayer.profile_image_url ? (
                        <img
                          src={selectedPlayer.profile_image_url}
                          alt={selectedPlayer.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-foreground">
                          {selectedPlayer.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {selectedPlayer.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewPlayerDetails(selectedPlayer.id)}
                      className="text-foreground hover:bg-battle-purple/10"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Messages area with WhatsApp-style background */}
                  <div className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwIEw0MCAwIEw0MCA0MCBMMCA0MCBaIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] bg-background/95">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-foreground">
                          Loading messages...
                        </div>
                      </div>
                    ) : playerMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No messages yet
                        </h3>
                        <p className="text-muted-foreground max-w-xs">
                          Start a conversation with {selectedPlayer.full_name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {playerMessages.map((message, index) => {
                          // Check if we need a date separator
                          const showDateSeparator =
                            index === 0 ||
                            new Date(
                              playerMessages[index - 1].created_at
                            ).toDateString() !==
                              new Date(message.created_at).toDateString();

                          // Check if this message contains a reply
                          const replyMatch = message.message.match(
                            /^\[Replying to: "(.*?)"\] (.*)$/
                          );
                          const replyText = replyMatch ? replyMatch[1] : null;
                          const actualMessage = replyMatch
                            ? replyMatch[2]
                            : message.message;

                          return (
                            <div key={message.id}>
                              {/* Date separator */}
                              {showDateSeparator && (
                                <div className="flex justify-center my-4">
                                  <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs text-muted-foreground border border-border/50 shadow-sm">
                                    {new Date(
                                      message.created_at
                                    ).toLocaleDateString([], {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                </div>
                              )}

                              <div
                                className={`flex ${
                                  message.sender_id === admin?.id ||
                                  message.sender_email === admin?.email
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`group max-w-[75%] lg:max-w-md px-3 py-2 rounded-lg relative shadow-md ${
                                    message.sender_id === admin?.id ||
                                    message.sender_email === admin?.email
                                      ? "bg-gradient-to-br from-battle-purple to-battle-purple/90 text-white rounded-tr-none"
                                      : "bg-card text-foreground rounded-tl-none"
                                  }`}
                                >
                                  {/* Reply preview if this is a reply */}
                                  {replyText && (
                                    <div
                                      className={`text-xs mb-2 pb-2 pl-2 border-l-4 ${
                                        message.sender_id === admin?.id ||
                                        message.sender_email === admin?.email
                                          ? "border-white/40 text-white/90"
                                          : "border-battle-purple/40 text-muted-foreground"
                                      }`}
                                    >
                                      <Reply className="w-3 h-3 inline mr-1" />
                                      {replyText.length > 50
                                        ? replyText.substring(0, 50) + "..."
                                        : replyText}
                                    </div>
                                  )}

                                  <p className="text-sm break-words whitespace-pre-wrap">
                                    {actualMessage}
                                  </p>

                                  <div
                                    className={`text-[10px] mt-1 flex items-center justify-between gap-2 ${
                                      message.sender_id === admin?.id ||
                                      message.sender_email === admin?.email
                                        ? "text-white/70"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {new Date(
                                        message.created_at
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {message.sender_id === admin?.id ||
                                      message.sender_email === admin?.email ? (
                                        message.status === "read" ? (
                                          <CheckCheck className="w-3 h-3 text-blue-400" />
                                        ) : (
                                          <Check className="w-3 h-3 text-white/60" />
                                        )
                                      ) : null}
                                    </div>

                                    {/* Reply button */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setReplyToMessage(message)}
                                    >
                                      <Reply className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message input - fixed at bottom with mobile keyboard support */}
                  <div
                    className={`border-t border-battle-purple/20 p-4 transition-all duration-300 ${
                      isMobile && isInputFocused
                        ? "fixed bottom-0 left-0 right-0 bg-background z-50"
                        : ""
                    }`}
                    style={{
                      // Adjust positioning based on the chat panel's position
                      left: isMobile && isInputFocused ? "auto" : "",
                      right: isMobile && isInputFocused ? "0" : "",
                      width:
                        isMobile && isInputFocused ? "calc(100% - 2rem)" : "",
                      marginLeft: isMobile && isInputFocused ? "1rem" : "",
                      marginRight: isMobile && isInputFocused ? "1rem" : "",
                    }}
                  >
                    {/* Reply preview */}
                    {replyToMessage && (
                      <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between border-l-4 border-battle-purple shadow-sm">
                        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                          <Reply className="w-4 h-4 text-battle-purple flex-shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs text-battle-purple font-medium">
                              Replying to message
                            </span>
                            <span className="truncate text-muted-foreground text-xs">
                              {replyToMessage.message}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyToMessage(null)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-background border-primary/30 rounded-full"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow rounded-full h-10 w-10 p-0"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a contact
                  </h3>
                  <p className="text-muted-foreground max-w-xs">
                    Choose a player from the contacts list to start chatting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPanel;
