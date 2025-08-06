import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Copy } from "lucide-react";

interface CloneVoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceCloned?: (voiceId: string) => void;
}

export function CloneVoiceModal({ isOpen, onOpenChange, onVoiceCloned }: CloneVoiceModalProps) {
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceCloneResult, setVoiceCloneResult] = useState<{voice_id: string, requires_verification: boolean} | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "completed">("idle");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingStatus("completed");

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleClone = async () => {
    if (!audioBlob) {
      setError('Please record audio');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Convert blob to File for form data
      const audioFile = new File([audioBlob], `voice-sample-${Date.now()}.webm`, {
        type: "audio/webm"
      });

      // Create form data for ElevenLabs API
      const formData = new FormData();
      formData.append('name', `Voice Clone ${new Date().toLocaleDateString()}`);
      formData.append('description', 'Voice clone created from web recording');
      formData.append('remove_background_noise', 'true');
      formData.append('files', audioFile);

      const response = await fetch('/api/elevenlabs/clone-voice', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone voice');
      }

      const result = await response.json();
      console.log('✅ Voice cloned successfully:', result.voice_id);
      
      setVoiceCloneResult(result);

    } catch (error) {
      console.error('❌ Error cloning voice:', error);
      setError(error instanceof Error ? error.message : 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  };

  const handleSaveVoice = () => {
    if (voiceCloneResult && onVoiceCloned) {
      onVoiceCloned(voiceCloneResult.voice_id);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setError(null);
    setVoiceCloneResult(null);
    setAudioBlob(null);
    setAudioUrl("");
    setRecordingStatus("idle");
    setRecordingTime(0);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clone Voice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Voice Clone Success Card */}
          {voiceCloneResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Voice Successfully Cloned!</h3>
                  <div className="space-y-2">
                    <div className="bg-white border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Voice ID</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{voiceCloneResult.voice_id}</p>
                    </div>
                    {voiceCloneResult.requires_verification && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">⚠️ Voice requires verification before use</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => navigator.clipboard.writeText(voiceCloneResult.voice_id)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Voice ID
                    </Button>
                    <Button
                      onClick={handleSaveVoice}
                      size="sm"
                      className="text-xs bg-green-600 hover:bg-green-700"
                    >
                      Use This Voice
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!voiceCloneResult && (
            <>
              {/* Sample Prompt Card */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Sample Prompt - Teaching Scenario</h3>
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed italic">
                        &quot;Hi there, I&apos;m glad you&apos;re here for office hours. I can see you&apos;re having trouble with binary tree traversals in your data structures assignment. Let me help you understand the difference between inorder, preorder, and postorder traversal. Think of it this way: imagine you&apos;re visiting every node in the tree, but the order matters. In preorder, you visit the root first, then the left subtree, then the right subtree. It&apos;s like reading a book from top to bottom, left to right. For your assignment, try implementing the recursive approach first - it&apos;s more intuitive.&quot;
                      </p>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      💡 Read this prompt naturally and conversationally when recording your voice sample.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`
                      w-20 h-20 rounded-full flex items-center justify-center text-white font-medium
                      transition-all duration-200 hover:shadow-lg
                      ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"}
                    `}
                  >
                    {isRecording ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </Button>

                  {/* Recording Timer */}
                  {isRecording && (
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {formatTime(recordingTime)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Initial State Message */}
                {recordingStatus === "idle" && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">Click the microphone to start recording</p>
                  </div>
                )}

                {/* Audio Controls */}
                {audioUrl && (
                  <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white w-full max-w-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm">Recorded Audio</h4>
                      <span className="text-xs text-gray-500 font-medium">{formatTime(recordingTime)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={togglePlayback}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                            </svg>
                            Pause
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9m-4-5v5a4 4 0 01-4-4 4 4 0 014-4zm.172 1.172a4 4 0 015.656 0" />
                            </svg>
                            Play
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isCloning}
            >
              {voiceCloneResult ? 'Close' : 'Cancel'}
            </Button>
            {!voiceCloneResult && (
              <Button
                onClick={handleClone}
                disabled={isCloning || !audioBlob}
                className="flex items-center gap-2"
              >
                {isCloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Voice Clone...
                  </>
                ) : (
                  'Clone Voice'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hidden audio element for playback */}
        {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />}
      </DialogContent>
    </Dialog>
  );
}