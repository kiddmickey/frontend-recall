import React, { useState } from 'react';
import { Plus, User, MessageCircle, Calendar, BarChart3, FileText, Clock, TrendingUp, Heart, Home, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import PatientProfileForm from './PatientProfileForm';
import MemoryForm from './MemoryForm';
import MemoryCardDisplay from './MemoryCardDisplay';
import TavusConversation from './TavusConversation';
import QuickMemoryForm from './QuickMemoryForm';
import EmotionalCheckInForm from './EmotionalCheckInForm';
import { StorageService } from '../services/storageService';

type ViewMode = 'dashboard' | 'create-profile' | 'edit-profile' | 'add-memory' | 'quick-memory' | 'conversation' | 'transcripts' | 'emotional-checkin';

const Dashboard: React.FC = () => {
  const { 
    currentPatient, 
    setCurrentPatient, 
    memoryCards, 
    patientProfiles, 
    sessions,
    transcripts,
    refreshData,
    isLoading,
    error
  } = useAppContext();
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [quickMemoryAdded, setQuickMemoryAdded] = useState<any>(null);
  const [emotionalCheckInData, setEmotionalCheckInData] = useState<any>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(supabaseUrl && supabaseAnonKey && 
             supabaseUrl !== 'https://your-project-id.supabase.co' && 
             supabaseAnonKey !== 'your-anon-key-here');
  };

  const handlePatientSelect = (patient: any) => {
    setCurrentPatient(patient);
    setViewMode('dashboard');
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setViewMode('create-profile');
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile);
    setViewMode('edit-profile');
  };

  const handleProfileComplete = async (profile: any) => {
    setCurrentPatient(profile);
    setViewMode('dashboard');
    await refreshData();
  };

  const handleMemoryComplete = async () => {
    setViewMode('dashboard');
    await refreshData();
  };

  const handleMemoryBack = () => {
    setViewMode('dashboard');
  };

  const handleStartConversation = (memory?: any) => {
    setSelectedMemory(memory);
    // For general conversation, first show quick memory form
    if (!memory) {
      setViewMode('quick-memory');
    } else {
      setViewMode('conversation');
    }
  };

  const handleStartEmotionalCheckIn = () => {
    setViewMode('emotional-checkin');
  };

  const handleEmotionalCheckInComplete = (checkInData: any) => {
    setEmotionalCheckInData(checkInData);
    setSelectedMemory(null); // No specific memory for emotional check-in
    setViewMode('conversation');
  };

  const handleEmotionalCheckInBack = () => {
    setViewMode('dashboard');
  };

  const handleQuickMemoryComplete = async (memory?: any) => {
    setQuickMemoryAdded(memory);
    setSelectedMemory(memory);
    setViewMode('conversation');
    if (memory) {
      await refreshData(); // Refresh to show the new memory in the list
    }
  };

  const handleQuickMemorySkip = () => {
    setQuickMemoryAdded(null);
    setSelectedMemory(null);
    setViewMode('conversation');
  };

  const handleQuickMemoryBack = () => {
    setViewMode('dashboard');
  };

  const handleConversationEnd = async () => {
    setSelectedMemory(null);
    setQuickMemoryAdded(null);
    setEmotionalCheckInData(null);
    setViewMode('dashboard');
    await refreshData(); // Refresh to update session history
  };

  const handleDeleteMemory = async (memory: any) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      try {
        await StorageService.deleteMemoryCard(memory.id);
        await refreshData();
      } catch (error) {
        console.error('Error deleting memory:', error);
        alert('Failed to delete memory. Please try again.');
      }
    }
  };

  const handleViewTranscripts = () => {
    setViewMode('transcripts');
  };

  const handleBackToHome = () => {
    setCurrentPatient(null);
    setViewMode('dashboard');
  };

  // Show Supabase configuration warning if not configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-orange-50 rounded-lg border border-orange-200">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-orange-800 mb-2">Supabase Configuration Required</h2>
        <p className="text-orange-700 text-center mb-6 max-w-2xl">
          To use this application, you need to connect it to a Supabase database. Please follow these steps:
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl w-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              <strong>Create a Supabase project:</strong>
              <br />
              <span className="text-sm">Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</span>
            </li>
            <li>
              <strong>Get your project credentials:</strong>
              <br />
              <span className="text-sm">In your Supabase dashboard, go to Settings → API to find your Project URL and anon/public key</span>
            </li>
            <li>
              <strong>Update the .env file:</strong>
              <br />
              <span className="text-sm">Replace the placeholder values in the .env file with your actual Supabase credentials</span>
            </li>
            <li>
              <strong>Set up the database schema:</strong>
              <br />
              <span className="text-sm">Run the migration file in your Supabase SQL editor to create the required tables</span>
            </li>
          </ol>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Current .env file should contain:</h4>
            <pre className="text-sm text-gray-600 bg-white p-3 rounded border">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Refresh After Configuration
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading && patientProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 ml-4">Loading...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Profile Selection View
  if (!currentPatient && viewMode === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Family Memories</h2>
          <p className="text-gray-600 mb-6">
            Create a patient profile to begin sharing memories and conversations
          </p>
          <button
            onClick={handleCreateProfile}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Patient Profile
          </button>
        </div>

        {patientProfiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handlePatientSelect(profile)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{profile.preferred_name}</h4>
                      <p className="text-sm text-gray-600">
                        {Object.keys(profile.family_relationships || {}).length} family members
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Profile created</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfile(profile);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Form Views
  if (viewMode === 'create-profile' || viewMode === 'edit-profile') {
    return (
      <div className="space-y-4">
        {/* Back to Home Button */}
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
        
        <PatientProfileForm
          onComplete={handleProfileComplete}
          existingProfile={editingProfile}
        />
      </div>
    );
  }

  if (viewMode === 'add-memory') {
    return (
      <MemoryForm 
        patientId={currentPatient?.id}
        onComplete={handleMemoryComplete}
        onBack={handleMemoryBack}
      />
    );
  }

  if (viewMode === 'quick-memory') {
    return (
      <QuickMemoryForm
        patientId={currentPatient?.id}
        onComplete={handleQuickMemoryComplete}
        onSkip={handleQuickMemorySkip}
        onBack={handleQuickMemoryBack}
      />
    );
  }

  if (viewMode === 'emotional-checkin') {
    return (
      <EmotionalCheckInForm
        patientId={currentPatient?.id}
        onComplete={handleEmotionalCheckInComplete}
        onBack={handleEmotionalCheckInBack}
      />
    );
  }

  if (viewMode === 'conversation') {
    return (
      <TavusConversation
        patient={currentPatient}
        selectedMemory={selectedMemory}
        emotionalCheckInData={emotionalCheckInData}
        onEnd={handleConversationEnd}
      />
    );
  }

  // Transcripts View
  if (viewMode === 'transcripts') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Conversation Transcripts</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>

        {transcripts.length > 0 ? (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Conversation from {new Date(transcript.created_at).toLocaleDateString()}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(transcript.duration_seconds / 60)}m {transcript.duration_seconds % 60}s
                      </span>
                      <span>{transcript.word_count} words</span>
                      {transcript.key_topics?.length > 0 && (
                        <span>{transcript.key_topics.length} topics</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {transcript.sentiment_analysis?.overall_sentiment && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transcript.sentiment_analysis.overall_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        transcript.sentiment_analysis.overall_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transcript.sentiment_analysis.overall_sentiment}
                      </span>
                    )}
                  </div>
                </div>

                {transcript.key_topics?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Topics Discussed:</h4>
                    <div className="flex flex-wrap gap-2">
                      {transcript.key_topics.map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {transcript.memory_references?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Memory References:</h4>
                    <div className="text-sm text-gray-600">
                      {transcript.memory_references.slice(0, 3).join(', ')}
                      {transcript.memory_references.length > 3 && '...'}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      View Full Transcript
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {transcript.full_transcript || 'Transcript not available'}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">No transcripts yet</h4>
            <p className="text-gray-500 mb-4">Transcripts will appear here after conversations are completed</p>
            <button
              onClick={() => setViewMode('dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start a Conversation
            </button>
          </div>
        )}
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentPatient?.preferred_name}</h2>
              <p className="text-gray-600">
                {memoryCards.length} memories • {sessions.length} conversations • {transcripts.length} transcripts
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => setViewMode('add-memory')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Memory
            </button>
            <button
              onClick={() => handleStartConversation()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Start Conversation
            </button>
            {transcripts.length > 0 && (
              <button
                onClick={handleViewTranscripts}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Transcripts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleStartConversation()}
          className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-left"
        >
          <MessageCircle className="w-8 h-8 mb-2" />
          <h3 className="font-semibold">Memory Recall</h3>
          <p className="text-sm opacity-90">Guide AI to help remember past events</p>
        </button>
        
        <button
          onClick={handleStartEmotionalCheckIn}
          className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-left"
        >
          <Heart className="w-8 h-8 mb-2" />
          <h3 className="font-semibold">Emotional Check-In</h3>
          <p className="text-sm opacity-90">Supportive conversation about feelings</p>
        </button>
        
        <button
          onClick={() => handleEditProfile(currentPatient)}
          className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-left"
        >
          <User className="w-8 h-8 mb-2" />
          <h3 className="font-semibold">Edit Profile</h3>
          <p className="text-sm opacity-90">Update patient information</p>
        </button>
      </div>

      {/* Memory Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Memory Collection</h3>
          <span className="text-sm text-gray-600">{memoryCards.length} memories</span>
        </div>
        
        {memoryCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memoryCards.map((memory) => (
              <MemoryCardDisplay
                key={memory.id}
                memory={memory}
                onSelect={(memory) => handleStartConversation(memory)}
                onDelete={handleDeleteMemory}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">No memories yet</h4>
            <p className="text-gray-500 mb-4">Start by adding your first memory</p>
            <button
              onClick={() => setViewMode('add-memory')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Memory
            </button>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Conversations</h3>
            {transcripts.length > 0 && (
              <button
                onClick={handleViewTranscripts}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View All Transcripts →
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md">
            {sessions.slice(0, 5).map((session, index) => (
              <div key={session.id} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {session.session_type === 'memory_focused' ? 'Memory-focused conversation' : 
                       session.session_type === 'emotional_checkin' ? 'Emotional check-in' : 
                       'General conversation'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.created_at).toLocaleDateString()} at{' '}
                      {new Date(session.created_at).toLocaleTimeString()}
                      {session.duration_seconds > 0 && ` • ${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`}
                    </p>
                    {session.transcript_summary && (
                      <p className="text-xs text-blue-600 mt-1">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {session.transcript_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;