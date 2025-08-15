'use client'

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider"

export const SimulationProgressBar = () => {
  const { 
    currentTime, 
    setCurrentTime, 
    sessionDuration, 
    isPlaying, 
    setIsPlaying 
  } = useSimulation();

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying && !isDragging && currentTime < sessionDuration) {
      interval = setInterval(() => {
        const newTime = currentTime + 100; // Advance by 100ms for smooth playback
        if (newTime >= sessionDuration) {
          setIsPlaying(false);
          setCurrentTime(sessionDuration);
        } else {
          setCurrentTime(newTime);
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isDragging, sessionDuration, setCurrentTime, setIsPlaying, currentTime]);

  // Mouse drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newTime = Math.round((x / rect.width) * sessionDuration);
      setCurrentTime(Math.max(0, Math.min(newTime, sessionDuration)));
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, sessionDuration, setCurrentTime]);

  const handlePlayPause = () => {
    if (currentTime >= sessionDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    setCurrentTime(Math.max(currentTime - 5000, 0)); // Skip back 5 seconds
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(currentTime + 5000, sessionDuration)); // Skip forward 5 seconds
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Format time for display (milliseconds to MM:SS)
  const formatTime = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Don't show progress bar if no session data
  if (!sessionDuration) return null;

  const progressPercentage = sessionDuration > 0 ? (currentTime / sessionDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col space-y-3">

        {/* Controls and Timeline */}
        <div className="flex items-center space-x-4">
          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipBack}
              disabled={currentTime <= 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipForward}
              disabled={currentTime >= sessionDuration}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Time */}
          <span className="text-sm font-mono tabular-nums text-gray-700">
            {formatTime(currentTime)}
          </span>

          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="relative flex-1 h-3 bg-gray-200 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = progressBarRef.current!.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const newTime = (x / rect.width) * sessionDuration;
              setCurrentTime(Math.max(0, Math.min(newTime, sessionDuration)));
            }}
          >
            {/* Filled portion */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Draggable thumb */}
            <div
              className="absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
              style={{
                transform: "translate(-50%, -50%)",
                left: `${progressPercentage}%`,
              }}
              onMouseDown={handleThumbMouseDown}
            />
          </div>

          {/* Total Duration */}
          <span className="text-sm font-mono tabular-nums text-gray-700">
            {formatTime(sessionDuration)}
          </span>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-gray-500 text-center">
   
        </div>
      </div>
    </div>
  );
};