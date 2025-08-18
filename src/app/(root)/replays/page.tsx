
"use client"

import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, User, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchSessionsWithConversations, SessionWithConversations } from '@/lib/actions/session-conversation-actions';

const SessionReplayDashboard = () => {
  const [sessions, setSessions] = useState<SessionWithConversations[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithConversations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [messageCountFilter, setMessageCountFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<SessionWithConversations | null>(null);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

  useEffect(() => {
  if (sessions.length > 0) {
    console.group('🎬 SESSION DASHBOARD DATA LOADED');
    console.log('📊 Total sessions fetched:', sessions.length);
    console.log('🗂️ All sessions data:', sessions);
    
    // Log some summary stats
    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const avgMessagesPerSession = totalMessages / sessions.length;
    
    console.log('📈 Summary stats:', {
      totalSessions: sessions.length,
      totalMessages,
      avgMessagesPerSession: avgMessagesPerSession.toFixed(1),
      sessionsWithConversations: sessions.filter(s => s.messages.length > 0).length
    });
    
    // Log details for each session
    sessions.forEach((session, index) => {
      console.log(`📝 Session ${index + 1}:`, {
        id: session.id,
        lesson_id: session.lesson_id,
        status: session.status,
        messageCount: session.messages.length,
        started_at: session.started_at,
        duration: session.completed_at ? 
          new Date(session.completed_at).getTime() - new Date(session.started_at).getTime() : 
          'Ongoing'
      });
    });
    
    console.groupEnd();
  }
}, [sessions]);

  // Load sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const result = await fetchSessionsWithConversations();
        if (result.success && result.data) {
          setSessions(result.data);
          setFilteredSessions(result.data);
        } else {
          console.error('Failed to load sessions:', result.error);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Filter sessions based on current filters
  useEffect(() => {
    let filtered = sessions;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(session => 
        session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.profile_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Message count filter
    if (messageCountFilter !== 'all') {
      const messageCount = (session: SessionWithConversations) => session.messages.length;
      filtered = filtered.filter((session: SessionWithConversations) => {
        const count = messageCount(session);
        switch (messageCountFilter) {
          case 'none': return count === 0;
          case 'low': return count > 0 && count <= 5;
          case 'medium': return count > 5 && count <= 20;
          case 'high': return count > 20;
          default: return true;
        }
      });
    }

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, statusFilter, messageCountFilter]);

  // Handle session click
  const handleSessionClick = (session: SessionWithConversations) => {
    setSelectedSession(session);
    setIsConversationModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsConversationModalOpen(false);
    setSelectedSession(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get session duration
  const getSessionDuration = (session: SessionWithConversations) => {
    if (!session.completed_at) return 'Ongoing';
    const start = new Date(session.started_at);
    const end = new Date(session.completed_at);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get conversation summary
  const getConversationSummary = (messages: any[]) => {
    const studentMessages = messages.filter(m => m.role === 'user').length;
    const sophiaMessages = messages.filter(m => m.role === 'assistant').length;
    return { studentMessages, sophiaMessages, total: messages.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-20">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Replay Library</h1>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Describe a session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Session Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const conversationSummary = getConversationSummary(session.messages);
            const hasConversation = conversationSummary.total > 0;
            
            return (
              <Card 
                key={session.id} 
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSessionClick(session)}
              >
                <CardContent className="p-6">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {getSessionDuration(session)}
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Session ID</p>
                      <p className="text-xs text-gray-600 font-mono">{session.id.slice(-8)}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-mono text-xs">{session.profile_id.slice(-8)}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span>Started: {formatDate(session.started_at)}</span>
                    </div>
                  </div>

                  {/* Conversation Stats */}
                  <div className="border-t pt-4">
                    {hasConversation ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-blue-600">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>{conversationSummary.total} messages</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                        <div className="text-xs text-gray-500">
                          Student: {conversationSummary.studentMessages} • Sophia: {conversationSummary.sophiaMessages}
                        </div>
                        {/* Preview of last message */}
                        {session.messages.length > 0 && (
                          <div className="text-xs text-gray-400 italic truncate">
                            "{session.messages[session.messages.length - 1].content.substring(0, 60)}..."
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span>No conversation</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}

        {/* Conversation Modal */}
        <Dialog open={isConversationModalOpen} onOpenChange={setIsConversationModalOpen}>
          <DialogContent className="w-[800px] max-h-[200vh] ">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Session Conversation</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedSession && (
              <div className="space-y-4">
                {/* Session Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Session ID:</span>
                      <span className="ml-2 font-mono">{selectedSession.id}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className="ml-2" variant={selectedSession.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedSession.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Started:</span>
                      <span className="ml-2">{formatDate(selectedSession.started_at)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{getSessionDuration(selectedSession)}</span>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-medium">
                      Conversation ({selectedSession.messages.length} messages)
                    </h3>
                                    {/* Action Buttons */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      window.open(`/replay/${selectedSession.lesson_id}/session/${selectedSession.id}`, '_blank');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 -mt-6 mr-1"
                  >
                    View Full Replay
                  </Button>
                </div>
                  </div>
                  
                  <ScrollArea className="h-96 p-4">
                    {selectedSession.messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No conversation in this session</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedSession.messages.map((message: any, index: number) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="text-xs opacity-75 mb-1">
                                {message.role === 'user' ? 'Student' : 'Sophia'} • {formatDate(message.created_at)}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SessionReplayDashboard;