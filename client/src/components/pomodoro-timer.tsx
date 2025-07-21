import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Clock, Coffee, Timer, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PomodoroSession {
  id: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  duration: number;
  actualDuration?: number;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  subjectId?: number;
  startedAt?: string;
  completedAt?: string;
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

const POMODORO_PRESETS = {
  work: 25,
  short_break: 5,
  long_break: 15,
};

export default function PomodoroTimer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(POMODORO_PRESETS.work * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [sessionType, setSessionType] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date>();
  const pausedTimeRef = useRef(0);

  // Fetch subjects for selection
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch user's pomodoro stats
  const { data: stats } = useQuery({
    queryKey: ['/api/pomodoro/stats'],
    enabled: !!user,
  });

  // Create pomodoro session
  const createSessionMutation = useMutation({
    mutationFn: async (data: {
      sessionType: string;
      duration: number;
      subjectId?: number;
    }) => {
      return apiRequest('/api/pomodoro/sessions', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      startTimeRef.current = new Date();
      pausedTimeRef.current = 0;
    },
  });

  // Update session (pause, resume, complete)
  const updateSessionMutation = useMutation({
    mutationFn: async (data: {
      sessionId: number;
      status: string;
      actualDuration?: number;
      pausedTime?: number;
    }) => {
      return apiRequest(`/api/pomodoro/sessions/${data.sessionId}`, {
        method: 'PATCH',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pomodoro/stats'] });
    },
  });

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (currentSession && startTimeRef.current) {
      const actualDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      updateSessionMutation.mutate({
        sessionId: currentSession.id,
        status: 'completed',
        actualDuration,
        pausedTime: pausedTimeRef.current,
      });
    }

    // Play completion sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      // Fallback to browser notification sound
    });

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: sessionType === 'work' ? 'Time for a break!' : 'Back to work!',
        icon: '/favicon.ico',
      });
    }

    toast({
      title: 'Session Complete! 🍅',
      description: sessionType === 'work' 
        ? `Great work! Take a ${cycleCount % 4 === 3 ? 'long' : 'short'} break.`
        : 'Break time is over! Ready for the next session?',
    });

    // Auto-advance to next session type
    if (sessionType === 'work') {
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      
      if (newCount % 4 === 0) {
        setSessionType('long_break');
        setTimeLeft(POMODORO_PRESETS.long_break * 60);
        setCycleCount(cycleCount + 1);
      } else {
        setSessionType('short_break');
        setTimeLeft(POMODORO_PRESETS.short_break * 60);
      }
    } else {
      setSessionType('work');
      setTimeLeft(POMODORO_PRESETS.work * 60);
    }

    setCurrentSession(null);
  };

  // Start timer
  const startTimer = () => {
    if (!currentSession) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      createSessionMutation.mutate({
        sessionType,
        duration: Math.ceil(timeLeft / 60),
        subjectId: selectedSubject || undefined,
      });
    }
    
    setIsRunning(true);
    setIsPaused(false);
  };

  // Pause timer
  const pauseTimer = () => {
    setIsPaused(true);
    
    if (currentSession && startTimeRef.current) {
      const currentPausedTime = Date.now() - startTimeRef.current.getTime();
      pausedTimeRef.current += currentPausedTime;
      
      updateSessionMutation.mutate({
        sessionId: currentSession.id,
        status: 'paused',
      });
    }
  };

  // Resume timer
  const resumeTimer = () => {
    setIsPaused(false);
    startTimeRef.current = new Date();
    
    if (currentSession) {
      updateSessionMutation.mutate({
        sessionId: currentSession.id,
        status: 'active',
      });
    }
  };

  // Stop timer
  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    if (currentSession && startTimeRef.current) {
      const actualDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      updateSessionMutation.mutate({
        sessionId: currentSession.id,
        status: 'cancelled',
        actualDuration,
        pausedTime: pausedTimeRef.current,
      });
    }
    
    setCurrentSession(null);
    resetTimer();
  };

  // Reset timer
  const resetTimer = () => {
    setTimeLeft(POMODORO_PRESETS[sessionType] * 60);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentSession(null);
    pausedTimeRef.current = 0;
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get session type info
  const getSessionInfo = () => {
    switch (sessionType) {
      case 'work':
        return { icon: Timer, color: 'bg-red-500', label: 'Focus Time' };
      case 'short_break':
        return { icon: Coffee, color: 'bg-green-500', label: 'Short Break' };
      case 'long_break':
        return { icon: Coffee, color: 'bg-blue-500', label: 'Long Break' };
    }
  };

  const sessionInfo = getSessionInfo();
  const SessionIcon = sessionInfo.icon;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <Card className="glass-effect border-nexus-green/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            {/* Session Type Badge */}
            <div className="flex justify-center">
              <Badge 
                variant="outline" 
                className={`${sessionInfo.color} text-white border-none px-4 py-2 text-lg flex items-center gap-2`}
              >
                <SessionIcon className="w-5 h-5" />
                {sessionInfo.label}
              </Badge>
            </div>

            {/* Timer */}
            <div className="space-y-4">
              <div className="text-8xl font-bold text-nexus-green font-mono">
                {formatTime(timeLeft)}
              </div>
              
              {/* Progress Ring */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 rotate-[-90deg]">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    className="text-nexus-green"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 56}`,
                      strokeDashoffset: `${
                        2 * Math.PI * 56 * (1 - (POMODORO_PRESETS[sessionType] * 60 - timeLeft) / (POMODORO_PRESETS[sessionType] * 60))
                      }`,
                      transition: 'stroke-dashoffset 1s ease-in-out',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <SessionIcon className="w-8 h-8 text-nexus-green" />
                </div>
              </div>
            </div>

            {/* Subject Selection */}
            <div className="flex justify-center">
              <Select 
                value={selectedSubject?.toString() || ''} 
                onValueChange={(value) => setSelectedSubject(value ? parseInt(value) : null)}
                disabled={isRunning}
              >
                <SelectTrigger className="w-64 glass-effect border-nexus-green/20">
                  <SelectValue placeholder="Select a subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No subject</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <Button
                  onClick={startTimer}
                  className="bg-nexus-green hover:bg-nexus-green/80 text-nexus-black font-semibold px-8 py-3 text-lg"
                  disabled={createSessionMutation.isPending}
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start
                </Button>
              ) : isPaused ? (
                <Button
                  onClick={resumeTimer}
                  className="bg-nexus-green hover:bg-nexus-green/80 text-nexus-black font-semibold px-8 py-3 text-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  variant="outline"
                  className="border-nexus-green text-nexus-green hover:bg-nexus-green/10 px-8 py-3 text-lg"
                >
                  <Pause className="w-6 h-6 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button
                onClick={stopTimer}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-3 text-lg"
                disabled={!isRunning && !isPaused}
              >
                <Square className="w-6 h-6 mr-2" />
                Stop
              </Button>
              
              <Button
                onClick={resetTimer}
                variant="ghost"
                className="text-muted-foreground hover:text-nexus-green px-8 py-3 text-lg"
                disabled={isRunning && !isPaused}
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect border-nexus-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-nexus-gold" />
              <span className="text-2xl font-bold text-nexus-green">
                {completedSessions}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-nexus-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-nexus-blue" />
              <span className="text-2xl font-bold text-nexus-green">
                {cycleCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-nexus-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-nexus-green" />
              <span className="text-2xl font-bold text-nexus-green">
                {Math.floor((completedSessions * 25) / 60)}h {(completedSessions * 25) % 60}m
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Type Presets */}
      <Card className="glass-effect border-nexus-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-nexus-green" />
            Quick Start Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(POMODORO_PRESETS).map(([type, minutes]) => (
              <Button
                key={type}
                variant="outline"
                className="h-20 flex-col gap-2 border-nexus-green/20 hover:bg-nexus-green/10"
                onClick={() => {
                  if (!isRunning) {
                    setSessionType(type as 'work' | 'short_break' | 'long_break');
                    setTimeLeft(minutes * 60);
                  }
                }}
                disabled={isRunning}
              >
                <div className="flex items-center gap-2">
                  {type === 'work' ? <Timer className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                  <span className="font-semibold capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {minutes} minutes
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}