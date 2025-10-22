import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle, SkipBack } from "lucide-react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onVideoComplete: () => void;
  onVideoReset: () => void;
  isCompleted: boolean;
  isAdmin: boolean;
}

const YouTubePlayer = ({
  videoId,
  onVideoComplete,
  onVideoReset,
  isCompleted,
  isAdmin,
}: YouTubePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [maxWatched, setMaxWatched] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); // Track if video has started
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [seekProtectionEnabled, setSeekProtectionEnabled] = useState(false);
  const lastSkipBackTime = useRef(0);

  // Load YouTube iframe API
  useEffect(() => {
    if (!window.YT) {
      const scriptTag = document.createElement("script");
      scriptTag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(scriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]); // Add videoId as dependency to reinitialize when video changes

  const initializePlayer = () => {
    if (!containerRef.current) return;

    // Reset state when initializing a new player
    setHasStarted(false);
    setSeekProtectionEnabled(false); // Disable seek protection initially

    // Set initial maxWatched based on current time or a small value
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      setMaxWatched(Math.max(0.1, currentTime));
    } else {
      setMaxWatched(0.1); // Start with a small value to prevent initial seek issues
    }

    setProgress(0);

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: YT.PlayerEvent) => {
    console.log("Player is ready");
    // Reset state when player is ready
    setHasStarted(false);

    // Set initial maxWatched based on current time or a small value
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      setMaxWatched(Math.max(0.1, currentTime));
    } else {
      setMaxWatched(0.1); // Start with a small value to prevent initial seek issues
    }

    setProgress(0);

    // Enable seek protection after a short delay
    setTimeout(() => {
      setSeekProtectionEnabled(true);
    }, 1000);
  };

  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoEnd();
    }
  };

  const startProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update progress more frequently for smoother experience
    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        // Set hasStarted when video begins playing
        if (currentTime > 0 && !hasStarted) {
          console.log("Video started at", currentTime);
          setHasStarted(true);
        }

        // Check for unauthorized seeking only if protection is enabled
        if (
          seekProtectionEnabled &&
          currentTime > maxWatched + 2 &&
          hasStarted
        ) {
          // Allow small margin for buffering
          // Only seek back if the user has actually skipped ahead significantly
          // This prevents infinite loop when legitimately watching content
          if (currentTime - maxWatched > 10) {
            // More than 10 seconds skip
            console.log("Unauthorized seeking detected, seeking back", {
              currentTime,
              maxWatched,
              difference: currentTime - maxWatched,
            });
            playerRef.current.seekTo(maxWatched, true);
          } else {
            // Just update maxWatched if it's a small jump (buffering, etc.)
            console.log("Small jump or buffering, updating maxWatched", {
              currentTime,
              maxWatched,
            });
            setMaxWatched(Math.max(maxWatched, currentTime));
            setProgress((currentTime / duration) * 100);
          }
        } else {
          setMaxWatched(Math.max(maxWatched, currentTime));
          setProgress((currentTime / duration) * 100);
        }
      }
    }, 100); // Updated to 100ms for smoother progress updates
  };

  const handleVideoEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
    setHasStarted(false); // Reset hasStarted when video ends
    setSeekProtectionEnabled(false); // Disable seek protection when video ends
    setProgress(100);
    onVideoComplete();
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const skipBack = () => {
    if (!playerRef.current) return;

    const now = Date.now();
    // Prevent skip back from being triggered too frequently (less than 300ms apart)
    if (now - lastSkipBackTime.current < 300) {
      console.log("Skip back ignored due to rate limiting");
      return;
    }

    lastSkipBackTime.current = now;
    const currentTime = playerRef.current.getCurrentTime();
    const newTime = Math.max(0, currentTime - 5);

    console.log("Skip back triggered", { currentTime, newTime, hasStarted });

    // Only allow skip back if video has started or we're not at the beginning
    if (hasStarted || currentTime > 5) {
      console.log("Performing skip back to", newTime);
      playerRef.current.seekTo(newTime, true);
    } else {
      // If at the very beginning, just pause to prevent looping
      console.log("Pausing at beginning to prevent looping");
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  const stopVideo = () => {
    if (!playerRef.current) return;

    playerRef.current.pauseVideo(); // Changed from stopVideo to pauseVideo
    setIsPlaying(false);
    setHasStarted(false); // Reset hasStarted when stopping
    setSeekProtectionEnabled(false); // Disable seek protection when stopping
    // Removed setting progress to 0 to maintain current position
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Determine if video is essentially completed (95% or more)
  const isNearlyCompleted = progress >= 95 || isCompleted;

  return (
    <div className="w-full">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-4">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Custom Controls Card - Positioned inside video at bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full px-2 py-1">
          <div className="bg-black/70 text-white rounded-t-lg p-2 shadow-lg backdrop-blur-sm mx-2">
            {/* Progress bar */}
            <div className="w-full mb-2">
              <div className="w-full h-1 bg-gray-600 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>
                  {playerRef.current
                    ? formatTime(playerRef.current.getCurrentTime?.() || 0)
                    : "0:00"}
                </span>
                <span>
                  {playerRef.current
                    ? formatTime(playerRef.current.getDuration?.() || 0)
                    : "0:00"}
                </span>
              </div>
            </div>

            {/* Completion Status Indicator */}
            <div className="flex items-center justify-center mb-2">
              <div
                className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isCompleted
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : isNearlyCompleted
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </>
                ) : isNearlyCompleted ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1"></div>
                    Almost Completed ({Math.round(progress)}%)
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1 animate-pulse"></div>
                    {Math.round(progress)}% Watched
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    skipBack();
                  }}
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {isCompleted && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Completed</span>
                  </div>
                )}

                {(isCompleted || isAdmin) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onVideoReset}
                    className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
