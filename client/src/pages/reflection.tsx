import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock,
  Award,
  Lightbulb,
  Brain
} from "lucide-react";

export default function Reflection() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: reflectionData, isLoading: reflectionLoading } = useQuery({
    queryKey: ["/api/user/reflection"],
    retry: false,
  });

  if (isLoading || reflectionLoading) {
    return (
      <div className="min-h-screen bg-nexus-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your reflection data...</p>
        </div>
      </div>
    );
  }

  if (!reflectionData) {
    return (
      <div className="min-h-screen bg-nexus-black text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Quiz History Yet</h2>
            <p className="text-slate-400 mb-6">Take some quizzes to start building your reflection data!</p>
            <Link href="/quiz-selection">
              <Button className="bg-nexus-green hover:bg-green-600">Take Your First Quiz</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { recentAttempts, subjectPerformance, difficultyPerformance, commonMistakes, improvementSuggestions, totalAttempts, averageScore } = reflectionData;

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
              <TrendingUp className="w-8 h-8 mr-3" />
              Learning Reflection
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">{totalAttempts}</div>
              <div className="text-sm text-slate-400">Total Quizzes</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">{Math.round(averageScore)}%</div>
              <div className="text-sm text-slate-400">Average Score</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">{Object.keys(subjectPerformance).length}</div>
              <div className="text-sm text-slate-400">Subjects Practiced</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">{commonMistakes.length}</div>
              <div className="text-sm text-slate-400">Areas to Improve</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <BarChart3 className="w-5 h-5 mr-2" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(subjectPerformance).map(([subject, data]: [string, any]) => {
                const avgScore = data.attempts > 0 ? Math.round(data.total / data.attempts) : 0;
                return (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{subject}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">{data.attempts} attempts</span>
                        <Badge variant={avgScore >= 80 ? "default" : avgScore >= 60 ? "secondary" : "destructive"}>
                          {avgScore}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={avgScore} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Difficulty Performance */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Target className="w-5 h-5 mr-2" />
                Difficulty Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(difficultyPerformance).map(([difficulty, data]: [string, any]) => {
                const avgScore = data.attempts > 0 ? Math.round(data.total / data.attempts) : 0;
                const color = difficulty === 'easy' ? 'text-green-400' : difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400';
                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium capitalize ${color}`}>{difficulty}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">{data.attempts} attempts</span>
                        <Badge variant={avgScore >= 80 ? "default" : avgScore >= 60 ? "secondary" : "destructive"}>
                          {avgScore}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={avgScore} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* AI-Powered Improvement Suggestions */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
              AI-Powered Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {improvementSuggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-nexus-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-nexus-green" />
                  </div>
                  <p className="text-slate-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Mistakes Analysis */}
        {commonMistakes.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                Recent Mistakes to Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonMistakes.slice(0, 5).map((mistake: any, index: number) => (
                  <div key={index} className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">{mistake.subject}</Badge>
                          <Badge variant="outline" className="text-xs">{mistake.topic}</Badge>
                        </div>
                        <p className="text-white font-medium text-sm mb-2">{mistake.question}...</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-red-400">Your Answer:</span>
                            <span className="text-slate-300">{mistake.userAnswer}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-400">Correct Answer:</span>
                            <span className="text-slate-300">{mistake.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Quiz History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Clock className="w-5 h-5 mr-2" />
              Recent Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.map((attempt: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      parseFloat(attempt.score) >= 80 ? 'bg-green-500/20' :
                      parseFloat(attempt.score) >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      {parseFloat(attempt.score) >= 80 ? 
                        <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                        parseFloat(attempt.score) >= 60 ?
                        <Target className="w-4 h-4 text-yellow-400" /> :
                        <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-medium">Quiz #{attempt.quizId}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{Math.round(parseFloat(attempt.score))}%</div>
                    <div className="text-slate-400 text-sm">{attempt.timeSpent || 0}s</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link href="/quiz-selection">
            <Button className="bg-nexus-green hover:bg-green-600">
              Take Another Quiz
            </Button>
          </Link>
          <Link href="/ai-tutor">
            <Button variant="outline" className="border-nexus-green text-nexus-green hover:bg-nexus-green hover:text-white">
              Get AI Help
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}