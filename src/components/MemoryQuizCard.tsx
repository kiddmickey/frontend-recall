import React from 'react';
import { Check, X, Clock, Trophy } from 'lucide-react';
import { QuizQuestion } from '../services/quizService';

interface MemoryQuizCardProps {
  question: QuizQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  onAnswerSelect: (answerIndex: number) => void;
  selectedAnswer?: number;
  showResult?: boolean;
  isCorrect?: boolean;
}

const MemoryQuizCard: React.FC<MemoryQuizCardProps> = ({
  question,
  currentQuestionIndex,
  totalQuestions,
  score,
  onAnswerSelect,
  selectedAnswer,
  showResult = false,
  isCorrect = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      {/* Header with Progress and Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
          <Trophy className="w-4 h-4" />
          <span>Score: {score}/{currentQuestionIndex + (showResult ? 1 : 0)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + (showResult ? 1 : 0)) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      {/* Memory Image */}
      <div className="mb-4">
        <img 
          src={question.imageUrl} 
          alt="Memory" 
          className="w-full h-48 object-cover rounded-lg shadow-md"
        />
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {question.question}
      </h3>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          let buttonClass = "w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ";
          
          if (showResult) {
            if (index === question.correctAnswer) {
              buttonClass += "border-green-500 bg-green-50 text-green-800";
            } else if (index === selectedAnswer && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-800";
            } else {
              buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
            }
          } else if (selectedAnswer === index) {
            buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
          } else {
            buttonClass += "border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700";
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && onAnswerSelect(index)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option}</span>
                {showResult && (
                  <div className="flex-shrink-0 ml-2">
                    {index === question.correctAnswer ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : index === selectedAnswer && !isCorrect ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : null}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Message */}
      {showResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
        }`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-orange-600" />
            )}
            <span className={`font-medium ${
              isCorrect ? 'text-green-800' : 'text-orange-800'
            }`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </span>
          </div>
          {!isCorrect && (
            <p className="text-sm text-orange-700 mt-1">
              The correct answer was: {question.options[question.correctAnswer]}
            </p>
          )}
        </div>
      )}

      {/* Memory Context */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Memory Details</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Date: {new Date(question.memoryContext.date).toLocaleDateString()}</div>
          {question.memoryContext.location && (
            <div>Location: {question.memoryContext.location}</div>
          )}
          {question.memoryContext.peopleInvolved?.length > 0 && (
            <div>People: {question.memoryContext.peopleInvolved.join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryQuizCard;