"use server"

import { createClient } from '@/utils/supabase/server'

export interface SessionWithConversations {
  id: string
  profile_id: string
  status: string
  started_at: string
  completed_at: string | null
  lesson_id: string
  messages: Array<{
    id: string
    content: string
    role: string
    created_at: string
  }>
}

export async function fetchSessionsWithConversations() {
  const supabase = await createClient()

  try {
    // Get sessions from the last few days
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id, profile_id, status, started_at, completed_at, lesson_id')
      .gte('started_at', '2025-08-10 00:00:00+00')
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return { success: false, error: sessionsError.message }
    }

    // Get messages for these sessions
    const sessionIds = sessions?.map(s => s.id) || []
    
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, session_id, content, role, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return { success: false, error: messagesError.message }
    }

    // Group messages by session
    const messagesBySession: { [sessionId: string]: any[] } = {}
    messages?.forEach(message => {
      if (!messagesBySession[message.session_id]) {
        messagesBySession[message.session_id] = []
      }
      messagesBySession[message.session_id].push(message)
    })

    // Combine sessions with their messages (only include sessions with messages)
    const allSessionsWithConversations = sessions
      ?.map(session => ({
        ...session,
        messages: messagesBySession[session.id] || []
      }))
      .filter(session => session.messages.length > 0) || [] // Only include sessions with conversations

    // Priority session IDs to show at the top
    const prioritySessionIds = [
      'e8abfff9-ef92-4a01-a114-226490e23374',
      'c1a5f73a-8488-4bb1-a653-01576cb9a383',
      '2bfd875f-2766-4e8b-a791-890e2f11818e',
      '3771c2e5-c560-47df-b7fa-b5e4714c227c',
      '266ff451-33dc-4bad-886a-6002a99ef2d0',
      '73650d79-70c6-4a54-920a-630f1e29616c',
      'dacbdedb-c984-4064-8cad-d51358cf445f',
      '26862a71-368e-4918-bc19-a86f96fac196',
      '393609bb-5c78-467f-93f9-3cf37ce6aeff',
      'c82e5dca-42b5-42ec-82d1-3b7911f23265',
      '723e13b6-f5fe-4f3a-a75e-f37328ae6260',
    ]

    // Sort sessions: priority sessions first, then the rest by date
    const sessionsWithConversations = allSessionsWithConversations.sort((a, b) => {
      const aIsPriority = prioritySessionIds.includes(a.id)
      const bIsPriority = prioritySessionIds.includes(b.id)
      
      // If both are priority or both are not priority, sort by date
      if (aIsPriority === bIsPriority) {
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      }
      
      // Priority sessions come first
      return aIsPriority ? -1 : 1
    })

    return { success: true, data: sessionsWithConversations }
  } catch (error) {
    console.error('Error in fetchSessionsWithConversations:', error)
    return { success: false, error: 'Failed to fetch data' }
  }
}
