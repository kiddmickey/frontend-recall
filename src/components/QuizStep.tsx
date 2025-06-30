import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Star, Trophy, Clock, ArrowRight } from 'lucide-react';

interface QuizStepProps {
  memory: any;
  question: string;
  options: string[];
  correctAnswer: string;
  onAnswerSelected: (isCorrect: boolean, selectedAnswer: string) => void;
  onNext: () => void;
  currentQuizIndex: number;
  totalQuizzes: number;
  score: number;
  timeLimit?: number;
}

const QuizStep: React.FC<QuizStepProps> = ({
  memory,
  question,
  options,
  correctAnswer,
  onAnswerSelected,
  onNext,
  currentQuizIndex,
  totalQuizzes,
  score,
  timeLimit = 30
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!showResult && !isTimeUp) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimeUp(true);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showResult, isTimeUp]);

  const handleTimeUp = () => {
    setShowResult(true);
    setIsCorrect(false);
    onAnswerSelected(false, 'Time up');
  };

  const handleAnswerClick = (answer: string) => {
    if (showResult || isTimeUp) return;

    setSelectedAnswer(answer);
    const correct = answer === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswerSelected(correct, answer);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setTimeLeft(timeLimit);
    setIsTimeUp(false);
    onNext();
  };

  const getAnswerButtonClass = (option: string) => {
    if (!showResult) {
      return 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-800';
    }

    if (option === correctAnswer) {
      return 'bg-green-500 border-green-500 text-white';
    }

    if (option === selectedAnswer && option !== correctAnswer) {
      return 'bg-red-500 border-red-500 text-white';
    }

    return 'bg-gray-200 border-gray-300 text-gray-600';
  };

  const getResultIcon = (option: string) => {
    if (!showResult) return null;

    if (option === correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-white" />;
    }

    if (option === selectedAnswer && option !== correctAnswer) {
      return <XCircle className="w-5 h-5 text-white" />;
    }

    return null;
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 10) return 'text-green-600';
    if (timeLeft > 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Memory Quiz</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="text-sm">Score: {score}/{currentQuizIndex}</span>
            </div>
            <div className={`flex items-center gap-2 ${getTimeColor()}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-blue-800 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuizIndex + 1) / totalQuizzes) * 100}%` }}
          />
        </div>
        
        <div className="text-center mt-2">
          <span className="text-sm opacity-90">
            Question {currentQuizIndex + 1} of {totalQuizzes}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Memory Image */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg shadow-md">
            {memory.photo_url ? (
              <img 
                src={memory.photo_url} 
                alt="Memory" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>
          
          {/* Memory Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 space-y-1">
              {memory.date_taken && (
                <p><strong>Date:</strong> {new Date(memory.date_taken).toLocaleDateString()}</p>
              )}
              {memory.location && (
                <p><strong>Location:</strong> {memory.location}</p>
              )}
              {memory.people_involved?.length > 0 && (
                <p><strong>People:</strong> {memory.people_involved.join(', ')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quiz Panel */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {question}
            </h3>
            
            <div className="space-y-3">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(option)}
                  disabled={showResult || isTimeUp}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 flex items-center justify-between ${getAnswerButtonClass(option)} ${
                    showResult || isTimeUp ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="font-medium">{option}</span>
                  {getResultIcon(option)}
                </button>
              ))}
            </div>
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className={`p-4 rounded-lg ${
              isTimeUp ? 'bg-orange-50 border border-orange-200' :
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {isTimeUp ? (
                  <Clock className="w-6 h-6 text-orange-600" />
                ) : isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <h4 className={`font-semibold ${
                  isTimeUp ? 'text-orange-800' :
                  isCorrect ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isTimeUp ? 'Time\'s Up!' :
                   isCorrect ? 'Excellent!' : 'Not quite right'}
                </h4>
              </div>
              
              <p className={`text-sm ${
                isTimeUp ? 'text-orange-700' :
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {isTimeUp ? `The correct answer was: ${correctAnswer}` :
                 isCorrect ? 'Great job! You got it right!' : `The correct answer was: ${correctAnswer}`}
              </p>
              
              {memory.caption && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-sm text-gray-700">
                    <strong>Memory Note:</strong> {memory.caption}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {showResult && (
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {currentQuizIndex + 1 < totalQuizzes ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Complete Quiz
                  <Trophy className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizStep;