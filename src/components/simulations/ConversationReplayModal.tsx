"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings } from "lucide-react";

import { Session } from "@/types";
import { sessionConfigs } from "@/lib/simulations/data/sessionConfigs";
import { runAllSimulations } from "@/lib/simulations/simulationApi";
import { ConversationReplayModal } from "@/components/simulations/ConversationReplayModal";
import { SessionCard } from "@/components/simulations/SessionCard";
import { CompetencyFilter } from "@/components/simulations/CompetencyFilter";
import { EvaluationCriteriaModal, EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";
import { VoiceSettingsModal } from "@/components/simulations/VoiceSettingsModal";
import { OverallReport } from "@/components/simulations/OverallReport";
import { AgentConfiguration } from "@/components/simulations/AgentConfiguration";

// Helper function to load criteria from localStorage
const loadCriteriaFromStorage = (): EvaluationCriterion[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('evaluationCriteria');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading criteria from localStorage:', error);
  }
  
  return [];
};

// Default evaluation criteria
const defaultCriteria: EvaluationCriterion[] = [
  {
    id: "teaching_effectiveness",
    name: "Teaching Effectiveness",
    conversationGoalPrompt: "The teacher effectively explained the concepts and helped the student understand."
  }
];

export default function SimulationReplayDashboard() {
  const [sessions, setSessions] = useState<Session[]>(
    sessionConfigs.map(config => ({ ...config, status: "pending" }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [competencyFilter, setCompetencyFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [activeTab, setActiveTab] = useState<"configuration" | "sessions" | "report">("configuration");
  const [currentAgentPrompt, setCurrentAgentPrompt] = useState<string>("");
  
  // Agent info state for the OverallReport component
  const [currentAgentInfo, setCurrentAgentInfo] = useState<{
    name: string;
    first_message: string;
    voice_id: string;
  }>({
    name: "",
    first_message: "",
    voice_id: ""
  });
  
  // Evaluation Criteria State - Initialize from localStorage
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriterion[]>(() => {
    const storedCriteria = loadCriteriaFromStorage();
    return storedCriteria.length > 0 ? storedCriteria : defaultCriteria;
  });
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

  // Voice Settings State
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  console.log("🔄 Component rendered with sessions:", sessions.map(s => ({ id: s.id, status: s.status })));

  const getDifficultyColor = (difficulty: Session["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSessions = sessions.filter(session => {
    const competencyMatch = competencyFilter === "all" || session.difficulty === competencyFilter;
    return competencyMatch;
  });

  const handleRunAllSimulations = () => {
    runAllSimulations(sessions, setSessions, setIsRunning, evaluationCriteria);
  };

  const handleSessionClick = (session: Session) => {
    console.log("🖱️ Session selected:", {
      id: session.id,
      studentName: session.studentName,
      status: session.status,
      hasResult: !!session.simulationResult
    });
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCriteriaSave = (newCriteria: EvaluationCriterion[]) => {
    setEvaluationCriteria(newCriteria);
    console.log("📊 Evaluation criteria updated:", newCriteria.map(c => c.name));
  };

  // Handle agent info updates from AgentConfiguration
  const handleAgentInfoUpdate = (agentInfo: {
    name: string;
    first_message: string;
    voice_id: string;
  }) => {
    setCurrentAgentInfo(agentInfo);
    console.log("🤖 Agent info updated:", agentInfo);
  };

  // Handle prompt updates from OverallReport (when "Add" is clicked)
  const handlePromptUpdate = (newPrompt: string) => {
    setCurrentAgentPrompt(newPrompt);
    console.log("📝 Prompt updated from OverallReport");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm mt-16">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Conversation Simulations
              </h1>
              <p className="text-sm text-gray-500">
                AI teacher-student conversation replays using ElevenLabs Simulation API
              </p>
            </div>
            <Button
              onClick={handleRunAllSimulations}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Simulations...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Run Simulations
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          {/* Main Content Card */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={activeTab === "configuration" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("configuration")}
                    className="h-8 px-4"
                  >
                    Configuration
                  </Button>
                  <Button
                    variant={activeTab === "sessions" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("sessions")}
                    className="h-8 px-4"
                  >
                    Simulated Testing
                  </Button>
                  <Button
                    variant={activeTab === "report" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("report")}
                    className="h-8 px-4"
                  >
                    Performance Report
                  </Button>
                </div>

                {/* Action buttons - only show on sessions tab */}
                {activeTab === "sessions" && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsVoiceSettingsOpen(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5 12a5 5 0 007.54.54l3-3a5 5 0 00-7.54-.54z" />
                      </svg>
                      Voice Settings
                    </Button>
                    <Button
                      onClick={() => setIsCriteriaModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Evaluation Criteria
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Tab Content - Keep OverallReport always mounted but conditionally visible */}
              <div style={{ display: activeTab === "configuration" ? "block" : "none" }}>
                <AgentConfiguration 
                  onPromptChange={setCurrentAgentPrompt} 
                  onCriteriaUpdate={setEvaluationCriteria}
                  onAgentInfoChange={handleAgentInfoUpdate}
                />
              </div>
              
              <div style={{ display: activeTab === "sessions" ? "block" : "none" }}>
                <div className="space-y-4">
                  {/* Filter Options */}
                  <CompetencyFilter 
                    competencyFilter={competencyFilter}
                    setCompetencyFilter={setCompetencyFilter}
                  />

                  {/* Sessions */}
                  {filteredSessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No sessions match the current filters.
                    </p>
                  ) : (
                    filteredSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onSessionClick={handleSessionClick}
                        getDifficultyColor={getDifficultyColor}
                      />
                    ))
                  )}
                </div>
              </div>
              
              <div style={{ display: activeTab === "report" ? "block" : "none" }}>
                {/* OverallReport with all required props */}
                <OverallReport 
                  sessions={sessions} 
                  currentPrompt={currentAgentPrompt}
                  onPromptUpdate={handlePromptUpdate}
                  currentAgentInfo={currentAgentInfo}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversation Replay Modal */}
        <ConversationReplayModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          selectedSession={selectedSession}
          evaluationCriteria={evaluationCriteria}
        />

        {/* Voice Settings Modal */}
        <VoiceSettingsModal
          isOpen={isVoiceSettingsOpen}
          onOpenChange={setIsVoiceSettingsOpen}
        />

        {/* Evaluation Criteria Modal */}
        <EvaluationCriteriaModal
          isOpen={isCriteriaModalOpen}
          onOpenChange={setIsCriteriaModalOpen}
          criteria={evaluationCriteria}
          onSave={handleCriteriaSave}
        />
      </div>
    </div>
  );
}