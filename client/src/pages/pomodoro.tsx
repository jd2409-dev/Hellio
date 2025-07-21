import { Link } from 'wouter';
import { ArrowLeft, Timer, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PomodoroTimer from '@/components/pomodoro-timer';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function PomodoroPage() {
  const { user } = useAuth();

  // Fetch pomodoro statistics
  const { data: weeklyStats } = useQuery({
    queryKey: ['/api/pomodoro/weekly-stats'],
    enabled: !!user,
  });

  const { data: recentSessions } = useQuery({
    queryKey: ['/api/pomodoro/recent-sessions'],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-nexus-black text-nexus-light">
      {/* Header */}
      <div className="border-b border-nexus-green/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="text-nexus-green hover:bg-nexus-green/10"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-nexus-green/20 rounded-lg flex items-center justify-center">
                  <Timer className="w-6 h-6 text-nexus-green" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-nexus-green">Pomodoro Timer</h1>
                  <p className="text-muted-foreground">
                    Boost your focus and productivity with the Pomodoro Technique
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer */}
          <div className="lg:col-span-2">
            <PomodoroTimer />
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Weekly Progress */}
            <Card className="glass-effect border-nexus-green/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-nexus-green">
                  <TrendingUp className="w-5 h-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sessions Completed</span>
                    <span className="font-bold text-nexus-green">
                      {weeklyStats?.totalSessions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Focus Time</span>
                    <span className="font-bold text-nexus-green">
                      {weeklyStats?.totalFocusTime || '0h 0m'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Session</span>
                    <span className="font-bold text-nexus-green">
                      {weeklyStats?.averageSession || '0m'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="glass-effect border-nexus-green/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-nexus-green">
                  <Calendar className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions?.slice(0, 5).map((session: any, index: number) => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-nexus-green/10 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          session.sessionType === 'work' ? 'bg-red-500' :
                          session.sessionType === 'short_break' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium">
                            {session.sessionType === 'work' ? 'Focus' :
                             session.sessionType === 'short_break' ? 'Short Break' :
                             'Long Break'}
                          </div>
                          {session.subject && (
                            <div className="text-xs text-muted-foreground">
                              {session.subject.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.actualDuration ? 
                          `${Math.floor(session.actualDuration / 60)}m` : 
                          `${session.duration}m`
                        }
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      No recent sessions yet. Start your first pomodoro!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="glass-effect border-nexus-green/20">
              <CardHeader>
                <CardTitle className="text-nexus-green">Pomodoro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>• Work for 25 minutes, then take a 5-minute break</div>
                  <div>• After 4 work sessions, take a longer 15-minute break</div>
                  <div>• Turn off notifications during focus time</div>
                  <div>• Use breaks to step away from your screen</div>
                  <div>• Track your most productive subjects</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}