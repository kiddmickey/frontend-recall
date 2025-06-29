import React, { useState, useEffect } from 'react';
import { Video, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, FileText, Clock, Heart, AlertTriangle, MessageCircle } from 'lucide-react';
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
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    initializeConversation();
  }, [patient, selectedMemory, emotionalCheckInData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

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
      setError('Failed to initialize conversation. Please try again.');
      console.error('Conversation initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    setIsCallActive(true);
    setCallDuration(0);

    // Update session to mark as started
    if (sessionId) {
      try {
        await StorageService.updateSession(sessionId, {
          status: 'active',
          started_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error updating session start:', err);
      }
    }
  };

  const endCall = async () => {
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
    
    setIsCallActive(false);
    onEnd();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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
        <p className="text-red-600 mb-4">{error}</p>
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
            {isCallActive && (
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

      {/* Video Area */}
      <div className="aspect-video bg-gray-900 relative">
        {conversationData?.conversation_url ? (
          <iframe
            src={conversationData.conversation_url}
            className="w-full h-full"
            allow="camera; microphone; fullscreen"
            title="Tavus Conversation"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ready to start conversation</p>
            </div>
          </div>
        )}
        
        {/* Call Status Overlay */}
        {!isCallActive && conversationData?.conversation_url && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <button
              onClick={startCall}
              className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            >
              <Phone className="w-6 h-6" />
              Start Conversation
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!isCallActive}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-full transition-colors ${
              isSpeakerOn 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!isCallActive}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={endCall}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mt-3 text-sm text-gray-600">
          {isCallActive ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Call in progress</span>
            </div>
          ) : (
            'Call controls'
          )}
        </div>
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