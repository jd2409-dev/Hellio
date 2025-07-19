import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Note: Using a simple div-based progress bar since Progress component might not be available
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Trophy, Star, Clock, Target } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question?: string;
  assertion?: string;
  reason?: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
}

interface InteractiveQuizProps {
  quiz: {
    id: number;
    title: string;
    questions: QuizQuestion[];
    questionType: string;
  };
  onClose: () => void;
  onComplete: (results: any) => void;
}

export default function InteractiveQuiz({ quiz, onClose, onComplete }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [timeStarted] = useState(Date.now());
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const response = await apiRequest('POST', '/api/quizzes/submit', {
        ...quizData,
        quizId: quiz // Pass the entire quiz object for textbook quizzes
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResults(true);
      onComplete(data);
      // Invalidate user stats to refresh XP
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit quiz',
        variant: 'destructive',
      });
    },
  });

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (answer: string) => {
    console.log('Answer selected:', answer, 'for question', currentQuestionIndex);
    setUserAnswers(prev => {
      const newAnswers = {
        ...prev,
        [currentQuestionIndex]: answer
      };
      console.log('Updated userAnswers:', newAnswers);
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const timeSpent = Math.round((Date.now() - timeStarted) / 1000);
    const quizResults = {
      answers: userAnswers,
      timeSpent,
      questionType: quiz.questionType,
    };

    submitQuizMutation.mutate(quizResults);
  };

  const getAnswerOptions = () => {
    if (quiz.questionType === 'assertion-reason') {
      return [
        'Both assertion and reason are correct and reason is the correct explanation for assertion',
        'Both assertion and reason are correct but reason is not the correct explanation for assertion',
        'Assertion is correct but reason is wrong',
        'Assertion is wrong but reason is correct',
        'Both assertion and reason are wrong'
      ];
    }
    return currentQuestion.options || [];
  };

  const renderQuestion = () => {
    if (quiz.questionType === 'assertion-reason') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold text-blue-300 mb-2">Assertion:</h4>
            <p className="text-white">{currentQuestion.assertion}</p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
            <h4 className="font-semibold text-green-300 mb-2">Reason:</h4>
            <p className="text-white">{currentQuestion.reason}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/50 p-4 rounded-lg">
        <h4 className="text-white text-lg font-medium">{currentQuestion.question}</h4>
      </div>
    );
  };

  if (showResults && results) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-black border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-nexus-gold">
              <Trophy className="w-6 h-6 mr-2" />
              Quiz Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-emerald-500/20 border-emerald-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-300">{results.score}%</div>
                  <p className="text-emerald-200">Score</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/20 border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">+{results.xpGained}</div>
                  <p className="text-blue-200">XP Gained</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white">Results Summary:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-green-500/20 p-2 rounded text-center">
                  <div className="font-bold text-green-300">{results.correct}</div>
                  <div className="text-green-200">Correct</div>
                </div>
                <div className="bg-red-500/20 p-2 rounded text-center">
                  <div className="font-bold text-red-300">{results.incorrect}</div>
                  <div className="text-red-200">Incorrect</div>
                </div>
                <div className="bg-yellow-500/20 p-2 rounded text-center">
                  <div className="font-bold text-yellow-300">{results.coinsGained || 0}</div>
                  <div className="text-yellow-200">Coins Earned</div>
                </div>
              </div>
            </div>

            {/* Detailed Answer Review */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Review Your Answers:</h4>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {quiz.questions.map((question: any, index: number) => {
                  const userAnswer = userAnswers[index];
                  const correctAnswer = question.correctAnswer || question.modelAnswer;
                  const isCorrect = userAnswer && correctAnswer && 
                    String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();

                  return (
                    <div key={index} className={`border rounded-lg p-3 ${
                      isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isCorrect ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm mb-2">
                            Q{index + 1}: {question.question.substring(0, 80)}...
                          </h5>
                          
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-slate-400">Your Answer: </span>
                              <span className={`${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {userAnswer || 'No answer selected'}
                              </span>
                            </div>
                            
                            {!isCorrect && (
                              <div>
                                <span className="text-slate-400">Correct Answer: </span>
                                <span className="text-green-400">{correctAnswer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {results.achievements && results.achievements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-nexus-gold">New Achievements!</h4>
                {results.achievements.map((achievement: any, index: number) => (
                  <Badge key={index} className="bg-nexus-gold/20 text-nexus-gold">
                    <Star className="w-3 h-3 mr-1" />
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                }}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Retake Quiz
              </Button>
              <Button
                onClick={onClose}
                className="bg-nexus-green text-black hover:bg-nexus-gold"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-black border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-nexus-green" />
              {quiz.title}
            </div>
            <Badge className="bg-slate-700">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Badge>
          </DialogTitle>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-nexus-green h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {renderQuestion()}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-slate-300">Choose your answer:</h4>
              {userAnswers[currentQuestionIndex] && (
                <Badge className="bg-nexus-green/20 text-nexus-green border-nexus-green/30">
                  ✓ Selected
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {getAnswerOptions().map((option, index) => {
                const isSelected = userAnswers[currentQuestionIndex] === option;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`w-full cursor-pointer transition-all duration-200 border-2 transform hover:scale-[1.02] rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-green/50 ${
                      isSelected
                        ? 'border-nexus-green bg-gradient-to-r from-nexus-green/20 to-emerald-500/20 shadow-xl shadow-nexus-green/20 ring-2 ring-nexus-green/30'
                        : 'border-slate-600 bg-slate-800/50 hover:border-nexus-green/50 hover:bg-slate-700/50'
                    }`}
                    onClick={() => {
                      console.log('Clicked option:', option);
                      handleAnswerSelect(option);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Radio button indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all duration-200 ${
                          isSelected
                            ? 'border-nexus-green bg-nexus-green shadow-lg'
                            : 'border-slate-400 hover:border-nexus-green/70'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 bg-black rounded-full m-0.5 animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          {quiz.questionType === 'mcq' && (
                            <span className={`font-bold mr-3 text-lg ${
                              isSelected ? 'text-nexus-green' : 'text-slate-300'
                            }`}>
                              {String.fromCharCode(65 + index)}.
                            </span>
                          )}
                          {quiz.questionType === 'assertion-reason' && (
                            <span className={`font-bold mr-3 ${
                              isSelected ? 'text-nexus-green' : 'text-slate-300'
                            }`}>
                              ({index + 1})
                            </span>
                          )}
                          <span className={`${
                            isSelected ? 'text-white font-medium' : 'text-slate-300'
                          }`}>
                            {option}
                          </span>
                          {isSelected && (
                            <span className="ml-2 text-nexus-green text-xl">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="pt-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              {/* Previous Button */}
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:border-nexus-green hover:text-nexus-green disabled:opacity-50"
              >
                ← Previous
              </Button>

              {/* Center Progress Info */}
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  {Object.keys(userAnswers).length} of {totalQuestions} answered
                </p>
              </div>

              {/* Next/Submit Button */}
              <div className="flex items-center space-x-3">
                {/* Always show the appropriate button when answer is selected */}
                {userAnswers[currentQuestionIndex] ? (
                  <Button
                    onClick={currentQuestionIndex === totalQuestions - 1 ? handleSubmitQuiz : handleNext}
                    disabled={submitQuizMutation.isPending}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-2 border-white/20 hover:from-yellow-500 hover:to-orange-500 hover:text-black font-bold px-8 py-3 shadow-2xl hover:shadow-emerald-400/50 transition-all duration-300 hover:scale-110 rounded-xl"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? (
                      submitQuizMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        '🎯 Submit Quiz'
                      )
                    ) : (
                      'Next Question →'
                    )}
                  </Button>
                ) : (
                  <div className="text-slate-400 text-sm italic px-4 py-2 border border-slate-600 rounded-lg bg-slate-800/30">
                    {currentQuestionIndex === totalQuestions - 1 ? 'Select an answer to submit' : 'Select an answer to continue'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}