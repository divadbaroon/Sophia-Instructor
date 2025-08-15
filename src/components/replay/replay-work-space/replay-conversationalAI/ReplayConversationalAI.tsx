'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider"

interface SimulationSophiaPanelProps {
  onClose: () => void
}

const SimulationSophiaPanel: React.FC<SimulationSophiaPanelProps> = ({ onClose }) => {
  const {
    sophiaStateAtCurrentTime,
    messagesUpToCurrentTime,
    currentTime,
    sessionDuration,
    sessionData
  } = useSimulation()

  // audio state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [currentPlayingConversationId, setCurrentPlayingConversationId] = useState<string | null>(null)

  // Helper function to handle timezone issues
  const getTimeFromStart = (timestamp: string, sessionStartTime: string): number => {
    const eventTime = new Date(timestamp).getTime();
    const normalizedStartTime = sessionStartTime.includes('+') || sessionStartTime.includes('Z') 
      ? sessionStartTime 
      : sessionStartTime + '+00:00';
    const startTime = new Date(normalizedStartTime).getTime();
    return eventTime - startTime;
  };

  // Stop any currently playing audio completely
  const stopCurrentAudio = useCallback(() => {
    if (currentAudio) {
      console.log('🧹 Stopping and cleaning up audio')
      currentAudio.pause()
      currentAudio.currentTime = 0
      if (currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudio.src)
        console.log('🧹 Revoked blob URL')
      }
      currentAudio.src = ''
      setCurrentAudio(null)
    }
    setCurrentPlayingConversationId(null)
  }, [currentAudio])

  // Simple audio fetch following ElevenLabs docs exactly
  const playConversationAudio = async (conversationId: string) => {
    if (isLoadingAudio) return;
    
    // Don't replay the same conversation
    if (currentPlayingConversationId === conversationId) {
      console.log(`🎵 Conversation ${conversationId} already playing, skipping`)
      return;
    }
    
    try {
      setIsLoadingAudio(true)
      console.log(`🎵 Fetching audio for conversation: ${conversationId}`)
      
      // Stop any currently playing audio first
      stopCurrentAudio()
      
      const response = await fetch(`/api/elevenlabs/conversation-audio/${conversationId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      setCurrentAudio(audio)
      setCurrentPlayingConversationId(conversationId)
      
      // Add event listeners for better audio management
      audio.addEventListener('ended', () => {
        console.log(`🎵 Audio ended for conversation: ${conversationId}`)
        setCurrentPlayingConversationId(null)
      })
      
      audio.addEventListener('error', (e) => {
        console.error(`🎵 Audio error for conversation: ${conversationId}`, e)
        setCurrentPlayingConversationId(null)
      })
      
      audio.play().then(() => {
        console.log(`🎵 Started playing conversation: ${conversationId}`)
      }).catch(error => {
        console.error('Failed to play audio:', error)
        setCurrentPlayingConversationId(null)
      })
      
    } catch (error) {
      console.error(`❌ Failed to fetch conversation audio:`, error)
    } finally {
      setIsLoadingAudio(false)
    }
  }

  // Format time for display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get current conversation state
  const conversationState = useMemo(() => {
    const conversations = sophiaStateAtCurrentTime.conversations
    const activeConversation = conversations[conversations.length - 1]
    
    if (!activeConversation) {
      return { status: 'inactive', conversationId: null }
    }

    const sessionStart = sessionData?.sessionInfo.started_at
    if (!sessionStart) return { status: 'inactive', conversationId: null }

    const startTime = new Date(activeConversation.start_time).getTime()
    const normalizedSessionStart = sessionStart.includes('+') || sessionStart.includes('Z') 
      ? sessionStart 
      : sessionStart + '+00:00';
    const sessionStartTime = new Date(normalizedSessionStart).getTime()
    const conversationStartOffset = startTime - sessionStartTime

    const endTime = activeConversation.end_time 
      ? new Date(activeConversation.end_time).getTime()
      : sessionStartTime + sessionDuration
    const conversationEndOffset = endTime - sessionStartTime

    if (currentTime >= conversationStartOffset && currentTime <= conversationEndOffset) {
      return { 
        status: 'active', 
        conversationId: activeConversation.conversation_id
      }
    }

    return { status: 'inactive', conversationId: null }
  }, [sophiaStateAtCurrentTime, currentTime, sessionData, sessionDuration])

  // Simple effect to play audio when conversation becomes active
  useEffect(() => {
    if (conversationState.status === 'active' && conversationState.conversationId) {
      playConversationAudio(conversationState.conversationId)
    } else {
      // Stop audio when conversation becomes inactive
      console.log('🎵 Conversation became inactive, stopping audio')
      stopCurrentAudio()
    }
  }, [conversationState.status, conversationState.conversationId, stopCurrentAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🎵 Component unmounting, cleaning up audio')
      stopCurrentAudio()
    }
  }, [stopCurrentAudio])

  // Simulate speaking state based on message timing
  const isSpeaking = useMemo(() => {
    if (conversationState.status !== 'active') return false
    
    const lastMessage = messagesUpToCurrentTime[messagesUpToCurrentTime.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant') return false

    const sessionStart = sessionData?.sessionInfo.started_at
    if (!sessionStart) return false

    const messageTime = new Date(lastMessage.created_at).getTime()
    const normalizedSessionStart = sessionStart.includes('+') || sessionStart.includes('Z') 
      ? sessionStart 
      : sessionStart + '+00:00';
    const sessionStartTime = new Date(normalizedSessionStart).getTime()
    const messageOffset = messageTime - sessionStartTime

    return currentTime >= messageOffset && currentTime <= messageOffset + 2000
  }, [messagesUpToCurrentTime, currentTime, sessionData, conversationState.status])

  // Get current state for display
  const getCurrentState = () => {
    if (conversationState.status === 'inactive') return 'inactive'
    if (isSpeaking) return 'speaking'
    return 'listening'
  }

  const currentState = getCurrentState()

  return (
    <div className="p-4">
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Sophia</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="rounded-md border p-3 min-h-[190px]">
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                  {currentState === 'listening' ? (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Listening</span>
                    </>
                  ) : currentState === 'speaking' ? (
                    <>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Speaking</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-gray-500 rounded-full" />
                      <span className="text-xs text-muted-foreground">Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Original orb */}
              <div className="flex justify-center items-center mb-6">
                <div
                  className={cn(
                    "orb",
                    conversationState.status === "active" && currentState === 'speaking'
                      ? "orb-active animate-orb"
                      : conversationState.status === "active"
                      ? "orb-inactive animate-orb-slow"
                      : "orb-inactive"
                  )}
                ></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="rounded-md border p-4 min-h-[220px] max-h-96 overflow-auto">
            {messagesUpToCurrentTime.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm mb-1">No conversation messages yet</p>
                  <p className="text-xs">Messages will appear here as the timeline progresses</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {messagesUpToCurrentTime.map((message, index) => {
                    const sessionStart = sessionData?.sessionInfo.started_at
                    const messageTime = sessionStart 
                      ? getTimeFromStart(message.created_at, sessionStart)
                      : 0

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className={cn(
                          "p-3 rounded-xl max-w-[85%] relative",
                          message.role === 'user'
                            ? "bg-blue-100 ml-auto text-blue-900"
                            : "bg-gray-100 mr-auto text-gray-900"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="text-xs font-medium mb-1 flex items-center space-x-2">
                              <span>{message.role === 'user' ? 'Student' : 'Sophia'}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatTime(messageTime)}
                              </Badge>
                            </div>
                            <div className="text-sm">{message.content}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SimulationSophiaPanel