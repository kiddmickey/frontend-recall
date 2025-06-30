import React, { useState, useEffect } from 'react';
import { Video, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, FileText, Clock, Heart, AlertTriangle, MessageCircle, ExternalLink, Monitor } from 'lucide-react';
import { tavusService } from '../services/tavusService';
import { StorageService } from '../services/storageService';

interface TavusConversationProps {
  patient: any;
  selectedMemory?: any;
  emotionalCheckInData?: any;
  onEnd: () => void;
}

const TavusConversation: React.FC<TavusConversationProps> = ({
  patient,
  selectedMemory,
  emotionalCheckInData,
  onEnd
}) => {
  const [conversationData, setConversationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConversationOpened, setIsConversationOpened] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationWindow, setConversationWindow] = useState<Window | null>(null);

  useEffect(() => {
    initializeConversation();
  }, [patient, selectedMemory, emotionalCheckInData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConversationOpened) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
        
        // Check if the conversation window is still open
        if (conversationWindow && conversationWindow.closed) {
          handleConversationEnd();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConversationOpened, conversationWindow]);

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get patient's memories from storage
      const memoryCards = await StorageService.getMemoryCardsByPatient(patient.id);
      
      let conversationPrompt: string;
      let sessionType: string;

      if (emotionalCheckInData) {
        // Generate emotional check-in specific prompt
        conversationPrompt = tavusService.generateEmotionalCheckInPrompt(
          patient,
          emotionalCheckInData,
          memoryCards
        );
        sessionType = 'emotional_checkin';
      } else {
        // Generate regular conversation prompt
        conversationPrompt = tavusService.generateConversationPrompt(
          patient,
          memoryCards,
          selectedMemory
        );
        sessionType = selectedMemory ? 'memory_focused' : 'general';
      }

      // Create conversation using Tavus API following the documentation
      const conversation = await tavusService.createConversation(
        conversationPrompt,
        patient.preferred_name
      );

      setConversationData(conversation);
      
      // Create session record - let Supabase generate the UUID
      const session = {
        patient_id: patient.id,
        memory_id: selectedMemory?.id || null,
        conversation_id: conversation.conversation_id,
        conversation_url: conversation.conversation_url,
        session_type: sessionType,
        duration_seconds: 0,
        transcription: null,
        status: 'created',
        started_at: null,
        ended_at: null,
        created_at: new Date().toISOString()
      };

      const savedSession = await StorageService.saveSession(session);
      setSessionId(savedSession.id);

    } catch (err) {
      console.error('Conversation initialization error:', err);
      
      // Parse the error message to provide more specific feedback
      let errorMessage = 'Failed to initialize conversation. Please try again.';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const errorStr = String(err.message);
        if (errorStr.includes('maximum concurrent conversations')) {
          errorMessage = 'Tavus API Error: You have reached the maximum number of concurrent conversations. Please end any existing conversations or try again later.';
        } else if (errorStr.includes('400')) {
          errorMessage = 'Tavus API Error: Invalid request. Please check your configuration and try again.';
        } else if (errorStr.includes('401') || errorStr.includes('unauthorized')) {
          errorMessage = 'Tavus API Error: Authentication failed. Please check your API credentials.';
        } else if (errorStr.includes('403') || errorStr.includes('forbidden')) {
          errorMessage = 'Tavus API Error: Access denied. Please check your API permissions.';
        } else if (errorStr.includes('429') || errorStr.includes('rate limit')) {
          errorMessage = 'Tavus API Error: Rate limit exceeded. Please wait a moment and try again.';
        } else if (errorStr.includes('500') || errorStr.includes('internal server error')) {
          errorMessage = 'Tavus API Error: Server error. Please try again later.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openConversationInNewTab = () => {
    if (conversationData?.conversation_url) {
      const newWindow = window.open(
        conversationData.conversation_url,
        '_blank',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
      
      if (newWindow) {
        setConversationWindow(newWindow);
        setIsConversationOpened(true);
        setCallDuration(0);

        // Update session to mark as started
        if (sessionId) {
          StorageService.updateSession(sessionId, {
            status: 'active',
            started_at: new Date().toISOString()
          }).catch(err => {
            console.error('Error updating session start:', err);
          });
        }

        // Focus on the new window
        newWindow.focus();
      } else {
        alert('Please allow pop-ups for this site to open the conversation in a new tab.');
      }
    }
  };

  const handleConversationEnd = async () => {
    const endTime = new Date().toISOString();
    
    // End the Tavus conversation
    if (conversationData?.conversation_id) {
      try {
        await tavusService.endConversation(conversationData.conversation_id);
        console.log('Tavus conversation ended successfully');
      } catch (err) {
        console.error('Error ending conversation:', err);
      }
    }
    
    // Update session with end time and duration
    if (sessionId) {
      try {
        await StorageService.updateSession(sessionId, {
          status: 'completed',
          ended_at: endTime,
          duration_seconds: callDuration
        });
      } catch (err) {
        console.error('Error updating session end:', err);
      }
    }
    
    // Close the conversation window if it's still open
    if (conversationWindow && !conversationWindow.closed) {
      conversationWindow.close();
    }
    
    setIsConversationOpened(false);
    setConversationWindow(null);
    onEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeDisplay = () => {
    if (emotionalCheckInData) {
      return {
        title: 'Emotional Check-In Session',
        subtitle: `Focus: ${emotionalCheckInData.focus_areas.join(', ')}`,
        icon: <Heart className="w-5 h-5" />,
        color: 'from-purple-600 to-purple-700'
      };
    } else if (selectedMemory) {
      return {
        title: 'Memory-Focused Conversation',
        subtitle: `Discussing memory from ${new Date(selectedMemory.date_taken).toLocaleDateString()}`,
        icon: <FileText className="w-5 h-5" />,
        color: 'from-blue-600 to-blue-700'
      };
    } else {
      return {
        title: 'General Conversation',
        subtitle: 'Open conversation with memory sharing',
        icon: <MessageCircle className="w-5 h-5" />,
        color: 'from-green-600 to-green-700'
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Preparing conversation with {patient.preferred_name}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="text-red-600 mb-4">
          <Video className="w-12 h-12" />
        </div>
        <p className="text-red-600 mb-4 text-center max-w-md">{error}</p>
        <button
          onClick={initializeConversation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const sessionDisplay = getSessionTypeDisplay();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${sessionDisplay.color} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sessionDisplay.icon}
            <div>
              <h3 className="text-lg font-semibold">{sessionDisplay.title}</h3>
              <p className="text-blue-100 text-sm">
                {sessionDisplay.subtitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            {isConversationOpened && (
              <div>
                <div className="text-sm opacity-90">Call Duration</div>
                <div className="text-lg font-mono">{formatDuration(callDuration)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emotional Check-In Context */}
      {emotionalCheckInData && (
        <div className="p-4 bg-purple-50 border-b">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              emotionalCheckInData.urgency_level === 'watch_closely' ? 'bg-orange-100' :
              emotionalCheckInData.urgency_level === 'gentle' ? 'bg-blue-100' :
              'bg-green-100'
            }`}>
              {emotionalCheckInData.urgency_level === 'watch_closely' ? 
                <AlertTriangle className="w-4 h-4 text-orange-600" /> :
                <Heart className="w-4 h-4 text-purple-600" />
              }
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Check-In Approach: {emotionalCheckInData.urgency_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-sm text-purple-800 mb-2">
                Focus Areas: {emotionalCheckInData.focus_areas.join(', ')}
              </p>
              {emotionalCheckInData.custom_message && (
                <div className="bg-white p-3 rounded-md border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>Caregiver Note:</strong> {emotionalCheckInData.custom_message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-8">
        {!isConversationOpened ? (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Monitor className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Conversation</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The conversation will open in a new tab for the best experience. Make sure pop-ups are enabled for this site.
            </p>
            
            <button
              onClick={openConversationInNewTab}
              className="flex items-center gap-3 mx-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg text-lg font-medium"
            >
              <ExternalLink className="w-6 h-6" />
              Open Conversation in New Tab
            </button>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Video className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-1">💡 Tips for the best experience:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Allow camera and microphone access when prompted</li>
                    <li>• Use headphones for better audio quality</li>
                    <li>• Ensure good lighting for video</li>
                    <li>• Keep this tab open to track conversation time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Conversation Active</h3>
            <p className="text-gray-600 mb-6">
              The conversation is running in a separate tab. You can return to this page anytime.
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatDuration(callDuration)}</div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Live</span>
                </div>
                <div className="text-sm text-gray-500">Status</div>
              </div>
            </div>
            
            <button
              onClick={handleConversationEnd}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              End Conversation
            </button>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The conversation will automatically end when the tab is closed, or you can use the button above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Memory Context */}
      {selectedMemory && (
        <div className="p-4 bg-blue-50 border-t">
          <h4 className="font-medium text-blue-900 mb-2">Today's Memory Focus</h4>
          <div className="flex gap-3">
            {selectedMemory.photo_url && (
              <img 
                src={selectedMemory.photo_url} 
                alt="Memory" 
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                {new Date(selectedMemory.date_taken).toLocaleDateString()}
                {selectedMemory.location && ` • ${selectedMemory.location}`}
              </p>
              {selectedMemory.caption && (
                <p className="text-sm text-blue-700 mt-1">{selectedMemory.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TavusConversation;