import { useState, useEffect, useRef } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Star, 
  Target, 
  Users,
  Medal,
  ChevronRight,
  RefreshCw,
  Share2,
  Crown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type PeerChallenge = {
  id: number;
  challengeId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  subjectId?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questions: Question[];
  timeLimit?: number;
  maxAttempts: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  leaderboard?: LeaderboardEntry[];
};

type LeaderboardEntry = {
  id: number;
  participantName: string;
  bestScore: string;
  bestTime: number;
  attemptCount: number;
  lastAttemptAt: string;
};

// Quiz Interface Component
const QuizInterface = ({ challenge, onComplete }: { challenge: PeerChallenge; onComplete: (results: any) => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState((challenge.timeLimit || 10) * 60); // seconds
  const [isStarted, setIsStarted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStarted && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSubmitQuiz();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isStarted, timeRemaining]);

  const startQuiz = () => {
    setIsStarted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    challenge.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / challenge.questions.length) * 100);
  };

  const handleSubmitQuiz = () => {
    const score = calculateScore();
    const timeSpent = ((challenge.timeLimit || 10) * 60) - timeRemaining;
    
    const results = {
      answers: selectedAnswers,
      score,
      timeSpent,
      questionsCorrect: challenge.questions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length,
      totalQuestions: challenge.questions.length,
    };

    onComplete(results);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < challenge.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = challenge.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / challenge.questions.length) * 100;

  if (!isStarted) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white mb-4">{challenge.title}</CardTitle>
          <CardDescription className="text-slate-400 text-lg mb-6">
            {challenge.description}
          </CardDescription>
          
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-nexus-green">{challenge.questionCount}</div>
              <div className="text-sm text-slate-400">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{challenge.timeLimit || 10}</div>
              <div className="text-sm text-slate-400">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{challenge.maxAttempts}</div>
              <div className="text-sm text-slate-400">Max Attempts</div>
            </div>
          </div>

          <Badge className={`mb-6 ${
            challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {challenge.difficulty.toUpperCase()}
          </Badge>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={startQuiz}
            className="bg-gradient-to-r from-nexus-green to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg px-8 py-3"
          >
            <Target className="w-5 h-5 mr-2" />
            Start Challenge
          </Button>
          <p className="text-slate-500 text-sm mt-4">
            Created by <span className="text-nexus-green">{challenge.creatorName}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timer and Progress */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-white">
                Question {currentQuestionIndex + 1} of {challenge.questions.length}
              </div>
              <Badge className={timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}>
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Progress</div>
              <div className="text-lg font-bold text-nexus-green">{Math.round(progress)}%</div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'bg-nexus-green/20 border-nexus-green border-2 text-nexus-green'
                      : 'bg-slate-700/50 border-slate-600 border text-white hover:bg-slate-600/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-bold ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? 'border-nexus-green bg-nexus-green text-white'
                        : 'border-slate-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {option}
                  </div>
                </motion.button>
              ))}

              {/* Show explanation after answering */}
              {selectedAnswers[currentQuestionIndex] !== undefined && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                >
                  <h4 className="text-blue-400 font-medium mb-2">Explanation</h4>
                  <p className="text-slate-300">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentQuestionIndex < challenge.questions.length - 1 ? (
            <Button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              className="bg-nexus-green hover:bg-green-600 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length !== challenge.questions.length}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Submit Challenge
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Results Component
const Results = ({ challenge, results, onRematch }: { challenge: PeerChallenge; results: any; onRematch: () => void }) => {
  const { toast } = useToast();

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeText = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 70) return 'Good Work!';
    if (score >= 60) return 'Keep Practicing!';
    return 'Try Again!';
  };

  const shareResults = () => {
    const shareText = `I just scored ${results.score}% on "${challenge.title}" challenge! 🎯`;
    if (navigator.share) {
      navigator.share({
        title: 'NexusLearn Challenge Results',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Results Copied!",
        description: "Challenge results copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 text-center">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              {results.score >= 80 ? (
                <Trophy className="w-20 h-20 text-yellow-400" />
              ) : results.score >= 60 ? (
                <Medal className="w-20 h-20 text-gray-400" />
              ) : (
                <Target className="w-20 h-20 text-slate-400" />
              )}
            </motion.div>
            <CardTitle className="text-3xl text-white mb-2">Challenge Complete!</CardTitle>
            <CardDescription className="text-xl">
              <span className={getGradeColor(results.score)}>
                {getGradeText(results.score)}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Score Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-nexus-green/20 to-green-600/20 border-green-500/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">{results.score}%</div>
              <div className="text-slate-400">Final Score</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {Math.floor(results.timeSpent / 60)}:{(results.timeSpent % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-slate-400">Time Taken</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {results.questionsCorrect}/{results.totalQuestions}
              </div>
              <div className="text-slate-400">Correct Answers</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button
          onClick={onRematch}
          className="bg-nexus-green hover:bg-green-600 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={shareResults}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Link href="/peer-challenges">
          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
            <Trophy className="w-4 h-4 mr-2" />
            More Challenges
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

// Main Component
export default function ChallengePlay() {
  const [, params] = useRoute("/peer-challenges/:challengeId");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [gameState, setGameState] = useState<'loading' | 'playing' | 'results'>('loading');
  const [results, setResults] = useState<any>(null);

  const challengeId = params?.challengeId;

  // Fetch challenge
  const { data: challengeData, isLoading, error } = useQuery({
    queryKey: ['/api/peer-challenges', challengeId],
    enabled: !!challengeId,
  });

  // Submit attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async (data: any) => apiRequest(`/api/peer-challenges/${challengeId}/attempt`, {
      method: 'POST',
      body: data,
    }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/peer-challenges', challengeId] });
      setGameState('results');
      
      if (response.xpEarned) {
        toast({
          title: "Challenge Complete!",
          description: `You earned ${response.xpEarned} XP and ${response.coinsEarned} coins!`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit challenge attempt",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (challengeData && gameState === 'loading') {
      setGameState('playing');
    }
  }, [challengeData, gameState]);

  const handleQuizComplete = (quizResults: any) => {
    setResults(quizResults);
    submitAttemptMutation.mutate(quizResults);
  };

  const handleRematch = () => {
    setGameState('playing');
    setResults(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading challenge...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !challengeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Challenge Not Found</h2>
          <p className="text-slate-400 mb-4">This challenge may have been removed or the link is invalid.</p>
          <Link href="/peer-challenges">
            <Button className="bg-nexus-green hover:bg-green-600 text-white">
              Browse Challenges
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/peer-challenges">
              <Button variant="default" size="sm" className="bg-nexus-green hover:bg-nexus-green/90 text-white font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
            {gameState === 'playing' && (
              <div>
                <h1 className="text-xl font-bold text-white">{challengeData.title}</h1>
                <p className="text-slate-400">by {challengeData.creatorName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {gameState === 'playing' && (
          <QuizInterface 
            challenge={challengeData} 
            onComplete={handleQuizComplete}
          />
        )}

        {gameState === 'results' && results && (
          <Results 
            challenge={challengeData}
            results={results}
            onRematch={handleRematch}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground mt-12">
          Created by JD Vinod
        </footer>
      </div>
    </div>
  );
}