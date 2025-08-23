

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

export interface SessionReplayData {
  // Session metadata
  sessionInfo: {
    id: string
    profile_id: string
    class_id: string
    lesson_id: string
    status: string
    started_at: string
    completed_at: string | null
    duration_ms: number | null
  }
  
  // All timestamped events for replay
  codeSnapshots: Array<{
    id: string
    task_index: number
    method_id: string
    code_content: string
    created_at: string
  }>
  
  navigationEvents: Array<{
    id: string
    from_task_index: number
    to_task_index: number
    navigation_direction: string
    timestamp: string
  }>
  
  strokeData: Array<{
    id: string
    task: string
    zone: string
    stroke_number: number
    point_count: number
    complete_points: any[]
    start_point: any
    end_point: any
    created_at: string
  }>
  
  testResults: Array<{
    id: string
    task_index: number
    method_id: string
    test_case_index: number
    test_input: any
    expected_output: any
    actual_output: any
    passed: boolean
    error_message: string | null
    created_at: string
  }>
  
  sophiaButtonInteractions: Array<{
    id: string
    current_task_index: number
    interaction_type: string
    timestamp: string
  }>
  
  sophiaConversations: Array<{
    id: string
    conversation_id: string  // ElevenLabs conversation ID
    session_id: string
    start_time: string
    end_time: string | null
    created_at: string
  }>
  
  sophiaHighlights: Array<{
    id: string
    line_number: number
    highlighted_at: string
  }>
  
  userHighlights: Array<{
    id: string
    highlighted_text: string
    highlighted_at: string
  }>
  
  messages: Array<{
    id: string
    content: string
    role: string
    created_at: string
  }>
  
  codeErrors: Array<{
    id: string
    task_index: number
    error_message: string
    created_at: string
  }>
  
  taskProgress: Array<{
    id: string
    task_index: number
    completed: boolean
    completed_at: string | null
    attempts: number
    test_cases_passed: number
    total_test_cases: number
    created_at: string
  }>
}

export interface VideoCardProps {
    // Original video props (now optional)
    id?: string
    title?: string
    thumbnail?: string
    userImg?: string
    username?: string
    createdAt?: Date
    views?: number
    visibility?: string
    duration?: number
    
    // New learning session props
    profileId?: string
    sessionId?: string
    lessonId?: string  
    status?: string
    started_at?: string
    completed_at?: string
    lesson?: string
    messageCount?: number
}

export interface VideoDetailsPageProps {
  params: Promise<{
    conceptId: string
    sessionId: string
  }>
}

export interface ActivityEvent {
  timestamp: string
  type: string
  description: string
  details?: string
}

export interface CodeEvent {
  timestamp: string
  type: string
  description: string
  details?: string
}