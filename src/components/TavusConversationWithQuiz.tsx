import React, { useState, useEffect } from 'react';
import { Video, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, FileText, Clock, Heart, AlertTriangle, MessageCircle, ExternalLink, GamepadIcon, Play } from 'lucide-react';
import { tavusService } from '../services/tavusService';
import { StorageService } from '../services/storageService';
import { QuizService, QuizQuestion } from '../services/quizService';
import QuizStep from './QuizStep';
import QuizResults from './QuizResults';

interface TavusConversationWithQuizProps {
  patient: any;
  selectedMemory?: any;
  emotionalCheckInData?: any;
  onEnd: () => void;
}

type ConversationMode = 'conversation' | 'quiz' | 'results';

const TavusConversationWithQuiz: React.FC<TavusConversationWithQuizProps> = ({
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
  const [conversationOpened, setConversationOpened] = useState(false);
  
  // Quiz-specific state
  const [mode, setMode] = useState<ConversationMode>('conversation');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);

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
      
      // Generate quiz questions from memories
      const questions = QuizService.generateQuestionsFromMemories(memoryCards);
      setQuizQuestions(questions);
      
      let conversationPrompt: string;
      let sessionType: string;

      if (emotionalCheckInData) {
        conversationPrompt = tavusService.generateEmotionalCheckInPrompt(
          patient,
          emotionalCheckInData,
          memoryCards
        );
        sessionType = 'emotional_checkin';
      } else {
        conversationPrompt = tavusService.generateConversationPrompt(
          patient,
          memoryCards,
          selectedMemory
        );
        sessionType = selectedMemory ? 'memory_focused' : 'general';
      }

      // Create conversation using Tavus API
      const conversation = await tavusService.createConversation(
        conversationPrompt,
        patient.preferred_name
      );

      setConversationData(conversation);
      
      // Create session record
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
      window.open(conversationData.conversation_url, '_blank');
      setConversationOpened(true);
      setIsCallActive(true);
      setCallDuration(0);

      if (sessionId) {
        StorageService.updateSession(sessionId, {
          status: 'active',
          started_at: new Date().toISOString()
        }).catch(err => {
          console.error('Error updating session start:', err);
        });
      }
    }
  };

  const startQuiz = () => {
    if (quizQuestions.length === 0) {
      alert('No quiz questions available. Please add some memories first.');
      return;
    }
    
    setMode('quiz');
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setCorrectAnswers(0);
    setQuizStartTime(Date.now());
    setQuizAnswers([]);
  };

  const handleQuizAnswer = (isCorrect: boolean, selectedAnswer: string) => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const answerTime = Date.now();
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setQuizScore(prev => prev + 10); // 10 points per correct answer
    }

    // Record the answer
    setQuizAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeSpent: Math.round((answerTime - quizStartTime) / 1000)
    }]);
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      // Quiz completed
      const totalTime = Math.round((Date.now() - quizStartTime) / 1000);
      const finalScore = QuizService.calculateScore(correctAnswers, quizQuestions.length, totalTime);
      setQuizScore(finalScore);
      
      // Save quiz results
      QuizService.saveQuizResults(patient.id, {
        score: finalScore,
        totalQuestions: quizQuestions.length,
        correctAnswers,
        timeSpent: totalTime,
        questions: quizQuestions,
        answers: quizAnswers
      }).catch(err => {
        console.error('Error saving quiz results:', err);
      });
      
      setMode('results');
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setCorrectAnswers(0);
    setQuizStartTime(Date.now());
    setQuizAnswers([]);
    setMode('quiz');
  };

  const returnToConversation = () => {
    setMode('conversation');
  };

  const endCall = async () => {
    const endTime = new Date().toISOString();
    
    if (conversationData?.conversation_id) {
      try {
        await tavusService.endConversation(conversationData.conversation_id);
        console.log('Tavus conversation ended successfully');
      } catch (err) {
        console.error('Error ending conversation:', err);
      }
    }
    
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
    setConversationOpened(false);
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

  // Quiz Mode
  if (mode === 'quiz' && quizQuestions.length > 0) {
    return (
      <QuizStep
        memory={quizQuestions[currentQuizIndex].memory}
        question={quizQuestions[currentQuizIndex].question}
        options={quizQuestions[currentQuizIndex].options}
        correctAnswer={quizQuestions[currentQuizIndex].correctAnswer}
        onAnswerSelected={handleQuizAnswer}
        onNext={handleNextQuiz}
        currentQuizIndex={currentQuizIndex}
        totalQuizzes={quizQuestions.length}
        score={quizScore}
      />
    );
  }

  // Results Mode
  if (mode === 'results') {
    return (
      <QuizResults
        score={quizScore}
        totalQuestions={quizQuestions.length}
        timeSpent={Math.round((Date.now() - quizStartTime) / 1000)}
        correctAnswers={correctAnswers}
        onRestart={restartQuiz}
        onContinueConversation={returnToConversation}
        patientName={patient.preferred_name}
      />
    );
  }

  const sessionDisplay = getSessionTypeDisplay();

  // Conversation Mode
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
          <div className="flex items-center gap-4">
            {quizQuestions.length > 0 && (
              <button
                onClick={startQuiz}
                className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
              >
                <GamepadIcon className="w-4 h-4" />
                Memory Quiz
              </button>
            )}
            {isCallActive && (
              <div className="text-right">
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

      {/* Conversation Area */}
      <div className="aspect-video bg-gray-900 relative">
        {conversationData?.conversation_url ? (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              {!conversationOpened ? (
                <>
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-4">Ready to start conversation</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <button
                      onClick={openConversationInNewTab}
                      className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="w-6 h-6" />
                      Open Conversation
                    </button>
                    {quizQuestions.length > 0 && (
                      <button
                        onClick={startQuiz}
                        className="flex items-center gap-3 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                      >
                        <Play className="w-6 h-6" />
                        Start Memory Quiz
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <ExternalLink className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Conversation is active in a new tab</p>
                  <p className="text-sm opacity-75">
                    Switch to the conversation tab to interact with {patient.preferred_name}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Active conversation</span>
                  </div>
                  {quizQuestions.length > 0 && (
                    <button
                      onClick={startQuiz}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
                    >
                      <GamepadIcon className="w-4 h-4" />
                      Take Memory Quiz
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Preparing conversation...</p>
            </div>
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
            title={isMuted ? 'Unmute' : 'Mute'}
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
            title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={endCall}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="End conversation"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mt-3 text-sm text-gray-600">
          {isCallActive ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Conversation active in new tab</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <span>Ready to start conversation</span>
              {quizQuestions.length > 0 && (
                <span className="text-purple-600">• {quizQuestions.length} quiz questions available</span>
              )}
            </div>
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

export default TavusConversationWithQuiz;