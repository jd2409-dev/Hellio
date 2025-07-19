import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Trophy, Zap, Target, Users } from "lucide-react";

export default function Landing() {
  const handleAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        <div className="absolute top-20 left-20 w-4 h-4 bg-emerald-500/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-amber-500/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-6 h-6 bg-emerald-500/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-amber-500/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="font-orbitron text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NexusLearn AI
            </div>
          </div>
          <div className="space-x-3">
            <Button
              variant="ghost"
              onClick={handleAuth}
              className="text-gray-300 hover:text-white hover:bg-slate-700/50 border border-slate-600/50"
            >
              Sign In
            </Button>
            <Button
              onClick={handleAuth}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
            >
              Get Started
            </Button>
          </div>
        </nav>

        <div className="text-center max-w-6xl mx-auto">
          <div className="mb-8">
            <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
              ✨ Powered by Advanced AI
            </Badge>
            <h1 className="font-orbitron text-7xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent leading-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Learning
              </span>
            </h1>
            <p className="text-2xl text-slate-300 mb-12 leading-relaxed max-w-4xl mx-auto">
              Transform your education with AI-powered tutoring, intelligent textbook analysis, 
              adaptive quizzes, and gamified progress tracking
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Button
              onClick={handleAuth}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-2xl shadow-emerald-500/25 text-lg px-8 py-4 h-auto"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Learning Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white text-lg px-8 py-4 h-auto"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Explore Features
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-Powered Tutoring</h3>
                <p className="text-slate-400 leading-relaxed">Get personalized help from our advanced AI tutor, available 24/7 to answer questions and guide your learning</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Gamified Learning</h3>
                <p className="text-slate-400 leading-relaxed">Earn XP, unlock achievements, level up, and compete with friends in an engaging learning environment</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Analytics</h3>
                <p className="text-slate-400 leading-relaxed">Track your progress with detailed insights, performance analytics, and personalized recommendations</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features Section */}
          <div className="grid md:grid-cols-2 gap-12 mt-32">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Everything you need to excel
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Textbook Analysis</h3>
                    <p className="text-slate-400">Upload any textbook and get AI-powered summaries, key concepts, and searchable content</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Adaptive Quizzes</h3>
                    <p className="text-slate-400">Take intelligent quizzes that adapt to your learning pace and knowledge level</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                    <p className="text-slate-400">Monitor your learning journey with detailed progress reports and achievement milestones</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                  <p className="text-slate-400 mb-6">Join thousands of students already learning with NexusLearn AI</p>
                  <Button
                    onClick={handleAuth}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                  >
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}