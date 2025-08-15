'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { fetchSessionReplayData, SessionReplayData } from '@/lib/actions/session-replay-data-actions';
import { useSessionData } from '@/lib/hooks/session/useSessionData';

interface SimulationContextType {
  // Session data
  sessionId: string | null
  lessonId: string | null
  sessionData: SessionReplayData | null
  lessonStructure: any | null  // Added lesson structure
  isLoading: boolean
  isLoadingTasks: boolean      // Added lesson loading state
  error: string | null
  
  // Timeline control
  currentTime: number
  sessionDuration: number
  isPlaying: boolean
  playbackSpeed: number
  
  // Timeline actions
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  
  // Filtered data at current time
  codeAtCurrentTime: string | null
  activeTaskAtCurrentTime: number | null
  strokesUpToCurrentTime: any[]
  messagesUpToCurrentTime: any[]
  sophiaStateAtCurrentTime: {
    isOpen: boolean
    conversations: any[]
    highlights: any[]
  }
  testResultsUpToCurrentTime: any[]
  navigationEventsUpToCurrentTime: any[]
  visualizationInteractionsUpToCurrentTime: any[]
  userHighlightsUpToCurrentTime: any[]
  codeErrorsUpToCurrentTime: any[]
  taskProgressUpToCurrentTime: any[]
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Helper hook to extract sessionId from simulation URL
const useSimulationUrl = () => {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');

  useEffect(() => {
    // Match pattern: /replay/[lessonId]/session/[sessionId]
    const urlMatch = pathname?.match(/\/replay\/([^\/]+)\/session\/([^\/]+)/);
    
    if (urlMatch) {
      const [, newLessonId, newSessionId] = urlMatch;
      
      if (newLessonId !== lessonId || newSessionId !== sessionId) {
        console.log("Simulation URL - Lesson ID:", newLessonId, "Session ID:", newSessionId);
        setLessonId(newLessonId);
        setSessionId(newSessionId);
      }
    }
  }, [pathname, lessonId, sessionId]);

  return { sessionId, lessonId };
};

// Helper function to convert timestamp to milliseconds from session start
const getTimeFromStart = (timestamp: string, sessionStartTime: string): number => {
  // Ensure both timestamps are treated consistently
  const eventTime = new Date(timestamp).getTime();
  
  // If session start time doesn't have timezone info, assume it's UTC
  const normalizedStartTime = sessionStartTime.includes('+') || sessionStartTime.includes('Z') 
    ? sessionStartTime 
    : sessionStartTime + '+00:00';
    
  const startTime = new Date(normalizedStartTime).getTime();
  return eventTime - startTime;
};

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  // URL extraction
  const { sessionId, lessonId } = useSimulationUrl();
  
  // Load lesson structure data (tasks, examples, templates)
  const { sessionData: lessonStructure, isLoadingTasks } = useSessionData(lessonId);
  
  // Session replay data state
  const [sessionData, setSessionData] = useState<SessionReplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timeline control state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Log lesson structure when loaded
  useEffect(() => {
    if (lessonStructure && !isLoadingTasks) {
      console.log('📚 Lesson structure loaded:', {
        tasks: lessonStructure.tasks?.length || 0,
        lessonTitle: lessonStructure.title,
        lessonId: lessonId
      });
    }
  }, [lessonStructure, isLoadingTasks, lessonId]);

  // Calculate session duration
  const sessionDuration = useMemo(() => {
    return sessionData?.sessionInfo.duration_ms || 0;
  }, [sessionData]);

  // Load session data when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    const loadSessionData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🎬 Loading session replay data for sessionId:', sessionId);
        
        const result = await fetchSessionReplayData(sessionId);
        
