import React from 'react';
import { Trophy, Star, Clock, Target, ArrowRight, RotateCcw } from 'lucide-react';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  correctAnswers: number;
  onRestart: () => void;
  onContinueConversation: () => void;
  patientName: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  timeSpent,
  correctAnswers,
  onRestart,
  onContinueConversation,
  patientName
}) => {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Outstanding memory recall!";
    if (percentage >= 75) return "Excellent work!";
    if (percentage >= 60) return "Good job remembering!";
    if (percentage >= 40) return "Nice effort!";
    return "Every memory counts!";
  };

  const getPerformanceColor = () => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-blue-600";
    return "text-purple-600";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-lg opacity-90">
          Great job, {patientName}! You've completed the memory quiz.
        </p>
      </div>

      {/* Results */}
      <div className="p-6">
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-2 ${getPerformanceColor()}`}>
            {percentage}%
          </div>
          <p className={`text-xl font-semibold mb-4 ${getPerformanceColor()}`}>
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
            <div className="text-sm text-green-700">Correct</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</div>
            <div className="text-sm text-purple-700">Time</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{score}</div>
            <div className="text-sm text-yellow-700">Score</div>
          </div>
        </div>

        {/* Encouragement Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">🎉 Wonderful Memory Work!</h3>
          <p className="text-gray-700 text-sm">
            You've done a fantastic job recalling these precious memories. Each question you answered 
            helps strengthen those important connections to your past. Your memories are treasures, 
            and it's beautiful to see them shine through!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={onContinueConversation}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue Conversation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;