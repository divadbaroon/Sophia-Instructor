import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Volume2 } from "lucide-react";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceSettingsModal({
  isOpen,
  onOpenChange
}: VoiceSettingsModalProps) {
  const [teacherVoiceId, setTeacherVoiceId] = useState("");
  const [studentVoiceId, setStudentVoiceId] = useState("");

  // Load voice IDs from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTeacherVoiceId = localStorage.getItem('teacherVoiceId') || "NihRgaLj2HWAjvZ5XNxl";
      const savedStudentVoiceId = localStorage.getItem('studentVoiceId') || "EXAVITQu4vr4xnSDxMaL";
      
      setTeacherVoiceId(savedTeacherVoiceId);
      setStudentVoiceId(savedStudentVoiceId);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teacherVoiceId', teacherVoiceId);
      localStorage.setItem('studentVoiceId', studentVoiceId);
      
      console.log("🎵 Voice settings saved:", {
        teacherVoiceId,
        studentVoiceId
      });
    }
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to saved values
    if (typeof window !== 'undefined') {
      const savedTeacherVoiceId = localStorage.getItem('teacherVoiceId') || "NihRgaLj2HWAjvZ5XNxl";
      const savedStudentVoiceId = localStorage.getItem('studentVoiceId') || "iDxgwKogoeR1jrVkJKJv";
      
      setTeacherVoiceId(savedTeacherVoiceId);
      setStudentVoiceId(savedStudentVoiceId);
    }
    
    onOpenChange(false);
  };

  const testVoice = async (voiceId: string, voiceType: string) => {
    try {
      console.log(`🎵 Testing ${voiceType} voice: ${voiceId}`);
      
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: `Hello, this is a test of the ${voiceType} voice.`,
          voiceId: voiceId 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Play the audio
      const audio = new Audio(`data:audio/mp3;base64,${result.audioData}`);
      audio.play().catch(error => {
        console.error("🎵 Failed to play test audio:", error);
      });
      
    } catch (error) {
      console.error(`🎵 Voice test failed for ${voiceType}:`, error);
      alert(`Failed to test ${voiceType} voice. Please check the voice ID.`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Teacher Voice */}
          <div className="space-y-2">
            <Label htmlFor="teacher-voice">Teacher Voice ID</Label>
            <div className="flex gap-2">
              <Input
                id="teacher-voice"
                value={teacherVoiceId}
                onChange={(e) => setTeacherVoiceId(e.target.value)}
                placeholder="Enter teacher voice ID"
                className="flex-1"
              />
              <Button
                onClick={() => testVoice(teacherVoiceId, "teacher")}
                variant="outline"
                size="sm"
                disabled={!teacherVoiceId.trim()}
                className="px-3"
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Voice ID for the AI teacher in conversations
            </p>
          </div>

          {/* Student Voice */}
          <div className="space-y-2">
            <Label htmlFor="student-voice">Student Voice ID</Label>
            <div className="flex gap-2">
              <Input
                id="student-voice"
                value={studentVoiceId}
                onChange={(e) => setStudentVoiceId(e.target.value)}
                placeholder="Enter student voice ID"
                className="flex-1"
              />
              <Button
                onClick={() => testVoice(studentVoiceId, "student")}
                variant="outline"
                size="sm"
                disabled={!studentVoiceId.trim()}
                className="px-3"
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Voice ID for the simulated student in conversations
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}