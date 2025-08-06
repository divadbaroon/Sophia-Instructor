import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Edit, RefreshCw, ExternalLink, Copy, Sparkles } from "lucide-react";
import { CloneVoiceModal } from "@/components/simulations/CloneVoiceModal";
import { GeneratedCriteriaModal } from "@/components/simulations/GeneratedCriteriaModal";
import { EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";

interface AgentInfo {
  agent_id: string;
  name: string;
  prompt: string;
  first_message: string;
  voice_id: string;
}

interface AgentConfigurationProps {
  onPromptChange?: (prompt: string) => void;
  onCriteriaUpdate?: (criteria: EvaluationCriterion[]) => void;
  onAgentInfoChange?: (agentInfo: { name: string; first_message: string; voice_id: string }) => void;
}

export function AgentConfiguration({ onPromptChange, onCriteriaUpdate, onAgentInfoChange }: AgentConfigurationProps) {
  // Basic state
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [editedName, setEditedName] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedFirstMessage, setEditedFirstMessage] = useState("");
  const [editedVoiceId, setEditedVoiceId] = useState("");
  
  // Modal state
  const [isCloneVoiceModalOpen, setIsCloneVoiceModalOpen] = useState(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [generatedCriteria, setGeneratedCriteria] = useState<EvaluationCriterion[]>([]);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);

  // Fetch agent configuration
  const fetchAgentConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching agent configuration...');
      
      const response = await fetch('/api/elevenlabs/get-agent-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch agent config');
      }

      const data = await response.json();
      const agentData: AgentInfo = {
        agent_id: data.agent_id,
        name: data.name,
        prompt: data.conversation_config.agent.prompt.prompt,
        first_message: data.conversation_config.agent.first_message || "",
        voice_id: data.conversation_config.tts.voice_id || ""
      };

      setAgentInfo(agentData);
      setEditedName(agentData.name);
      setEditedPrompt(agentData.prompt);
      setEditedFirstMessage(agentData.first_message);
      setEditedVoiceId(agentData.voice_id);
      
      // Notify parent component of current prompt
      if (onPromptChange) {
        onPromptChange(agentData.prompt);
      }
      
      // Notify parent component of current agent info
      if (onAgentInfoChange) {
        onAgentInfoChange({
          name: agentData.name,
          first_message: agentData.first_message,
          voice_id: agentData.voice_id
        });
      }
      
      console.log('✅ Agent configuration fetched successfully');

    } catch (error) {
      console.error('❌ Error fetching agent config:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch agent configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate evaluation criteria
  const generateEvaluationCriteria = async () => {
    if (!agentInfo) return;

    setIsGeneratingCriteria(true);
    
    try {
      console.log('✨ Generating evaluation criteria...');
      
      const response = await fetch('/api/claude/generate-criteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentPrompt: agentInfo.prompt,
          agentName: agentInfo.name,
          firstMessage: agentInfo.first_message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate criteria');
      }

      const data = await response.json();
      const criteria: EvaluationCriterion[] = data.criteria;

      console.log(`✅ Generated ${criteria.length} evaluation criteria`);
      
      // Show modal with generated criteria
      setGeneratedCriteria(criteria);
      setIsCriteriaModalOpen(true);

    } catch (error) {
      console.error('❌ Error generating criteria:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate criteria');
    } finally {
      setIsGeneratingCriteria(false);
    }
  };

  // Update agent configuration
  const updateAgentConfig = async () => {
    if (!agentInfo) return;

    setIsSaving(true);
    setError(null);

    try {
      console.log('💾 Updating agent configuration...');
      
      const response = await fetch('/api/elevenlabs/update-agent-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          prompt: editedPrompt,
          first_message: editedFirstMessage,
          voice_id: editedVoiceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent config');
      }

      const data = await response.json();
      const updatedAgentData: AgentInfo = {
        agent_id: data.agent_id,
        name: data.name,
        prompt: data.conversation_config.agent.prompt.prompt,
        first_message: data.conversation_config.agent.first_message || "",
        voice_id: data.conversation_config.tts.voice_id || ""
      };

      setAgentInfo(updatedAgentData);
      setIsEditing(false);
      
      // Notify parent of prompt change
      if (onPromptChange) {
        onPromptChange(updatedAgentData.prompt);
      }

      // Notify parent of agent info change
      if (onAgentInfoChange) {
        onAgentInfoChange({
          name: updatedAgentData.name,
          first_message: updatedAgentData.first_message,
          voice_id: updatedAgentData.voice_id
        });
      }

      console.log('✅ Agent configuration updated successfully');

    } catch (error) {
      console.error('❌ Error updating agent config:', error);
      setError(error instanceof Error ? error.message : 'Failed to update agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle accepting criteria from modal
  const handleAcceptCriteria = (selectedCriteria: EvaluationCriterion[]) => {
    // Save to localStorage
    localStorage.setItem('evaluationCriteria', JSON.stringify(selectedCriteria));
    
    // Notify parent component
    if (onCriteriaUpdate) {
      onCriteriaUpdate(selectedCriteria);
    }

    console.log(`✅ Accepted and saved ${selectedCriteria.length} evaluation criteria`);
  };

  // Handle voice cloning
  const handleVoiceCloned = (voiceId: string) => {
    setEditedVoiceId(voiceId);
    if (!isEditing) {
      setIsEditing(true);
    }
    console.log('Voice ID updated:', voiceId);
  };

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    if (agentInfo) {
      setEditedName(agentInfo.name);
      setEditedPrompt(agentInfo.prompt);
      setEditedFirstMessage(agentInfo.first_message);
      setEditedVoiceId(agentInfo.voice_id);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = () => {
    updateAgentConfig();
  };

  // Load agent config on component mount
  useEffect(() => {
    fetchAgentConfig();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Agent Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchAgentConfig}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
              
              {!isEditing ? (
                <>
                  <Button
                    onClick={generateEvaluationCriteria}
                    disabled={!agentInfo || isLoading || isGeneratingCriteria}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingCriteria ? 'animate-pulse' : ''}`} />
                    {isGeneratingCriteria ? 'Generating...' : 'Generate Criteria'}
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!agentInfo || isLoading}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving || !editedName.trim() || !editedPrompt.trim()}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isGeneratingCriteria && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-800">
                  Generating evaluation criteria based on your agent configuration...
                </span>
              </div>
            </div>
          )}

          <hr className="border-gray-200 mb-6" />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Loading agent configuration...</span>
              </div>
            </div>
          ) : agentInfo ? (
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Agent Name</label>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter agent name"
                    className="text-sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-900">{agentInfo.name}</span>
                  </div>
                )}
              </div>

              {/* First Message */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">First Message</label>
                {isEditing ? (
                  <Textarea
                    value={editedFirstMessage}
                    onChange={(e) => setEditedFirstMessage(e.target.value)}
                    placeholder="Enter the initial greeting message (optional)"
                    className="text-sm"
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-900">
                      {agentInfo.first_message || <em className="text-gray-500">No first message set</em>}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500 mt-1 block">
                  The initial greeting message the agent sends to start conversations
                </span>
              </div>

              {/* Current Prompt */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Prompt</label>
                {isEditing ? (
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    placeholder="Enter agent prompt"
                    className="text-sm min-h-[200px] font-mono"
                    rows={10}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                      {agentInfo.prompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* Voice ID */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Voice ID</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editedVoiceId}
                      onChange={(e) => setEditedVoiceId(e.target.value)}
                      placeholder="Enter voice ID (e.g., cjVigY5qzO86Huf0OWal)"
                      className="text-sm font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => window.open('https://elevenlabs.io/app/voice-library?use_cases=conversational', '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Browse Voices
                      </Button>
                      <Button
                        onClick={() => setIsCloneVoiceModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        Clone Voice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {agentInfo.voice_id || "Not set"}
                        </Badge>
                        <span className="text-xs text-gray-500">Current voice for TTS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.open('https://elevenlabs.io/app/voice-library?use_cases=conversational', '_blank')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Browse Voices
                        </Button>
                        <Button
                          onClick={() => setIsCloneVoiceModalOpen(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          Clone Voice
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Browse the voice library to find pre-made voices, or clone a custom voice from audio samples
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Failed to load agent configuration.</p>
              <Button
                onClick={fetchAgentConfig}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clone Voice Modal */}
      <CloneVoiceModal
        isOpen={isCloneVoiceModalOpen}
        onOpenChange={setIsCloneVoiceModalOpen}
        onVoiceCloned={handleVoiceCloned}
      />

      {/* Generated Criteria Modal */}
      <GeneratedCriteriaModal
        isOpen={isCriteriaModalOpen}
        onOpenChange={setIsCriteriaModalOpen}
        generatedCriteria={generatedCriteria}
        onAcceptCriteria={handleAcceptCriteria}
      />
    </div>
  );
}