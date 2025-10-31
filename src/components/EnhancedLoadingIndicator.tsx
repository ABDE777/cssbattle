import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EnhancedLoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  delay?: number; // Delay in ms before showing the loader
}

const EnhancedLoadingIndicator = ({
  isLoading,
  message,
  className,
  delay = 300,
}: EnhancedLoadingIndicatorProps) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      // Show loader after delay to avoid flickering for fast operations
      timeoutId = setTimeout(() => {
        setShowLoader(true);
      }, delay);
    } else {
      // Hide loader immediately when loading is complete
      setShowLoader(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, delay]);

  if (!showLoader) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg bg-background/50 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      {message && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default EnhancedLoadingIndicator;
