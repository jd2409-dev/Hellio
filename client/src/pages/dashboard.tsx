import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  Star,
  ChevronRight,
  BarChart3,
  Users,
  LogOut,
  Video
} from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: subjectProgress } = useQuery({
    queryKey: ["/api/subjects/progress"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/user/achievements"],
  });

  const initializeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/initialize"),
    onSuccess: () => {
      window.location.reload();
    },
  });

  useEffect(() => {
    if (subjects && subjects.length === 0) {
      initializeMutation.mutate();
    }
  }, [subjects]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const defaultSubjects = [
    { id: 1, name: 'Mathematics', description: 'Algebra, Calculus, Geometry', icon: 'fas fa-calculator', color: '#3B82F6', progress: 85 },
    { id: 2, name: 'Physics', description: 'Mechanics, Waves, Quantum', icon: 'fas fa-atom', color: '#EF4444', progress: 72 },
    { id: 3, name: 'Chemistry', description: 'Organic, Inorganic, Physical', icon: 'fas fa-flask', color: '#10B981', progress: 91 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Top Navigation */}
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 p-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="font-orbitron text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NexusLearn AI
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* User Stats */}
            <div className="flex items-center space-x-4 bg-slate-700/50 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold">{userStats?.xp || 0} XP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-amber-400 rounded-full"></div>
                <span className="text-sm font-semibold">{userStats?.coins || 0}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                Level {userStats?.level || 1}
              </Badge>
            </div>
            
            {/* Profile */}
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-white font-semibold text-sm">{user?.firstName?.[0] || 'U'}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-orbitron font-bold mb-4 bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                Welcome back, {user?.firstName || 'Student'}!
              </h1>
              <p className="text-xl text-slate-400">Ready to continue your learning journey?</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">Day {userStats?.studyStreak || 0}</div>
              <div className="text-sm text-slate-400">Learning Streak {userStats?.studyStreak > 0 ? '🔥' : ''}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-400" />
                </div>
                <span className="text-3xl font-bold text-orange-400">{userStats?.studyStreak || 0}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Study Streak</h3>
              <p className="text-slate-400 text-sm">Days in a row</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-amber-400" />
                </div>
                <span className="text-3xl font-bold text-amber-400">{userStats?.totalAchievements || 0}</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-slate-400 text-sm">Unlocked</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-3xl font-bold text-emerald-400">{Math.round(userStats?.averageQuizScore || 0)}%</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
              <p className="text-slate-400 text-sm">Average quiz score</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-blue-400">{Math.round((userStats?.totalStudyTime || 0) / 60 * 10) / 10}h</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Study Time</h3>
              <p className="text-slate-400 text-sm">Total logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {/* AI Tutor */}
          <Link href="/ai-tutor">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Tutor</h3>
                <p className="text-slate-400 mb-6">Get instant help with any question using advanced AI</p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* AI Meetings */}
          <Link href="/ai-meeting">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-blue-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Meetings</h3>
                <p className="text-slate-400 mb-6">Organize AI-powered learning sessions on any topic</p>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 w-full">
                  <Video className="mr-2 h-4 w-4" />
                  Start Meeting
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Upload Textbook */}
          <Link href="/textbook-upload">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-amber-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Upload Textbook</h3>
                <p className="text-slate-400 mb-6">Upload PDFs and get AI-powered content analysis</p>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 w-full">
                  <Target className="mr-2 h-4 w-4" />
                  Upload Now
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Take Quiz */}
          <Link href="/quiz-selection">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Quizzes</h3>
                <p className="text-slate-400 mb-6">Adaptive quizzes that adjust to your skill level</p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Take Quiz
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Reflection */}
          <Link href="/reflection">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-indigo-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Reflection</h3>
                <p className="text-slate-400 mb-6">Review past quiz results and get improvement insights</p>
                <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analysis
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Study Planner */}
          <Link href="/study-planner">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-rose-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Study Planner</h3>
                <p className="text-slate-400 mb-6">AI-powered study schedules and exam planning</p>
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan Studies
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Subject Modules */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Your Subjects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(subjectProgress && subjectProgress.length > 0 ? subjectProgress : defaultSubjects).map((subject: any) => {
              const progress = subject.progress || 0;
              return (
                <Link key={subject.id} href={`/subject/${subject.id}`}>
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${subject.color || '#10B981'}20` }}
                          >
                            <i 
                              className={`${subject.icon || 'fas fa-book'} text-xl`}
                              style={{ color: subject.color || '#10B981' }}
                            ></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                            <p className="text-sm text-slate-400">{subject.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Progress</span>
                          <span className="text-sm font-semibold text-white">{progress}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2 bg-slate-700"
                        />
                        
                        {/* Real Activity Metrics */}
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{subject.totalQuizzes || 0} quizzes</span>
                          <span>{subject.studyTime || 0}m study time</span>
                          <span className={subject.averageScore >= 70 ? 'text-emerald-400' : subject.averageScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                            {subject.averageScore || 0}% avg
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {achievements?.filter((a: any) => a.earned).length > 0 ? 'Your Achievements' : 'Available Achievements'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements?.slice(0, 8).map((achievement: any) => (
              <Card key={achievement.id} className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm transition-all duration-300 ${
                achievement.earned ? 'hover:border-amber-500/30' : 'opacity-75 hover:border-slate-600/30'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-3"
                       style={{ 
                         backgroundImage: achievement.earned 
                           ? `linear-gradient(to right, ${achievement.color || '#FFD700'}, ${achievement.color || '#FFD700'}dd)` 
                           : 'linear-gradient(to right, #64748b, #475569)'
                       }}>
                    <i className={`${achievement.icon || 'fas fa-trophy'} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{achievement.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{achievement.description}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      achievement.earned 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-slate-600/20 text-slate-400 border-slate-600/30'
                    }`}
                  >
                    {achievement.earned ? 'Earned' : `+${achievement.xpReward} XP`}
                  </Badge>
                </CardContent>
              </Card>
            )) || (
              // Loading skeleton
              Array.from({length: 4}).map((_, index) => (
                <Card key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 bg-slate-600 rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-slate-600 rounded mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded mb-2"></div>
                    <div className="h-6 bg-slate-700 rounded-full w-16 mx-auto"></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
