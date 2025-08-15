"use server"

import { createClient } from '@/utils/supabase/server'

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
  
  visualizationInteractions: Array<{
    id: string
    task: string
    action: string
    zone: string
    x: number
    y: number
    timestamp: string
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

/**
 * Fetch all session data needed for replay - WITH DEBUGGING
 */
export async function fetchSessionReplayData(sessionId: string) {
  console.log('🔍 Starting fetchSessionReplayData for:', sessionId)
  
  const supabase = await createClient()

  try {
    // First, let's check if the session exists at all
    console.log('🔍 Checking if session exists...')
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('id', sessionId)
      
    console.log('🔍 Session check result:', { sessionCheck, sessionCheckError })
    
    if (sessionCheckError) {
      console.error('❌ Session check error:', sessionCheckError)
      return { success: false, error: `Session check failed: ${sessionCheckError.message}` }
    }
    
    if (!sessionCheck || sessionCheck.length === 0) {
      console.error('❌ Session not found in database')
      
      // Let's also check what sessions DO exist
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('learning_sessions')
        .select('id, status, started_at')
        .limit(5)
        
      console.log('📋 Available sessions (first 5):', allSessions)
      
      return { success: false, error: 'Session not found in database' }
    }

    console.log('✅ Session exists, getting full session info...')

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

    // Now let's check each data source individually with debug info
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
      .select('id, task, zone, stroke_number, point_count, complete_points, start_point, end_point, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
      
    console.log('🎨 Stroke data:', strokeData.data?.length || 0, 'entries')

    console.log('🔍 Fetching visualization interactions...')
    const visualizationInteractions = await supabase
      .from('visualization_interactions')
      .select('id, task, action, zone, x, y, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp')
      
    console.log('👆 Visualization interactions:', visualizationInteractions.data?.length || 0, 'entries')

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
      visualizationInteractions.error,
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
      visualizationInteractions: visualizationInteractions.data || [],
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
                       replayData.visualizationInteractions.length + 
                       replayData.testResults.length + 
                       replayData.messages.length

    console.log(`✅ Successfully loaded session replay data for ${sessionId}:`, {
      codeSnapshots: replayData.codeSnapshots.length,
      navigationEvents: replayData.navigationEvents.length,
      strokeData: replayData.strokeData.length,
      visualizationInteractions: replayData.visualizationInteractions.length,
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