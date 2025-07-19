import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleRegister = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-nexus-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-nexus-green rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-nexus-gold rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-nexus-green rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-nexus-gold rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <nav className="flex justify-between items-center mb-16">
          <div className="font-orbitron text-2xl font-bold text-nexus-green">NexusLearn AI</div>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowLogin(true)}
              className="border-nexus-green text-nexus-green hover:bg-nexus-green hover:text-black"
            >
              Login
            </Button>
            <Button
              onClick={() => setShowRegister(true)}
              className="bg-nexus-green text-black hover:bg-nexus-gold"
            >
              Sign Up
            </Button>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-orbitron text-6xl font-bold mb-6 nexus-gradient bg-clip-text text-transparent animate-fadeIn">
            Future of Learning is Here
          </h1>
          <p className="text-xl text-gray-300 mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Master any subject with AI-powered tutoring, gamified learning, and intelligent progress tracking
          </p>
          
          {/* Hero Image */}
          <div className="mb-12 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600" 
              alt="Futuristic learning environment" 
              className="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="glass-effect animate-fadeIn" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-2xl text-white"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Tutoring</h3>
                <p className="text-gray-400">Get instant help with homework and complex problems</p>
              </CardContent>
            </Card>
            <Card className="glass-effect animate-fadeIn" style={{ animationDelay: '0.8s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-gold to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-2xl text-white"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Gamified Learning</h3>
                <p className="text-gray-400">Earn XP, coins, and achievements as you learn</p>
              </CardContent>
            </Card>
            <Card className="glass-effect animate-fadeIn" style={{ animationDelay: '1s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-green to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-2xl text-white"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
                <p className="text-gray-400">Track progress with AI-driven insights</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="glass-effect border-nexus-green">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-3xl text-nexus-green text-center">Welcome Back</DialogTitle>
            <p className="text-gray-400 text-center">Sign in to continue your learning journey</p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input 
                  type="email" 
                  placeholder="Email" 
                  className="bg-nexus-gray border-gray-600 focus:border-nexus-green"
                />
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="bg-nexus-gray border-gray-600 focus:border-nexus-green"
                />
              </div>
              <Button 
                onClick={handleLogin}
                className="w-full bg-nexus-green text-black hover:bg-nexus-gold transform hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Button>
            </div>

            <div className="text-center text-gray-400">or continue with</div>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleLogin}
                className="w-full border-gray-600 hover:border-nexus-green"
              >
                <i className="fab fa-google text-red-500 mr-3"></i>
                Continue with Google
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogin}
                className="w-full border-gray-600 hover:border-nexus-green"
              >
                <i className="fab fa-microsoft text-blue-500 mr-3"></i>
                Continue with Microsoft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Modal */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="glass-effect border-nexus-green max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-3xl text-nexus-green text-center">Join NexusLearn</DialogTitle>
            <p className="text-gray-400 text-center">Start your AI-powered learning adventure</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Input 
                type="text" 
                placeholder="Full Name" 
                className="bg-nexus-gray border-gray-600 focus:border-nexus-green"
              />
            </div>
            <div>
              <Input 
                type="email" 
                placeholder="Email" 
                className="bg-nexus-gray border-gray-600 focus:border-nexus-green"
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Password" 
                className="bg-nexus-gray border-gray-600 focus:border-nexus-green"
              />
            </div>
            <div>
              <Select>
                <SelectTrigger className="bg-nexus-gray border-gray-600 focus:border-nexus-green">
                  <SelectValue placeholder="Select Your Board" />
                </SelectTrigger>
                <SelectContent className="bg-nexus-gray border-gray-600">
                  <SelectItem value="cbse">CBSE</SelectItem>
                  <SelectItem value="icse">ICSE</SelectItem>
                  <SelectItem value="gcse">GCSE</SelectItem>
                  <SelectItem value="ib">IB</SelectItem>
                  <SelectItem value="state">State Board</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select>
                <SelectTrigger className="bg-nexus-gray border-gray-600 focus:border-nexus-green">
                  <SelectValue placeholder="Select Grade Level" />
                </SelectTrigger>
                <SelectContent className="bg-nexus-gray border-gray-600">
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleRegister}
              className="w-full bg-nexus-green text-black hover:bg-nexus-gold transform hover:scale-105 transition-all duration-300"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
