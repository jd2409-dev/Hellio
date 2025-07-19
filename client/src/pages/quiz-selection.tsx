import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import InteractiveQuiz from "./interactive-quiz";
import { 
  ArrowLeft, 
  Brain, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  Star, 
  Trophy,
  Zap,
  FileText,
  Edit3,
  Award,
  Sparkles
} from "lucide-react";

// Core academic subjects
const ALL_SUBJECTS = [
  // Core Sciences
  { id: 'physics', name: 'Physics', icon: 'fas fa-atom', color: '#FF6B6B', description: 'Laws of nature and universe' },
  { id: 'chemistry', name: 'Chemistry', icon: 'fas fa-flask', color: '#4ECDC4', description: 'Matter and its interactions' },
  { id: 'biology', name: 'Biology', icon: 'fas fa-dna', color: '#45B7D1', description: 'Life and living organisms' },
  { id: 'mathematics', name: 'Mathematics', icon: 'fas fa-square-root-alt', color: '#96CEB4', description: 'Numbers, patterns and logic' },
  
  // Applied Sciences
  { id: 'computer-science', name: 'Computer Science', icon: 'fas fa-laptop-code', color: '#FFEAA7', description: 'Programming and algorithms' },
  { id: 'environmental-science', name: 'Environmental Science', icon: 'fas fa-leaf', color: '#55A3FF', description: 'Environment and sustainability' },
  
  // Social Studies
  { id: 'history', name: 'History', icon: 'fas fa-landmark', color: '#A29BFE', description: 'Past events and civilizations' },
  { id: 'geography', name: 'Geography', icon: 'fas fa-map', color: '#FD79A8', description: 'Earth and its features' },
  { id: 'political-science', name: 'Political Science', icon: 'fas fa-balance-scale', color: '#FDCB6E', description: 'Government and politics' },
  { id: 'economics', name: 'Economics', icon: 'fas fa-chart-line', color: '#00CEC9', description: 'Markets and finance' },
  { id: 'sociology', name: 'Sociology', icon: 'fas fa-users', color: '#E84393', description: 'Society and behavior' },
  { id: 'psychology', name: 'Psychology', icon: 'fas fa-brain', color: '#6C5CE7', description: 'Mind and behavior' },
  
  // Business & Commerce
  { id: 'business-studies', name: 'Business Studies', icon: 'fas fa-briefcase', color: '#E17055', description: 'Commerce and management' },
  { id: 'philosophy', name: 'Philosophy', icon: 'fas fa-lightbulb', color: '#6C5CE7', description: 'Fundamental questions and logic' },
];

// Difficulty levels with descriptions
const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    name: 'Easy', 
    color: '#00B894', 
    description: 'Basic concepts and straightforward questions',
    icon: <Target className="w-5 h-5" />,
    timeEstimate: '10-15 min'
  },
  { 
    id: 'medium', 
    name: 'Medium', 
    color: '#FDCB6E', 
    description: 'Moderate complexity with applied knowledge',
    icon: <Brain className="w-5 h-5" />,
    timeEstimate: '15-25 min'
  },
  { 
    id: 'hard', 
    name: 'Hard', 
    color: '#E17055', 
    description: 'Advanced concepts and analytical thinking',
    icon: <Trophy className="w-5 h-5" />,
    timeEstimate: '25-40 min'
  }
];

// Question types with marks
const QUESTION_TYPES = [
  { 
    id: 'mcq', 
    name: 'MCQ', 
    description: 'Multiple Choice Questions',
    icon: <CheckCircle2 className="w-5 h-5" />,
    marks: 'Variable',
    color: '#74B9FF'
  },
  { 
    id: 'assertion-reason', 
    name: 'Assertion & Reason', 
    description: 'Logic-based questions',
    icon: <Brain className="w-5 h-5" />,
    marks: 'Variable',
    color: '#A29BFE'
  },
  { 
    id: '1-mark', 
    name: '1 Mark Answers', 
    description: 'Quick recall questions',
    icon: <Zap className="w-5 h-5" />,
    marks: '1',
    color: '#00CEC9'
  },
  { 
    id: '2-mark', 
    name: '2 Mark Answers', 
    description: 'Short descriptive questions',
    icon: <Edit3 className="w-5 h-5" />,
    marks: '2',
    color: '#FDCB6E'
  },
  { 
    id: '3-mark', 
    name: '3 Mark Answers', 
    description: 'Detailed explanations',
    icon: <FileText className="w-5 h-5" />,
    marks: '3',
    color: '#FD79A8'
  },
  { 
    id: '5-mark', 
    name: '5 Mark Answers', 
    description: 'Comprehensive responses',
    icon: <BookOpen className="w-5 h-5" />,
    marks: '5',
    color: '#E17055'
  },
  { 
    id: 'model-paper', 
    name: 'Model Question Paper', 
    description: 'Mixed question types - complete exam simulation',
    icon: <Award className="w-5 h-5" />,
    marks: 'Mixed',
    color: '#6C5CE7',
    special: true
  }
];

