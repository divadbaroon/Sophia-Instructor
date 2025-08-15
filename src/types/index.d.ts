

export interface ConversationTurn {
  role: "user" | "agent";
  message: string;
  timeInCallSecs: number;
  toolCalls: any[];
  toolResults: any[];
  interrupted: boolean;
  audioData?: string;
}

export interface SimulationResult {
  simulatedConversation: ConversationTurn[];
  analysis: {
    evaluationCriteriaResults: Record<string, any>;
    dataCollectionResults: Record<string, any>;
    callSuccessful: string;
    transcriptSummary: string;
  };
}

export interface Session {
  id: string;
  studentName: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  simulationResult?: SimulationResult;
  status: "pending" | "running" | "completed" | "error";
}

export interface TaskData {
  tasks: TaskProps[]
  methodTemplates: Record<string, string>
  testCases: Record<string, TestCase[]>
  conceptMappings: Record<number, string[]>
  conceptMap?: ConceptMap 
  system: string
}