import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePlayerMessages = (playerEmail: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!playerEmail) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching unread message count for:", playerEmail);
      const { count, error } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_email", playerEmail)
        .eq("status", "unread");

      if (!error && count !== null) {
        console.log("Unread message count:", count);
        setUnreadCount(count);
      } else {
        console.log("No unread messages or error:", error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!playerEmail) return;

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "read", updated_at: new Date().toISOString() })
        .eq("recipient_email", playerEmail)
        .eq("status", "unread");

      if (!error) {
        setUnreadCount(0);
        // Dispatch event to notify other components
        console.log("Dispatching playerMessagesRead event from markMessagesAsRead");
        window.dispatchEvent(new CustomEvent("playerMessagesRead"));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    if (!playerEmail) {
      console.log("usePlayerMessages: No player email provided, skipping fetch");
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    console.log("usePlayerMessages: Initializing for player email:", playerEmail);
    fetchUnreadCount();

    // Listen for messages read event
    const handleMessagesRead = () => {
      console.log("Received playerMessagesRead event in usePlayerMessages, refreshing count");
      fetchUnreadCount();
    };

    window.addEventListener("playerMessagesRead", handleMessagesRead);

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      console.log("Periodic refresh of player message count");
      fetchUnreadCount();
    }, 30000);

    return () => {
      window.removeEventListener("playerMessagesRead", handleMessagesRead);
      clearInterval(interval);
    };
  }, [playerEmail]);

  return { unreadCount, loading, fetchUnreadCount, markMessagesAsRead };
};