'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider"

const SimulationSophiaPanel = () => {
  const {
    sophiaStateAtCurrentTime,
    messagesUpToCurrentTime,
    currentTime,
    sessionDuration,
    sessionData,
    isPlaying 
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
      console.log('⏹️ Stopping audio')
      currentAudio.pause()
      currentAudio.currentTime = 0
      
      if (currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudio.src)
      }
      
      currentAudio.src = ''
      setCurrentAudio(null)
    }
    setCurrentPlayingConversationId(null)
  }, [currentAudio])

  // Helper function to calculate how far into the audio we should be
  const calculateAudioOffset = (conversationStartTime: number): number => {
    // conversationStartTime is when the conversation started (in ms from session start)
    // currentTime is where we are now (in ms from session start)
    const offsetMs = currentTime - conversationStartTime
    const offsetSeconds = Math.max(0, offsetMs / 1000) // Convert to seconds, never negative
    
    console.log(`🎯 Audio offset calculation:`)
    console.log(`   Current time: ${(currentTime / 1000).toFixed(1)}s`)
    console.log(`   Conversation start: ${(conversationStartTime / 1000).toFixed(1)}s`)
    console.log(`   Audio should be at: ${offsetSeconds.toFixed(1)}s`)
    
    return offsetSeconds
  }

  // Helper function to sync existing audio to timeline (when scrubbing)
  const syncAudioToTimeline = (audio: HTMLAudioElement, conversationStartTime: number) => {
    if (!audio) return
    
    const targetOffset = calculateAudioOffset(conversationStartTime)
    
    // If we're past the end of the audio, stop it
    if (targetOffset >= audio.duration) {
      console.log(`⏭️ Scrubbed past audio end - stopping`)
      audio.pause()
      setCurrentPlayingConversationId(null)
      setCurrentAudio(null)
      return
    }
    
    // If we're before the start, pause it
    if (targetOffset < 0) {
      console.log(`⏮️ Scrubbed before audio start - pausing`)
      audio.pause()
      return
    }
    
    // Only seek if we're off by more than 0.5 seconds (avoid constant seeking)
    const currentOffset = audio.currentTime
    const timeDiff = Math.abs(currentOffset - targetOffset)
    
    if (timeDiff > 0.5) {
      console.log(`🎯 Syncing audio: ${currentOffset.toFixed(1)}s → ${targetOffset.toFixed(1)}s`)
      audio.currentTime = targetOffset
      
      // Resume playing only if timeline is playing
      if (isPlaying && audio.paused) {
        audio.play().catch(error => console.log('Resume play failed:', error))
      } else if (!isPlaying && !audio.paused) {
        audio.pause()
      }
    }
  }

  // Timeline-synced audio playback
  const playConversationAudio = async (conversationId: string, conversationStartTime: number) => {
    if (isLoadingAudio) return;
    if (currentPlayingConversationId === conversationId) {
      // If same conversation is playing, just sync the time
      if (currentAudio) {
        syncAudioToTimeline(currentAudio, conversationStartTime);
      }
      return;
    }
    
    try {
      setIsLoadingAudio(true)
      console.log(`🎵 Playing synced audio for: ${conversationId}`)
      
      // Clean up any existing audio first
      if (currentAudio) {
        currentAudio.pause()
        if (currentAudio.src.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudio.src)
        }
        currentAudio.src = ''
        setCurrentAudio(null)
      }
      
      const response = await fetch(`/api/elevenlabs/conversation-audio/${conversationId}`)
      
      if (!response.ok) {
        console.error(`❌ API failed: ${response.status}`)
        return
      }
      
      const audioBlob = await response.blob()
      console.log(`✅ Audio ready: ${audioBlob.size} bytes`)
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.volume = 0.8
      audio.preload = 'auto'
      
      // Wait for audio to load before seeking
      const waitForAudioLoad = new Promise<void>((resolve) => {
        audio.addEventListener('loadeddata', () => {
          console.log(`✅ Audio loaded: ${audio.duration}s`)
          resolve()
        }, { once: true })
      })
      
      audio.addEventListener('ended', () => {
        console.log(`🏁 Audio finished: ${conversationId}`)
        URL.revokeObjectURL(audioUrl)
        setCurrentPlayingConversationId(null)
        setCurrentAudio(null)
      })
      
      // Load the audio
      audio.load()
      
      // Wait for it to be ready
      await waitForAudioLoad
      
      // Calculate where we should be in the audio
      const audioOffset = calculateAudioOffset(conversationStartTime)
      
      // Check if we're past the end of the audio
      if (audioOffset >= audio.duration) {
        console.log(`⏭️ Timeline past audio end (${audioOffset}s >= ${audio.duration}s) - not playing`)
        URL.revokeObjectURL(audioUrl)
        return
      }
      
      // Check if we're before the start (shouldn't happen, but just in case)
      if (audioOffset < 0) {
        console.log(`⏮️ Timeline before audio start - waiting`)
        URL.revokeObjectURL(audioUrl)
        return
      }
      
      // Seek to the correct position
      audio.currentTime = audioOffset
      console.log(`🎯 Seeking to ${audioOffset.toFixed(1)}s of ${audio.duration.toFixed(1)}s`)
      
      // Set the audio reference first
      setCurrentAudio(audio)
      setCurrentPlayingConversationId(conversationId)
      
      // Only play if the timeline is currently playing
      if (isPlaying) {
        try {
          await audio.play()
          console.log(`🎵 ✅ Playing synced: ${conversationId} from ${audioOffset.toFixed(1)}s`)
        } catch (playError) {
          console.error(`❌ Play failed:`, playError)
          URL.revokeObjectURL(audioUrl)
          setCurrentAudio(null)
          setCurrentPlayingConversationId(null)
        }
      } else {
        console.log(`⏸️ Timeline paused - audio loaded but not playing`)
      }
      
    } catch (error) {
      console.error(`❌ Error:`, error)
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

  // Get current conversation state - now returns start time
  const conversationState = useMemo(() => {
    const conversations = sophiaStateAtCurrentTime.conversations
    const activeConversation = conversations[conversations.length - 1]
    
    if (!activeConversation) {
      return { status: 'inactive', conversationId: null, startTime: 0 }
    }

    const sessionStart = sessionData?.sessionInfo.started_at
    if (!sessionStart) return { status: 'inactive', conversationId: null, startTime: 0 }

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
        conversationId: activeConversation.conversation_id,
        startTime: conversationStartOffset
      }
    }

    return { status: 'inactive', conversationId: null, startTime: 0 }
  }, [sophiaStateAtCurrentTime, currentTime, sessionData, sessionDuration])

  // Updated useEffect to pass the start time
  useEffect(() => {
    if (conversationState.status === 'active' && conversationState.conversationId) {
      playConversationAudio(conversationState.conversationId, conversationState.startTime)
    } else {
      console.log('🎵 Conversation inactive, stopping audio')
      stopCurrentAudio()
    }
  }, [conversationState.status, conversationState.conversationId, conversationState.startTime, stopCurrentAudio])

  // Handle play/pause button sync with audio
  useEffect(() => {
    if (!currentAudio) return

    if (isPlaying) {
      // Resume audio if it was paused
      if (currentAudio.paused) {
        console.log('▶️ Resuming audio (play button pressed)')
        currentAudio.play().catch(error => {
          console.log('Audio resume failed:', error)
        })
      }
    } else {
      // Pause audio if it's playing
      if (!currentAudio.paused) {
        console.log('⏸️ Pausing audio (pause button pressed)')
        currentAudio.pause()
      }
    }
  }, [isPlaying, currentAudio])

  // Handle timeline scrubbing/jumping
  useEffect(() => {
    // If audio is currently playing, sync it to the timeline
    if (currentAudio && currentPlayingConversationId && conversationState.status === 'active') {
      syncAudioToTimeline(currentAudio, conversationState.startTime)
    }
  }, [currentTime, currentAudio, currentPlayingConversationId, conversationState])

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