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
      return apiRequest('/api/quizzes/submit', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });
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
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
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
      quizId: quiz.id,
      answers: userAnswers,
      timeSpent,
      questionType: quiz.questionType,
    };

    submitQuizMutation.mutate(quizResults);
  };

  const getAnswerOptions = () => {
    if (quiz.questionType === 'assertion-reason') {
      return [
        'Both assertion and reason are correct and reason is the correct explanation',
        'Both assertion and reason are correct but reason is not the correct explanation',
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
                  <div className="font-bold text-yellow-300">{results.timeSpent}s</div>
                  <div className="text-yellow-200">Time Taken</div>
                </div>
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

          <div className="space-y-3">
            <h4 className="font-medium text-slate-300">Select your answer:</h4>
            <div className="space-y-2">
              {getAnswerOptions().map((option, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all border-2 ${
                    userAnswers[currentQuestionIndex] === option
                      ? 'border-nexus-green bg-nexus-green/20 shadow-lg'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                  }`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        userAnswers[currentQuestionIndex] === option
                          ? 'border-nexus-green bg-nexus-green'
                          : 'border-slate-400'
                      }`}>
                        {userAnswers[currentQuestionIndex] === option && (
                          <div className="w-2 h-2 bg-black rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        {quiz.questionType === 'mcq' && (
                          <span className="font-bold text-nexus-green mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                        )}
                        <span className="text-white">{option}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={!userAnswers[currentQuestionIndex] || submitQuizMutation.isPending}
                  className="bg-gradient-to-r from-nexus-green to-emerald-500 text-black font-bold"
                >
                  {submitQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!userAnswers[currentQuestionIndex]}
                  className="bg-nexus-green text-black hover:bg-nexus-gold"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}