export default function QuizSelection() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { toast } = useToast();

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) throw new Error("Please select a subject");
      if (!selectedDifficulty) throw new Error("Please select difficulty level");
      if (!selectedQuestionType) throw new Error("Please select question type");
      
      const selectedSubjectData = ALL_SUBJECTS.find(s => s.id === selectedSubject);
      const questionTypeData = QUESTION_TYPES.find(qt => qt.id === selectedQuestionType);
      
      const response = await apiRequest("POST", "/api/quizzes/generate", {
        subject: selectedSubjectData?.name || selectedSubject,
        difficulty: selectedDifficulty,
        questionType: selectedQuestionType,
        numQuestions: numQuestions,
        marks: questionTypeData?.marks,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data.generatedQuiz);
      setShowQuiz(true);
      toast({
        title: "Smart Quiz Generated! 🎯",
        description: `Your ${selectedQuestionType} quiz is ready!`,
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

  const handleStartQuiz = () => {
    generateQuizMutation.mutate();
  };

  const handleQuizComplete = (results: any) => {
    setShowQuiz(false);
    setGeneratedQuiz(null);
    // Reset selections for new quiz
    toast({
      title: "Quiz Completed! 🎉",
      description: `Great job! You can start another quiz anytime.`,
    });
  };

  const canStartQuiz = selectedSubject && selectedDifficulty && selectedQuestionType;

  if (showQuiz && generatedQuiz) {
    return (
      <InteractiveQuiz
        quiz={generatedQuiz}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-nexus-black text-white">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-orbitron text-3xl font-bold text-nexus-green flex items-center">
              <Sparkles className="w-8 h-8 mr-3" />
              Smart Quiz Selection
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Step 1: Subject Selection */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Step 1: Choose Your Subject</h2>
            <p className="text-slate-400">Select from our core academic subjects</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {ALL_SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                  selectedSubject === subject.id
                    ? 'border-nexus-green bg-nexus-green/20 shadow-lg scale-105'
                    : 'border-slate-600 bg-slate-800/50 hover:border-slate-400'
                }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${subject.color}20` }}>
                    <i className={`${subject.icon} text-xl`} style={{ color: subject.color }}></i>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{subject.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{subject.description}</p>
                  {selectedSubject === subject.id && (
                    <Badge className="mt-2 bg-nexus-green/20 text-nexus-green border-nexus-green/30">
                      Selected ✓
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Difficulty Selection */}
        {selectedSubject && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Step 2: Select Difficulty Level</h2>
              <p className="text-slate-400">Choose the challenge level that suits your preparation</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedDifficulty(level.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-left ${
                    selectedDifficulty === level.id
                      ? 'border-nexus-green bg-nexus-green/20 shadow-lg scale-105'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                         style={{ backgroundColor: `${level.color}20` }}>
                      {level.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{level.name}</h3>
                      <p className="text-xs text-slate-400">{level.timeEstimate}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">{level.description}</p>
                  {selectedDifficulty === level.id && (
                    <Badge className="mt-3 bg-nexus-green/20 text-nexus-green border-nexus-green/30">
                      Selected ✓
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Question Type Selection */}
        {selectedSubject && selectedDifficulty && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Step 3: Choose Question Type</h2>
              <p className="text-slate-400">Select the format that matches your exam pattern</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedQuestionType(type.id)}
                  className={`p-5 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-left ${
                    selectedQuestionType === type.id
                      ? 'border-nexus-green bg-nexus-green/20 shadow-lg scale-105'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-400'
                  } ${type.special ? 'ring-2 ring-purple-500/30' : ''}`}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                         style={{ backgroundColor: `${type.color}20` }}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{type.name}</h3>
                      <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
                        {type.marks} marks
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">{type.description}</p>
                  {type.special && (
                    <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      🏆 Comprehensive
                    </Badge>
                  )}
                  {selectedQuestionType === type.id && (
                    <Badge className="mt-2 bg-nexus-green/20 text-nexus-green border-nexus-green/30">
                      Selected ✓
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Quiz Configuration & Start */}
        {canStartQuiz && (
          <div className="mb-12">
            <Card className="bg-slate-800/50 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <Target className="w-6 h-6 mr-2 text-nexus-green" />
                  Final Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-1">Subject</h4>
                    <p className="text-nexus-green">{ALL_SUBJECTS.find(s => s.id === selectedSubject)?.name}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-1">Difficulty</h4>
                    <p className="text-nexus-green capitalize">{selectedDifficulty}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-1">Question Type</h4>
                    <p className="text-nexus-green">{QUESTION_TYPES.find(qt => qt.id === selectedQuestionType)?.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Number of Questions: {numQuestions}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>5 questions</span>
                      <span>30 questions</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleStartQuiz}
                  disabled={generateQuizMutation.isPending}
                  className="w-full bg-gradient-to-r from-nexus-green to-emerald-500 text-black font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  {generateQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-3"></div>
                      Generating Your Smart Quiz...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Start Smart Quiz 🚀
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-slate-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Estimated time: {DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.timeEstimate}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}