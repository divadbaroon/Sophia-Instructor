import { Session, SimulationResult, ConversationTurn } from "@/types";
import { EvaluationCriterion } from "@/components/simulations/EvaluationCriteriaModal";

// TTS generation function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateTTS = async (text: string, role: "user" | "agent"): Promise<string | undefined> => {
  try {
    // Get voice IDs from localStorage with fallbacks
    const teacherVoiceId = typeof window !== 'undefined' 
      ? localStorage.getItem('teacherVoiceId') || "NihRgaLj2HWAjvZ5XNxl"
      : "NihRgaLj2HWAjvZ5XNxl";
    
    const studentVoiceId = typeof window !== 'undefined'
      ? localStorage.getItem('studentVoiceId') || "iDxgwKogoeR1jrVkJKJv" 
      : "iDxgwKogoeR1jrVkJKJv";

    // Use different voice IDs for teacher vs student
    const voiceId = role === "agent" 
      ? teacherVoiceId // Teacher voice
      : studentVoiceId; // Student voice
    
    console.log(`🎵 Generating TTS for ${role} with voice ${voiceId}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);

    const response = await fetch('/api/elevenlabs/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: text,
        voiceId: voiceId 
      })
    });

    if (!response.ok) {
      console.error(`❌ TTS API error: ${response.status} ${response.statusText}`);
      return undefined;
    }

    const result = await response.json();
    console.log(`✅ TTS generated for ${role}, size: ${result.size} bytes`);
    return result.audioData;

  } catch (error) {
    console.error(`💥 TTS generation failed for ${role}:`, error);
    return undefined;
  }
};

export const runSimulation = async (
  session: Session, 
  evaluationCriteria: EvaluationCriterion[]
): Promise<SimulationResult> => {
  console.log(`🎯 Starting simulation for session:`, {
    id: session.id,
    studentName: session.studentName,
    subject: session.subject,
    difficulty: session.difficulty,
    criteriaCount: evaluationCriteria.length
  });

  const requestBody = {
    agentId: process.env.NEXT_PUBLIC_TEACHER_AGENT_ID,
    simulationSpecification: {
      simulatedUserConfig: {
        prompt: {
          prompt: `You are a ${session.difficulty} level student learning about ${session.subject}. You need help understanding the concepts. Ask questions, express confusion when appropriate, and engage naturally in the learning process. Be curious but realistic about your current skill level. IMPORTANT: Keep the conversation brief - ask 2-3 focused questions, then thank the teacher and indicate you understand when you feel ready. When the teacher asks if you want to continue or if you have more questions, politely decline and say you're ready to practice on your own. Aim for exactly 5-7 total exchanges in the conversation.`,
          llm: "gpt-4o",
          temperature: 0.7
        }
      }
    },
    extraEvaluationCriteria: evaluationCriteria.map(criterion => ({
      id: criterion.id,
      name: criterion.name,
      conversationGoalPrompt: criterion.conversationGoalPrompt,
      useKnowledgeBase: false
    }))
  };

  console.log(`📤 Sending API request for ${session.studentName}:`, {
    url: '/api/elevenlabs/simulate-conversation',
    agentId: requestBody.agentId,
    prompt: requestBody.simulationSpecification.simulatedUserConfig.prompt.prompt.substring(0, 100) + "...",
    evaluationCriteria: requestBody.extraEvaluationCriteria.length,
    criteriaNames: requestBody.extraEvaluationCriteria.map(c => c.name)
  });

  try {
    const response = await fetch('/api/elevenlabs/simulate-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 API Response for ${session.studentName}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error for ${session.studentName}:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Failed to run simulation: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Simulation completed for ${session.studentName}:`, {
      conversationLength: result.simulatedConversation?.length || 0,
      analysisStatus: result.analysis?.callSuccessful,
      summary: result.analysis?.transcriptSummary?.substring(0, 100) + "..." || "No summary",
      evaluationResults: Object.keys(result.analysis?.evaluationCriteriaResults || {})
    });

    // Log conversation details
    if (result.simulatedConversation) {
      console.log(`💬 Conversation turns for ${session.studentName}:`, 
        result.simulatedConversation.map((turn: ConversationTurn, index: number) => ({
          turn: index + 1,
          role: turn.role,
          messagePreview: turn.message ? turn.message.substring(0, 50) + "..." : "[No message]",
          timeInCall: turn.timeInCallSecs,
          hasToolCalls: turn.toolCalls?.length > 0,
          hasToolResults: turn.toolResults?.length > 0
        }))
      );
    }

    // TEMPORARILY DISABLED FOR COST TESTING
