import { useEffect } from "react";

const useKeyboardNavigation = (isActive: boolean, onClose?: () => void) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape key
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, onClose]);
};

export default useKeyboardNavigation;