        if (result.success && result.data) {
          setSessionData(result.data);
          console.log('✅ Session data loaded successfully!', {
            duration: result.data.sessionInfo.duration_ms,
            totalEvents: {
              codeSnapshots: result.data.codeSnapshots.length,
              strokes: result.data.strokeData.length,
              navigation: result.data.navigationEvents.length,
              tests: result.data.testResults.length,
              messages: result.data.messages.length,
              sophiaConversations: result.data.sophiaConversations.length,
              sophiaInteractions: result.data.sophiaButtonInteractions.length
            }
          });
        } else {
          console.error('❌ Failed to load session data:', result.error);
          setError(result.error || 'Failed to load session data');
        }
      } catch (err) {
        console.error('💥 Error loading session data:', err);
        setError('Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId]);

  // Filter data based on current time
  const codeAtCurrentTime = useMemo(() => {
    if (!sessionData) return null;
    
    const sessionStart = sessionData.sessionInfo.started_at;
    console.log("START TIME", sessionStart)
    
    const relevantSnapshots = sessionData.codeSnapshots.filter(snapshot => {
      const snapshotTime = getTimeFromStart(snapshot.created_at, sessionStart);
      return snapshotTime <= currentTime;
    });
    
    // Return the most recent code content
    const latestSnapshot = relevantSnapshots[relevantSnapshots.length - 1];
    return latestSnapshot?.code_content || null;
  }, [sessionData, currentTime]);

  const activeTaskAtCurrentTime = useMemo(() => {
    if (!sessionData) return null;
    
    const sessionStart = sessionData.sessionInfo.started_at;
    const relevantNavigation = sessionData.navigationEvents.filter(nav => {
      const navTime = getTimeFromStart(nav.timestamp, sessionStart);
      return navTime <= currentTime;
    });
    
    // Return the most recent task index
    const latestNav = relevantNavigation[relevantNavigation.length - 1];
    return latestNav?.to_task_index ?? 0; // Default to task 0
  }, [sessionData, currentTime]);

  const strokesUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.strokeData.filter(stroke => {
      const strokeTime = getTimeFromStart(stroke.created_at, sessionStart);
      return strokeTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const messagesUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    console.log('🕐 Session start time:', sessionStart);
    console.log('🕐 Current time:', currentTime);
    
    return sessionData.messages.filter(message => {
      const messageTime = getTimeFromStart(message.created_at, sessionStart);
      console.log(`📧 Message at ${message.created_at} → offset: ${messageTime}ms → show: ${messageTime <= currentTime}`);
      return messageTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const sophiaStateAtCurrentTime = useMemo(() => {
    if (!sessionData) return { isOpen: false, conversations: [], highlights: [] };
    
    const sessionStart = sessionData.sessionInfo.started_at;
    
    // Check if Sophia panel is open at current time
    const relevantButtonInteractions = sessionData.sophiaButtonInteractions.filter(interaction => {
      const interactionTime = getTimeFromStart(interaction.timestamp, sessionStart);
      return interactionTime <= currentTime;
    });
    
    // Determine if panel is open (last interaction type)
    const lastInteraction = relevantButtonInteractions[relevantButtonInteractions.length - 1];
    const isOpen = lastInteraction?.interaction_type === 'open';
    
    // Get conversations up to current time
    const conversations = sessionData.sophiaConversations.filter(conv => {
      const convTime = getTimeFromStart(conv.start_time, sessionStart);
      return convTime <= currentTime;
    });
    
    // Get highlights up to current time
    const highlights = sessionData.sophiaHighlights.filter(highlight => {
      const highlightTime = getTimeFromStart(highlight.highlighted_at, sessionStart);
      return highlightTime <= currentTime;
    });
    
    return { isOpen, conversations, highlights };
  }, [sessionData, currentTime]);

  const testResultsUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.testResults.filter(test => {
      const testTime = getTimeFromStart(test.created_at, sessionStart);
      return testTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const navigationEventsUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.navigationEvents.filter(nav => {
      const navTime = getTimeFromStart(nav.timestamp, sessionStart);
      return navTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const visualizationInteractionsUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.visualizationInteractions.filter(interaction => {
      const interactionTime = getTimeFromStart(interaction.timestamp, sessionStart);
      return interactionTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const userHighlightsUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.userHighlights.filter(highlight => {
      const highlightTime = getTimeFromStart(highlight.highlighted_at, sessionStart);
      return highlightTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const codeErrorsUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.codeErrors.filter(error => {
      const errorTime = getTimeFromStart(error.created_at, sessionStart);
      return errorTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const taskProgressUpToCurrentTime = useMemo(() => {
    if (!sessionData) return [];
    
    const sessionStart = sessionData.sessionInfo.started_at;
    return sessionData.taskProgress.filter(progress => {
      const progressTime = getTimeFromStart(progress.created_at, sessionStart);
      return progressTime <= currentTime;
    });
  }, [sessionData, currentTime]);

  const value: SimulationContextType = {
    // Session data
    sessionId,
    lessonId,
    sessionData,
    lessonStructure,        // ← ADD: Missing from the value object
    isLoading,
    isLoadingTasks,         // ← ADD: Missing from the value object
    error,
    
    // Timeline control
    currentTime,
    sessionDuration,
    isPlaying,
    playbackSpeed,
    
    // Timeline actions
    setCurrentTime,
    setIsPlaying,
    setPlaybackSpeed,
    
    // Filtered data at current time
    codeAtCurrentTime,
    activeTaskAtCurrentTime,
    strokesUpToCurrentTime,
    messagesUpToCurrentTime,
    sophiaStateAtCurrentTime,
    testResultsUpToCurrentTime,
    navigationEventsUpToCurrentTime,
    visualizationInteractionsUpToCurrentTime,
    userHighlightsUpToCurrentTime,
    codeErrorsUpToCurrentTime,
    taskProgressUpToCurrentTime,
  };

  // Log filtered data whenever currentTime changes
  useEffect(() => {
    if (!sessionData) return;
    
    const timeInSeconds = (currentTime / 1000).toFixed(1);
    const progressPercentage = sessionDuration > 0 ? ((currentTime / sessionDuration) * 100).toFixed(1) : '0';
    
    console.group(`🎬 FILTERED DATA at ${timeInSeconds}s (${progressPercentage}%)`);
    
    console.log('📝 Code:', {
      hasCode: !!codeAtCurrentTime,
      codeLength: codeAtCurrentTime?.length || 0,
      preview: codeAtCurrentTime?.substring(0, 100) + '...' || 'No code yet'
    });
    
    console.log('🧭 Navigation:', {
      activeTask: activeTaskAtCurrentTime,
      navigationEvents: navigationEventsUpToCurrentTime.length
    });
    
    console.log('🎨 Drawing:', {
      strokes: strokesUpToCurrentTime.length,
      totalPoints: strokesUpToCurrentTime.reduce((sum, stroke) => sum + stroke.point_count, 0),
      latestStroke: strokesUpToCurrentTime[strokesUpToCurrentTime.length - 1]?.zone || 'None'
    });
    
    console.log('💬 Messages:', {
      messages: messagesUpToCurrentTime.length,
      latestMessage: messagesUpToCurrentTime[messagesUpToCurrentTime.length - 1]?.content.substring(0, 50) + '...' || 'No messages yet'
    });
    
    console.log('🤖 Sophia State:', {
      panelOpen: sophiaStateAtCurrentTime.isOpen,
      conversations: sophiaStateAtCurrentTime.conversations.length,
      highlights: sophiaStateAtCurrentTime.highlights.length
    });
    
    console.log('🧪 Tests:', {
      testResults: testResultsUpToCurrentTime.length,
      latestTest: testResultsUpToCurrentTime[testResultsUpToCurrentTime.length - 1]?.passed ?? 'No tests yet'
    });
    
    console.log('👆 Interactions:', {
      visualizationClicks: visualizationInteractionsUpToCurrentTime.length,
      userHighlights: userHighlightsUpToCurrentTime.length,
      codeErrors: codeErrorsUpToCurrentTime.length
    });
    
    console.log('📊 Progress:', {
      taskProgress: taskProgressUpToCurrentTime.length,
      completedTasks: taskProgressUpToCurrentTime.filter(t => t.completed).length
    });
    
    // Show raw filtered arrays for detailed inspection
    console.log('🗂️ Raw Filtered Data:', {
      strokesUpToCurrentTime,
      messagesUpToCurrentTime,
      testResultsUpToCurrentTime,
      userHighlightsUpToCurrentTime
    });
    
    console.groupEnd();
  }, [
    currentTime, 
    sessionData,
    sessionDuration,
    codeAtCurrentTime,
    activeTaskAtCurrentTime,
    strokesUpToCurrentTime,
    messagesUpToCurrentTime,
    sophiaStateAtCurrentTime,
    testResultsUpToCurrentTime,
    navigationEventsUpToCurrentTime,
    visualizationInteractionsUpToCurrentTime,
    userHighlightsUpToCurrentTime,
    codeErrorsUpToCurrentTime,
    taskProgressUpToCurrentTime
  ]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};