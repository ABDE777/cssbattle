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
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
  }, []);

  const initializePlayer = () => {
    if (!containerRef.current) return;

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

        // Check for unauthorized seeking
        if (currentTime > maxWatched + 2) {
          // Allow small margin for buffering
          playerRef.current.seekTo(maxWatched, true);
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

    const currentTime = playerRef.current.getCurrentTime();
    playerRef.current.seekTo(Math.max(0, currentTime - 5), true);
  };

  const stopVideo = () => {
    if (!playerRef.current) return;

    playerRef.current.pauseVideo(); // Changed from stopVideo to pauseVideo
    setIsPlaying(false);
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
      </div>

      {/* Custom Controls */}
      <div className="bg-black/80 text-white rounded-b-lg p-3">
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
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isCompleted
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : isNearlyCompleted
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </>
            ) : isNearlyCompleted ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
                Almost Completed ({Math.round(progress)}%)
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-1 animate-pulse"></div>
                {Math.round(progress)}% Watched
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={skipBack}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <SkipBack className="w-5 h-5" />
              <span className="ml-1">-5s</span>
            </Button>

            {/* <Button
              size="sm"
              variant="ghost"
              onClick={stopVideo}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <span>Stop</span>
            </Button> */}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5 mr-1" />
                <span>Completed</span>
              </div>
            )}

            {(isCompleted || isAdmin) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onVideoReset}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
