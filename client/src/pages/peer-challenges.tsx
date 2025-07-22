import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trophy, 
  Clock, 
  Users, 
  Share2, 
  Download, 
  Play,
  Target,
  Medal,
  Star,
  Zap,
  ChevronRight,
  Copy,
  ExternalLink
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

type Subject = {
  id: number;
  name: string;
  color: string;
};

// Challenge Creator Component
const ChallengeCreator = ({ onChallengeCreated }: { onChallengeCreated: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState<number>(10); // minutes
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/peer-challenges', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/peer-challenges'] });
      toast({
        title: "Challenge Created!",
        description: "Your peer challenge is ready to share!",
      });
      onChallengeCreated();
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDifficulty('medium');
    setSubjectId(null);
    setTimeLimit(10);
    setMaxAttempts(3);
    setQuestions([]);
    setCurrentQuestion("");
    setCurrentOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
  };

  const addQuestion = () => {
    if (!currentQuestion || currentOptions.some(opt => !opt.trim())) {
      toast({
        title: "Incomplete Question",
        description: "Please fill in all question fields.",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: Question = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      question: currentQuestion,
      options: currentOptions,
      correctAnswer,
      explanation: explanation || undefined,
    };

    setQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion("");
    setCurrentOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");

    toast({
      title: "Question Added",
      description: `Question ${questions.length + 1} added successfully!`,
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title || !description || questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide title, description, and at least one question.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length < 3) {
      toast({
        title: "Minimum Questions Required",
        description: "Please add at least 3 questions for a valid challenge.",
        variant: "destructive",
      });
      return;
    }

    const challengeData = {
      title,
      description,
      difficulty,
      subjectId,
      questionCount: questions.length,
      questions,
      timeLimit,
      maxAttempts,
      isPublic: true,
      tags: [difficulty],
    };

    createChallengeMutation.mutate(challengeData);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-nexus-green" />
            Create Challenge
          </CardTitle>
          <CardDescription className="text-slate-400">
            Design a quiz challenge for your peers to compete with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-white">Challenge Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Advanced Physics Quiz"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="text-white">Subject</Label>
              <Select value={subjectId?.toString() || ""} onValueChange={(value) => setSubjectId(parseInt(value))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your challenge..."
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Difficulty</Label>
              <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeLimit" className="text-white">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                min="1"
                max="60"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="maxAttempts" className="text-white">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                min="1"
                max="10"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Builder */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Add Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question" className="text-white">Question</Label>
            <Textarea
              id="question"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Enter your question..."
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentOptions.map((option, index) => (
              <div key={index}>
                <Label className="text-white">Option {index + 1}</Label>
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...currentOptions];
                    newOptions[index] = e.target.value;
                    setCurrentOptions(newOptions);
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            ))}
          </div>

          <div>
            <Label className="text-white">Correct Answer</Label>
            <Select value={correctAnswer.toString()} onValueChange={(value) => setCorrectAnswer(parseInt(value))}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentOptions.map((option, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Option {index + 1}: {option || "Empty"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="explanation" className="text-white">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this is the correct answer..."
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <Button onClick={addQuestion} className="bg-nexus-green hover:bg-green-600 text-white">
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Preview Questions */}
      {questions.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Preview Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">Q{index + 1}: {q.question}</h4>
                    <Button
                      onClick={() => removeQuestion(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {q.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded text-sm ${
                          optIndex === q.correctAnswer
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-slate-600/50 text-slate-300'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-slate-400 text-sm mt-2 italic">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <Button
                onClick={handleSubmit}
                disabled={createChallengeMutation.isPending || questions.length === 0}
                className="w-full bg-gradient-to-r from-nexus-green to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                {createChallengeMutation.isPending ? 'Creating Challenge...' : `Create Challenge (${questions.length} questions)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Challenge Browser Component
const ChallengeBrowser = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch public challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['/api/peer-challenges/public'],
  });

  // Fetch user's challenges
  const { data: myChallenges = [] } = useQuery({
    queryKey: ['/api/peer-challenges/my-challenges'],
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const { toast } = useToast();
  
  const copyShareLink = (challengeId: string) => {
    const shareUrl = `${window.location.origin}/peer-challenges/${challengeId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Challenge link copied to clipboard",
    });
  };

  const downloadChallenge = (challenge: PeerChallenge) => {
    const challengeData = {
      id: challenge.challengeId,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      questions: challenge.questions,
      timeLimit: challenge.timeLimit,
      creator: challenge.creatorName,
      timestamp: challenge.createdAt,
    };

    const blob = new Blob([JSON.stringify(challengeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${challenge.title.replace(/\s+/g, '_')}_challenge.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading challenges...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="public" className="space-y-6">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="public" className="data-[state=active]:bg-nexus-green">
          Public Challenges
        </TabsTrigger>
        <TabsTrigger value="mine" className="data-[state=active]:bg-nexus-green">
          My Challenges ({myChallenges.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="public" className="space-y-6">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
            <Target className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="grid gap-6">
          {challenges.filter((challenge: PeerChallenge) => 
            challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((challenge: PeerChallenge) => (
            <motion.div
              key={challenge.challengeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-nexus-green/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                      <p className="text-slate-400 mb-2">{challenge.description}</p>
                      <p className="text-sm text-slate-500">Created by {challenge.creatorName}</p>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {challenge.questionCount} questions
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {challenge.timeLimit || 10} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {challenge.maxAttempts} attempts
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/peer-challenges/${challenge.challengeId}`}>
                      <Button className="bg-nexus-green hover:bg-green-600 text-white">
                        <Play className="w-4 h-4 mr-2" />
                        Start Challenge
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => copyShareLink(challenge.challengeId)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadChallenge(challenge)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {challenges.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No challenges yet</p>
              <p className="text-slate-500">Be the first to create a challenge!</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="mine" className="space-y-6">
        <div className="grid gap-6">
          {myChallenges.map((challenge: PeerChallenge) => (
            <Card key={challenge.challengeId} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                    <p className="text-slate-400 mb-2">{challenge.description}</p>
                    <p className="text-sm text-slate-500">
                      Created on {new Date(challenge.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{challenge.questionCount} questions</span>
                    <span>{challenge.timeLimit || 10} min</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => copyShareLink(challenge.challengeId)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadChallenge(challenge)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {myChallenges.length === 0 && (
            <div className="text-center py-12">
              <Plus className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No challenges created yet</p>
              <p className="text-slate-500">Create your first challenge to get started!</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

// Main Component
export default function PeerChallenges() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="default" size="sm" className="bg-nexus-green hover:bg-nexus-green/90 text-white font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Peer Challenges</h1>
              <p className="text-slate-400">Create and share quiz challenges with your peers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="browse" className="data-[state=active]:bg-nexus-green">
              <Trophy className="w-4 h-4 mr-2" />
              Browse Challenges
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-nexus-green">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <ChallengeBrowser />
          </TabsContent>

          <TabsContent value="create">
            <ChallengeCreator onChallengeCreated={() => setActiveTab("browse")} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground mt-12">
          Created by JD Vinod
        </footer>
      </div>
    </div>
  );
}