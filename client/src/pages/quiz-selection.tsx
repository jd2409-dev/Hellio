import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

export default function QuizSelection() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState([10]);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const { toast } = useToast();

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) throw new Error("Please select a subject");
      
      const response = await apiRequest("POST", "/api/quizzes/generate", {
        subject: selectedSubject,
        difficulty,
        numQuestions: numQuestions[0],
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data.generatedQuiz);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizComplete(false);
      setQuizResult(null);
      toast({
        title: "Quiz Generated",
        description: "Your personalized quiz is ready!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const response = await apiRequest("POST", `/api/quizzes/${generatedQuiz.id}/submit`, {
        answers,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setQuizComplete(true);
      toast({
        title: "Quiz Completed",
        description: `You scored ${data.score}%! Great job!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < generatedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (userAnswers.length !== generatedQuiz.questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitQuizMutation.mutate(userAnswers);
  };

  const subjectOptions = [
    { value: 'Mathematics', label: 'Mathematics', icon: 'fas fa-calculator', color: '#3B82F6' },
    { value: 'Physics', label: 'Physics', icon: 'fas fa-atom', color: '#EF4444' },
    { value: 'Chemistry', label: 'Chemistry', icon: 'fas fa-flask', color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-nexus-black text-white">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </Link>
            <h2 className="font-orbitron text-2xl font-bold text-nexus-green">Smart Quizzes</h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {!generatedQuiz ? (
          // Quiz Setup
          <div className="max-w-2xl mx-auto">
            <Card className="bg-black border border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-white">Create Your Quiz</CardTitle>
                <p className="text-slate-300 text-center">Choose a subject and difficulty level for your adaptive quiz</p>
              </CardHeader>
              <CardContent className="space-y-6 text-white">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-nexus-gray border-gray-600 focus:border-nexus-green">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-slate-700 text-white">
                      {subjectOptions.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          <div className="flex items-center space-x-2">
                            <i className={`${subject.icon} text-sm`} style={{ color: subject.color }}></i>
                            <span>{subject.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={difficulty === level ? "default" : "outline"}
                        onClick={() => setDifficulty(level)}
                        className={difficulty === level 
                          ? "bg-nexus-green text-black" 
                          : "border-gray-600 hover:border-nexus-green"
                        }
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Questions: {numQuestions[0]}
                  </label>
                  <Slider
                    value={numQuestions}
                    onValueChange={setNumQuestions}
                    min={5}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={() => generateQuizMutation.mutate()}
                  disabled={!selectedSubject || generateQuizMutation.isPending}
                  className="w-full bg-nexus-green text-black hover:bg-nexus-gold"
                >
                  {generateQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                      Generating Quiz...
                    </>
                  ) : (
                    'Generate Quiz'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : quizComplete ? (
          // Quiz Results
          <div className="max-w-2xl mx-auto">
            <Card className="bg-black border border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-center text-amber-400">Quiz Complete!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6 text-white">
                <div>
                  <div className="text-6xl font-bold text-nexus-green mb-2">{quizResult.score}%</div>
                  <p className="text-xl">
                    {quizResult.correctCount} out of {quizResult.totalQuestions} correct
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nexus-green">{quizResult.score >= 80 ? '+50' : quizResult.score >= 60 ? '+25' : '+10'}</div>
                    <div className="text-sm text-gray-400">Coins Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nexus-gold">+{Math.floor(quizResult.score * 2)}</div>
                    <div className="text-sm text-gray-400">XP Gained</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {quizResult.score >= 90 ? 'A+' : quizResult.score >= 80 ? 'A' : quizResult.score >= 70 ? 'B' : quizResult.score >= 60 ? 'C' : 'D'}
                    </div>
                    <div className="text-sm text-gray-400">Grade</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setGeneratedQuiz(null)}
                    className="w-full bg-nexus-green text-black hover:bg-nexus-gold"
                  >
                    Take Another Quiz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="w-full border-gray-600 hover:border-nexus-green"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Quiz Taking
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Question {currentQuestionIndex + 1} of {generatedQuiz.questions.length}
                </span>
                <span className="text-sm text-gray-400">{generatedQuiz.title}</span>
              </div>
              <div className="w-full bg-nexus-gray rounded-full h-2">
                <div 
                  className="bg-nexus-green h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / generatedQuiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <Card className="bg-black border border-slate-700 shadow-2xl mb-6">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-white">
                  {generatedQuiz.questions[currentQuestionIndex].question}
                </h3>
                
                <div className="space-y-3">
                  {generatedQuiz.questions[currentQuestionIndex].options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 text-left rounded-lg border transition-all duration-300 ${
                        userAnswers[currentQuestionIndex] === index
                          ? 'border-nexus-green bg-nexus-green bg-opacity-10'
                          : 'border-gray-600 hover:border-nexus-green glass-effect'
                      }`}
                    >
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-gray-600 hover:border-nexus-green"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Previous
              </Button>
              
              {currentQuestionIndex === generatedQuiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={submitQuizMutation.isPending}
                  className="bg-nexus-gold text-black hover:bg-nexus-green"
                >
                  {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === generatedQuiz.questions.length - 1}
                  className="bg-nexus-green text-black hover:bg-nexus-gold"
                >
                  Next
                  <i className="fas fa-chevron-right ml-2"></i>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
