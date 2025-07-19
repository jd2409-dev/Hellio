import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GamificationStats from "@/components/gamification-stats";
import SubjectCard from "@/components/subject-card";
import AchievementCard from "@/components/achievement-card";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
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
    <div className="min-h-screen bg-nexus-black text-white">
      {/* Top Navigation */}
      <nav className="glass-effect border-b border-gray-700 p-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="font-orbitron text-xl font-bold text-nexus-green">NexusLearn AI</div>
          
          <div className="flex items-center space-x-6">
            <GamificationStats 
              xp={userStats?.xp || 2450}
              coins={userStats?.coins || 1280}
              level={userStats?.level || 12}
            />
            <div className="w-10 h-10 bg-gradient-to-r from-nexus-green to-nexus-gold rounded-full flex items-center justify-center cursor-pointer">
              <i className="fas fa-user text-black"></i>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            Welcome back, <span className="text-nexus-green">{user?.firstName || "Student"}</span>!
          </h1>
          <p className="text-gray-400 text-lg">Ready to continue your learning journey? You're doing amazing!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <i className="fas fa-fire text-3xl text-orange-500"></i>
                <span className="text-2xl font-bold text-nexus-green">{userStats?.studyStreak || 7}</span>
              </div>
              <h3 className="text-lg font-semibold">Study Streak</h3>
              <p className="text-gray-400">Days in a row</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <i className="fas fa-trophy text-3xl text-nexus-gold"></i>
                <span className="text-2xl font-bold text-nexus-gold">{userStats?.totalAchievements || 15}</span>
              </div>
              <h3 className="text-lg font-semibold">Achievements</h3>
              <p className="text-gray-400">Unlocked</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <i className="fas fa-chart-line text-3xl text-nexus-green"></i>
                <span className="text-2xl font-bold text-nexus-green">78%</span>
              </div>
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <p className="text-gray-400">This semester</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <i className="fas fa-clock text-3xl text-blue-400"></i>
                <span className="text-2xl font-bold text-blue-400">4.2h</span>
              </div>
              <h3 className="text-lg font-semibold">Study Time</h3>
              <p className="text-gray-400">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* AI Tutor */}
          <Link href="/ai-tutor">
            <Card className="glass-effect neon-border cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-glow">
                  <i className="fas fa-robot text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Tutor</h3>
                <p className="text-gray-400 mb-6">Get instant help with any question using advanced AI</p>
                <Button className="bg-nexus-green text-black hover:bg-nexus-gold">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Upload Textbook */}
          <Link href="/textbook-upload">
            <Card className="glass-effect neon-border cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-nexus-gold to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:gold-glow">
                  <i className="fas fa-upload text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">Upload Textbook</h3>
                <p className="text-gray-400 mb-6">Upload PDFs and get AI-powered content analysis</p>
                <Button className="bg-nexus-gold text-black hover:bg-nexus-green">
                  Upload Now
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Take Quiz */}
          <Link href="/quiz-selection">
            <Card className="glass-effect neon-border cursor-pointer hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-nexus-green rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-glow">
                  <i className="fas fa-question-circle text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Quizzes</h3>
                <p className="text-gray-400 mb-6">Adaptive quizzes that adjust to your skill level</p>
                <Button className="bg-purple-500 text-white hover:bg-nexus-green">
                  Take Quiz
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Subject Modules */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 font-orbitron">Your Subjects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(subjects && subjects.length > 0 ? subjects : defaultSubjects).map((subject: any) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={subject.progress || Math.floor(Math.random() * 40) + 60}
              />
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 font-orbitron">Recent Achievements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AchievementCard
              name="Math Master"
              description="Completed 100 math problems"
              icon="fas fa-star"
              color="from-nexus-gold to-yellow-500"
            />
            <AchievementCard
              name="Study Streak"
              description="7 days in a row"
              icon="fas fa-fire"
              color="from-nexus-green to-green-500"
            />
            <AchievementCard
              name="Quiz Champion"
              description="Perfect score on 5 quizzes"
              icon="fas fa-brain"
              color="from-purple-500 to-nexus-green"
            />
            <AchievementCard
              name="Knowledge Seeker"
              description="Uploaded 10 textbooks"
              icon="fas fa-book"
              color="from-nexus-gold to-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
