"use server"

import { createClient } from '@/utils/supabase/server'

import { SessionReplayData } from "@/types"

/**
 * Fetch all session data needed for replay
 */
export async function fetchSessionReplayData(sessionId: string) {
  console.log('🔍 Starting fetchSessionReplayData for:', sessionId)
  
  const supabase = await createClient()

  try {
    // Get session info with full details
    const { data: sessionInfo, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('id, profile_id, class_id, lesson_id, status, started_at, completed_at')
      .eq('id', sessionId)
      .single()

    console.log('🔍 Session info result:', { sessionInfo, sessionError })

    if (sessionError || !sessionInfo) {
      console.error('❌ Session info error:', sessionError)
      return { success: false, error: 'Session info not found' }
    }

    // Calculate session duration
    const startTime = new Date(sessionInfo.started_at).getTime()
    const endTime = sessionInfo.completed_at ? new Date(sessionInfo.completed_at).getTime() : Date.now()
    const durationMs = endTime - startTime

    console.log('⏱️ Session duration:', durationMs, 'ms')

    console.log('🔍 Fetching code snapshots...')
    const codeSnapshots = await supabase
      .from('code_snapshots')
      .select('id, task_index, method_id, code_content, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
      
    console.log('📝 Code snapshots:', codeSnapshots.data?.length || 0, 'entries')

    console.log('🔍 Fetching navigation events...')
    const navigationEvents = await supabase
      .from('sidebar_navigation_events')
      .select('id, from_task_index, to_task_index, navigation_direction, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp')
      
    console.log('🧭 Navigation events:', navigationEvents.data?.length || 0, 'entries')

    console.log('🔍 Fetching stroke data...')
    const strokeData = await supabase
    .from('visualization_stroke_data')
    .select('*')  
    .eq('session_id', sessionId)
    .order('created_at')
    
    console.log('🎨 Stroke data:', strokeData.data?.length || 0, 'entries')
    if (strokeData.data && strokeData.data.length > 0) {
    console.log('🎨 First stroke entry structure:', strokeData.data[0])
    }
    if (strokeData.error) {
    console.error('🎨 Stroke data error:', strokeData.error)
}

    console.log('🔍 Fetching test results...')
    const testResults = await supabase
      .from('test_case_results')
      .select('id, task_index, method_id, test_case_index, test_input, expected_output, actual_output, passed, error_message, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
      
    console.log('🧪 Test results:', testResults.data?.length || 0, 'entries')

    console.log('🔍 Fetching Sophia button interactions...')
    const sophiaButtonInteractions = await supabase
      .from('sophia_button_interaction_events')
      .select('id, current_task_index, interaction_type, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp')
      
    console.log('🤖 Sophia button interactions:', sophiaButtonInteractions.data?.length || 0, 'entries')
    if (sophiaButtonInteractions.error) console.error('❌ Sophia button interactions error:', sophiaButtonInteractions.error)

    console.log('🔍 Fetching Sophia conversations...')
    const sophiaConversations = await supabase
      .from('sophia_conversations')
      .select('id, conversation_id, session_id, start_time, end_time, created_at')
      .eq('session_id', sessionId)
      .order('start_time')
      
    console.log('🎙️ Sophia conversations:', sophiaConversations.data?.length || 0, 'entries')
    if (sophiaConversations.error) console.error('❌ Sophia conversations error:', sophiaConversations.error)

    console.log('🔍 Fetching Sophia highlights...')
    const sophiaHighlights = await supabase
      .from('sophia_highlight_actions')
      .select('id, line_number, highlighted_at')
      .eq('session_id', sessionId)
      .order('highlighted_at')
      
    console.log('💡 Sophia highlights:', sophiaHighlights.data?.length || 0, 'entries')
    if (sophiaHighlights.error) console.error('❌ Sophia highlights error:', sophiaHighlights.error)

    console.log('🔍 Fetching user highlights...')
    const userHighlights = await supabase
      .from('user_highlight_actions')
      .select('id, highlighted_text, highlighted_at')
      .eq('session_id', sessionId)
      .order('highlighted_at')
      
    console.log('🔦 User highlights:', userHighlights.data?.length || 0, 'entries')

    console.log('🔍 Fetching messages...')
    const messages = await supabase
      .from('messages')
      .select('id, content, role, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
      
    console.log('💬 Messages:', messages.data?.length || 0, 'entries')

    console.log('🔍 Fetching code errors...')
    const codeErrors = await supabase
      .from('code_errors')
      .select('id, task_index, error_message, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
      
    console.log('🚨 Code errors:', codeErrors.data?.length || 0, 'entries')

    console.log('🔍 Fetching task progress...')
    const taskProgress = await supabase
      .from('task_progress')
      .select('id, task_index, completed, completed_at, attempts, test_cases_passed, total_test_cases, created_at')
      .eq('session_id', sessionId)
      .order('task_index')
      
    console.log('📊 Task progress:', taskProgress.data?.length || 0, 'entries')

    // Check for any errors
    const errors = [
      codeSnapshots.error,
      navigationEvents.error,
      strokeData.error,
      testResults.error,
      sophiaButtonInteractions.error,
      sophiaConversations.error,
      sophiaHighlights.error,
      userHighlights.error,
      messages.error,
      codeErrors.error,
      taskProgress.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('❌ Errors fetching session data:', errors)
      return { success: false, error: 'Failed to fetch some session data' }
    }

    // Construct the replay data
    const replayData: SessionReplayData = {
      sessionInfo: {
        ...sessionInfo,
        duration_ms: durationMs
      },
      codeSnapshots: codeSnapshots.data || [],
      navigationEvents: navigationEvents.data || [],
      strokeData: strokeData.data || [],
      testResults: testResults.data || [],
      sophiaButtonInteractions: sophiaButtonInteractions.data || [],
      sophiaConversations: sophiaConversations.data || [],
      sophiaHighlights: sophiaHighlights.data || [],
      userHighlights: userHighlights.data || [],
      messages: messages.data || [],
      codeErrors: codeErrors.data || [],
      taskProgress: taskProgress.data || []
    }

    const totalEvents = replayData.codeSnapshots.length + 
                       replayData.navigationEvents.length + 
                       replayData.strokeData.length + 
                       replayData.testResults.length + 
                       replayData.messages.length

    console.log(`✅ Successfully loaded session replay data for ${sessionId}:`, {
      codeSnapshots: replayData.codeSnapshots.length,
      navigationEvents: replayData.navigationEvents.length,
      strokeData: replayData.strokeData.length,
      testResults: replayData.testResults.length,
      sophiaButtonInteractions: replayData.sophiaButtonInteractions.length,
      sophiaConversations: replayData.sophiaConversations.length,
      messages: replayData.messages.length,
      totalEvents,
      durationMs: durationMs
    })

    return { success: true, data: replayData }

  } catch (error) {
    console.error('💥 Error fetching session replay data:', error)
    return { success: false, error: 'Database error' }
  }
}