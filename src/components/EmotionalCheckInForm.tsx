import React, { useState } from 'react';
import { Heart, ArrowRight, ArrowLeft, Clock, AlertTriangle, Smile } from 'lucide-react';

interface EmotionalCheckInFormProps {
  patientId: string;
  onComplete: (checkInData: any) => void;
  onBack: () => void;
}

const EmotionalCheckInForm: React.FC<EmotionalCheckInFormProps> = ({
  patientId,
  onComplete,
  onBack
}) => {
  const [checkInFocus, setCheckInFocus] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'gentle' | 'watch_closely'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const focusOptions = [
    { id: 'mood', label: 'Mood & Emotional State', description: 'How they\'re feeling today' },
    { id: 'sleep', label: 'Sleep Quality', description: 'How well they slept last night' },
    { id: 'energy', label: 'Energy Level', description: 'Their physical and mental energy' },
    { id: 'appetite', label: 'Appetite & Eating', description: 'Interest in food and meals' },
    { id: 'social', label: 'Social Interaction', description: 'Connections with family and friends' },
    { id: 'activities', label: 'Daily Activities', description: 'Engagement in hobbies and routines' },
    { id: 'comfort', label: 'Physical Comfort', description: 'Any pain or discomfort' },
    { id: 'memory', label: 'Memory & Cognition', description: 'Mental clarity and recall' }
  ];

  const urgencyOptions = [
    {
      id: 'normal' as const,
      label: 'Normal',
      description: 'Regular check-in conversation',
      icon: <Smile className="w-5 h-5" />,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      id: 'gentle' as const,
      label: 'Gentle',
      description: 'Extra patience and sensitivity needed',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'watch_closely' as const,
      label: 'Watch Closely',
      description: 'Careful monitoring for concerning signs',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    }
  ];

  const handleFocusToggle = (focusId: string) => {
    setCheckInFocus(prev => 
      prev.includes(focusId) 
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (checkInFocus.length === 0) {
      alert('Please select at least one check-in focus area');
      return;
    }

    setIsSubmitting(true);

    try {
      const checkInData = {
        type: 'emotional_checkin',
        focus_areas: checkInFocus,
        custom_message: customMessage.trim(),
        urgency_level: urgencyLevel,
        created_at: new Date().toISOString()
      };

      onComplete(checkInData);
    } catch (error) {
      console.error('Error preparing emotional check-in:', error);
      alert('Failed to prepare check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Emotional Check-In</h2>
        <p className="text-gray-600 text-lg">
          Set up a supportive conversation to understand how they're feeling today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Check-In Focus Areas */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Check-In Focus <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-600 mb-6">
            Select what you'd like the AI to gently explore during the conversation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {focusOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  checkInFocus.includes(option.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                }`}
                onClick={() => handleFocusToggle(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                    checkInFocus.includes(option.id)
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {checkInFocus.includes(option.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{option.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Selected: {checkInFocus.length} focus area{checkInFocus.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Custom Message */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Custom Message to AI (Optional)
          </label>
          <p className="text-gray-600 mb-4">
            Share any specific concerns or observations to help guide the conversation
          </p>
          
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="e.g., 'She seemed a bit down this morning' or 'Ask her if she enjoyed her walk yesterday'"
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-lg"
            maxLength={500}
          />
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              This helps the AI understand context and approach the conversation appropriately
            </p>
            <span className="text-sm text-gray-400">
              {customMessage.length}/500
            </span>
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Conversation Approach
          </label>
          <p className="text-gray-600 mb-6">
            Choose the tone and pacing that best fits their current state
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgencyOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  urgencyLevel === option.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setUrgencyLevel(option.id)}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${option.color}`}>
                    {option.icon}
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{option.label}</h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting || checkInFocus.length === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Preparing Session...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Start Emotional Check-In
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">💜 What to Expect</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• The AI will use a warm, caring tone throughout the conversation</li>
              <li>• Questions will be gentle and open-ended to encourage sharing</li>
              <li>• The conversation will be automatically transcribed for your review</li>
              <li>• You can end the session at any time if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionalCheckInForm;