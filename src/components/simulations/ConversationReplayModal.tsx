import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { Session } from "@/types";
import { EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";

interface ConversationReplayModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSession: Session | null;
  evaluationCriteria?: EvaluationCriterion[];
}

export function ConversationReplayModal({
  isOpen,
  onOpenChange,
  selectedSession,
  evaluationCriteria = []
}: ConversationReplayModalProps) {
  const [activeTab, setActiveTab] = useState<"conversation" | "analysis">("conversation");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentlyPlayingMessageIndex, setCurrentlyPlayingMessageIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMessageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to stop all audio
  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsAudioPlaying(false);
    setCurrentlyPlayingMessageIndex(null);
  };

  // Scroll to current message when it changes
  useEffect(() => {
    if (currentMessageRef.current && scrollContainerRef.current && currentMessageIndex >= 0) {
      currentMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentMessageIndex]);

  // Auto-play next message when current finishes (if playing)
  useEffect(() => {
    if (isPlaying && currentMessageIndex >= 0 && selectedSession?.simulationResult) {
      const filteredMessages = selectedSession.simulationResult.simulatedConversation
        .filter(turn => turn.message && turn.message !== "==! END_CALL!==");
      
      const currentMessage = filteredMessages[currentMessageIndex];
      if (currentMessage?.audioData) {
        playMessageAudio(currentMessage.audioData, currentMessageIndex, true);
      }
    }
  }, [currentMessageIndex, isPlaying]);

  const playMessageAudio = (audioData: string, messageIndex?: number, autoAdvance: boolean = false) => {
    try {
      // Stop any currently playing audio
      stopAllAudio();

      // Create and play new audio
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      audioRef.current = audio;
      
      if (messageIndex !== undefined) {
        setCurrentlyPlayingMessageIndex(messageIndex);
      }
      
      audio.onloadstart = () => {
        console.log("🎵 Audio loading started...");
        setIsAudioPlaying(true);
      };
      
      audio.oncanplaythrough = () => {
        console.log("🎵 Audio ready to play");
      };
      
      audio.onplay = () => {
        console.log("🎵 Audio started playing");
        setIsAudioPlaying(true);
      };
      
      audio.onended = () => {
        console.log("🎵 Audio finished playing");
        setIsAudioPlaying(false);
        setCurrentlyPlayingMessageIndex(null);
        
        // Auto-advance to next message if playing and not at the end
        if (autoAdvance && isPlaying && selectedSession?.simulationResult) {
          const filteredMessages = selectedSession.simulationResult.simulatedConversation
            .filter(turn => turn.message && turn.message !== "==! END_CALL!==");
          
          if (currentMessageIndex < filteredMessages.length - 1) {
            setCurrentMessageIndex(currentMessageIndex + 1);
          } else {
            // End of conversation, stop playing
            setIsPlaying(false);
          }
        }
      };
      
      audio.onerror = (e) => {
        console.error("🎵 Audio playback error:", e);
        setIsAudioPlaying(false);
        setCurrentlyPlayingMessageIndex(null);
      };

      audio.play().catch(error => {
        console.error("🎵 Failed to play audio:", error);
        setIsAudioPlaying(false);
        setCurrentlyPlayingMessageIndex(null);
      });

    } catch (error) {
      console.error("🎵 Error creating audio:", error);
      setIsAudioPlaying(false);
      setCurrentlyPlayingMessageIndex(null);
    }
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Will trigger useEffect to play current message
    }
  };

  const handleSkipForward = () => {
    if (selectedSession?.simulationResult) {
      const filteredMessages = selectedSession.simulationResult.simulatedConversation
        .filter(turn => turn.message && turn.message !== "==! END_CALL!==");
      
      if (currentMessageIndex < filteredMessages.length - 1) {
        // Stop current audio before moving to next
        stopAllAudio();
        setCurrentMessageIndex(currentMessageIndex + 1);
      }
    }
  };

  const handleSkipBack = () => {
    if (currentMessageIndex > 0) {
      // Stop current audio before moving to previous
      stopAllAudio();
      setCurrentMessageIndex(currentMessageIndex - 1);
    }
  };

  const handleManualPlayAudio = (audioData: string, messageIndex: number) => {
    // If this message is currently playing, stop it
    if (currentlyPlayingMessageIndex === messageIndex && isAudioPlaying) {
      stopAllAudio();
    } else {
      // Set this as the current message and play it
      setCurrentMessageIndex(messageIndex);
      playMessageAudio(audioData, messageIndex);
    }
  };

  // Get filtered messages for display
  const getFilteredMessages = () => {
    if (!selectedSession?.simulationResult) return [];
    return selectedSession.simulationResult.simulatedConversation
      .filter(turn => turn.message && turn.message !== "==! END_CALL!==");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {selectedSession ? `Conversation Replay: ${selectedSession.studentName}` : "Conversation Replay"}
          </DialogTitle>
          {selectedSession && (
            <p className="text-sm text-gray-500 mt-1">
              {selectedSession.description}
            </p>
          )}
        </DialogHeader>

        {selectedSession ? (
          <>
            {selectedSession.status === "running" && (
              <div className="text-blue-500 text-center py-8">
                <span className="animate-pulse">Simulation in progress...</span>
              </div>
            )}
            
            {selectedSession.status === "pending" && (
              <div className="text-gray-500 text-center py-8">
                Simulation not run yet. Click &quot;Run Simulations&quot; to start.
              </div>
            )}
            
            {selectedSession.status === "error" && (
              <div className="text-red-500 text-center py-8">
                Simulation failed. Please try again.
              </div>
            )}

            {selectedSession.status === "completed" && selectedSession.simulationResult && (
              <>
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-1">
                  <Button
                    variant={activeTab === "conversation" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("conversation")}
                    className="flex-1 h-8"
                  >
                    Conversation
                  </Button>
                  <Button
                    variant={activeTab === "analysis" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("analysis")}
                    className="flex-1 h-8"
                  >
                    Analysis
                  </Button>
                </div>

                {/* Tab Content */}
                <div 
                  ref={scrollContainerRef}
                  className={`overflow-y-auto ${activeTab === "conversation" ? "max-h-[50vh] pb-16" : "max-h-[60vh]"}`}
                >
                  {activeTab === "conversation" && (
                    <div className="space-y-3">
                      {/* Show ALL messages at once */}
                      {getFilteredMessages().map((turn, index) => (
                        <div
                          key={index}
                          ref={index === currentMessageIndex ? currentMessageRef : null}
                          className={`flex items-start gap-3 ${
                            turn.role === "user" ? "" : "flex-row-reverse"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 mr-2 ${
                              turn.role === "user" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-blue-100 text-blue-700"
                            } ${
                              currentMessageIndex === index
                                ? "ring-2 ring-blue-400 shadow-lg scale-110"
                                : ""
                            }`}
                          >
                            {turn.role === "user" ? "👨‍🎓" : "🤖"}
                          </div>
                          <div
                            className={`max-w-md p-3 rounded-lg transition-all duration-300 ${
                              turn.role === "user"
                                ? "bg-green-50 border border-green-200"
                                : "bg-blue-50 border border-blue-200"
                            } ${
                              currentMessageIndex === index
                                ? "ring-1 ring-blue-300 shadow-md scale-[1.02]"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-xs text-gray-600">
                                {turn.role === "user" ? "Student" : "Teacher"}
                              </div>
                              {turn.audioData && (
                                <Button
                                  onClick={() => handleManualPlayAudio(turn.audioData!, index)}
                                  size="sm"
                                  variant="ghost"
                                  className={`h-6 w-6 p-0 hover:bg-gray-200 transition-colors ${
                                    currentlyPlayingMessageIndex === index && isAudioPlaying 
                                      ? "bg-blue-100 text-blue-600" 
                                      : ""
                                  }`}
                                >
                                  {currentlyPlayingMessageIndex === index && isAudioPlaying ? (
                                    <VolumeX className="w-3 h-3" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-gray-900">{turn.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "analysis" && (
                    <div className="space-y-4">
                      {/* Overall Status */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Overall Assessment</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            className={
                              selectedSession.simulationResult.analysis.callSuccessful === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {selectedSession.simulationResult.analysis.callSuccessful}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedSession.simulationResult.analysis.transcriptSummary}
                        </p>
                      </div>

                      {/* Evaluation Criteria */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">Evaluation Results</h4>
                        <div className="space-y-3">
                          {Object.entries(selectedSession.simulationResult.analysis.evaluationCriteriaResults).map(([key, result]) => {
                            // Helper function to get a readable name
                            const getDisplayName = (key: string, result: any) => {
                              if (result.name) return result.name;
                              
                              // Look up in the evaluation criteria that were passed to the modal
                              const criterion = evaluationCriteria.find(c => c.id === key);
                              if (criterion) return criterion.name;
                              
                              // Handle known default criteria
                              if (key === 'teaching_effectiveness') return 'Teaching Effectiveness';
                              
                              // Fallback to formatting the key nicely
                              return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            };

                            return (
                              <div key={key} className="border-l-4 border-gray-300 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{getDisplayName(key, result)}</span>
                                  <Badge 
                                    variant="secondary"
                                    className={
                                      result.result === "success" 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {result.result}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{result.rationale}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Play Bar - Only shows on conversation tab */}
                {activeTab === "conversation" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
                    <div className="flex justify-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSkipBack}
                        disabled={currentMessageIndex <= 0}
                        className="flex items-center justify-center w-10 h-10 p-0 rounded-full disabled:opacity-50"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayToggle}
                        className="flex items-center justify-center w-10 h-10 p-0 rounded-full"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSkipForward}
                        disabled={
                          !selectedSession?.simulationResult || 
                          currentMessageIndex >= getFilteredMessages().length - 1
                        }
                        className="flex items-center justify-center w-10 h-10 p-0 rounded-full disabled:opacity-50"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="text-center text-xs text-gray-500">
                      Message {currentMessageIndex + 1} of {getFilteredMessages().length}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No session selected.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}