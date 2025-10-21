import { useEffect, useState } from "react";

/**
 * Custom hook to manage message panel state globally
 * This allows opening the message panel from anywhere in the app
 */
export const useMessagePanel = () => {
  const [isPlayerMessagesOpen, setIsPlayerMessagesOpen] = useState(false);
  const [isAdminMessagesOpen, setIsAdminMessagesOpen] = useState(false);

  useEffect(() => {
    // Handle opening player messages panel
    const handleOpenPlayerMessages = () => {
      console.log("Opening player messages panel");
      setIsPlayerMessagesOpen(true);
    };

    // Handle opening admin messages panel
    const handleOpenAdminMessages = () => {
      console.log("Opening admin messages panel");
      setIsAdminMessagesOpen(true);
    };

    // Add event listeners
    window.addEventListener("openPlayerMessagesPanel", handleOpenPlayerMessages);
    window.addEventListener("openMessagesPanel", handleOpenAdminMessages);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("openPlayerMessagesPanel", handleOpenPlayerMessages);
      window.removeEventListener("openMessagesPanel", handleOpenAdminMessages);
    };
  }, []);

  const closePlayerMessages = () => {
    setIsPlayerMessagesOpen(false);
  };

  const closeAdminMessages = () => {
    setIsAdminMessagesOpen(false);
  };

  return {
    isPlayerMessagesOpen,
    isAdminMessagesOpen,
    closePlayerMessages,
    closeAdminMessages,
  };
};

export default useMessagePanel;