// Generate TTS for each message
// console.log(`🎵 Starting TTS generation for ${session.studentName}...`);
// const ttsStartTime = Date.now();
// 
// if (result.simulatedConversation) {
//   const processedConversation = await Promise.all(
//     result.simulatedConversation.map(async (turn: ConversationTurn) => {
//       // Only generate TTS for messages with actual text content
//       if (turn.message && turn.message !== "==! END_CALL!==" && turn.message.trim().length > 0) {
//         const audioData = await generateTTS(turn.message, turn.role);
//         return { ...turn, audioData };
//       }
//       return turn;
//     })
//   );
//   
//   const ttsEndTime = Date.now();
//   const ttsDuration = ttsEndTime - ttsStartTime;
//   console.log(`🎵 TTS generation completed for ${session.studentName} in ${ttsDuration}ms`);
//   
//   // Update the result with processed conversation
//   result.simulatedConversation = processedConversation;
// }

    return result;
    
  } catch (error) {
    console.error(`💥 Simulation error for ${session.studentName}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const runAllSimulations = async (
  sessions: Session[],
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
  evaluationCriteria: EvaluationCriterion[]
) => {
  console.log("🚀 Starting all simulations...");
  console.log("📋 Environment check:", {
    teacherAgentId: process.env.NEXT_PUBLIC_TEACHER_AGENT_ID ? "✅ Set" : "❌ Missing",
    sessionsCount: sessions.length,
    criteriaCount: evaluationCriteria.length,
    criteriaNames: evaluationCriteria.map(c => c.name)
  });
  
  setIsRunning(true);
  
  try {
    // Reset all sessions to pending
    console.log("🔄 Resetting all sessions to pending...");
    setSessions(prev => prev.map(session => ({ 
      ...session, 
      status: "pending" as const,
      simulationResult: undefined 
    })));

    // Run simulations simultaneously using Promise.allSettled
    console.log(`📊 Running ${sessions.length} simulations simultaneously...`);
    const startTime = Date.now();
    
    const simulationPromises = sessions.map(async (session, index) => {
      console.log(`🎬 [${index + 1}/${sessions.length}] Starting simulation for ${session.studentName}...`);
      
      // Update status to running when simulation starts
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, status: "running" as const }
          : s
      ));
      
      try {
        const sessionStartTime = Date.now();
        const result = await runSimulation(session, evaluationCriteria);
        const sessionEndTime = Date.now();
        const sessionDuration = sessionEndTime - sessionStartTime;
        
        console.log(`⏱️ Simulation completed for ${session.studentName} in ${sessionDuration}ms`);
        console.log(`✅ [${index + 1}/${sessions.length}] Successfully completed ${session.studentName}`);
        
        return { session, result, status: 'completed' as const };
      } catch (error) {
        console.error(`❌ [${index + 1}/${sessions.length}] Failed simulation for ${session.studentName}:`, error);
        return { session, error, status: 'error' as const };
      }
    });

    // Wait for all simulations to complete
    const results = await Promise.allSettled(simulationPromises);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log(`⏱️ All simulations completed in ${totalDuration}ms`);

    // Update sessions with results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { session, result: simulationResult, status } = result.value;
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, status, simulationResult }
            : s
        ));
      } else {
        const session = sessions[index];
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, status: "error" as const }
            : s
        ));
      }
    });
    
    console.log("🎉 All simulations completed!");
    
  } catch (error) {
    console.error("💥 Critical error running simulations:", error);
  } finally {
    setIsRunning(false);
    console.log("🔚 Simulation process finished");
  }
};