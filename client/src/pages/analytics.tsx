import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target, Brain, Clock, BookOpen, Zap, Star, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AnalyticsData {
  totalStudyTime: number;
  averageScore: number;
  totalQuizzes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: Array<{
    date: string;
    studyTime: number;
    quizzes: number;
    score: number;
  }>;
  subjectPerformance: Array<{
    subjectName: string;
    averageScore: number;
    totalQuizzes: number;
    studyTime: number;
    strongAreas: string[];
    weakAreas: string[];
  }>;
  insights: Array<{
    category: 'strength' | 'weakness' | 'improvement' | 'achievement';
    title: string;
    description: string;
    suggestion?: string;
    subjectName?: string;
  }>;
  recommendations: string[];
}

export default function Analytics() {
  const { data: analyticsData, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg">Unable to load analytics data</p>
            <p className="text-slate-400">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'achievement': return <Award className="w-5 h-5 text-yellow-400" />;
      case 'improvement': return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'weakness': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getInsightColor = (category: string) => {
    switch (category) {
      case 'strength': return 'border-green-500/30 bg-green-500/10';
      case 'achievement': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'improvement': return 'border-blue-500/30 bg-blue-500/10';
      case 'weakness': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  const pieChartData = analyticsData.subjectPerformance.map((subject, index) => ({
    name: subject.subjectName,
    value: subject.studyTime,
    color: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-nexus-green to-nexus-gold bg-clip-text text-transparent mb-2">
            📊 Learning Analytics
          </h1>
          <p className="text-slate-300">Deep insights into your learning journey and performance</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300">Study Time</CardTitle>
                <Clock className="w-5 h-5 text-nexus-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {analyticsData.totalStudyTime}
                <span className="text-lg text-slate-400 ml-1">min</span>
              </div>
              <p className="text-xs text-slate-400">Total learning time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300">Average Score</CardTitle>
                <Target className="w-5 h-5 text-nexus-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {analyticsData.averageScore}%
              </div>
              <Progress 
                value={analyticsData.averageScore} 
                className="h-2 bg-slate-700"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300">Quizzes Taken</CardTitle>
                <BookOpen className="w-5 h-5 text-nexus-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {analyticsData.totalQuizzes}
              </div>
              <p className="text-xs text-slate-400">Total assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300">Study Streak</CardTitle>
                <Zap className="w-5 h-5 text-nexus-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {analyticsData.currentStreak}
                <span className="text-lg text-slate-400 ml-1">days</span>
              </div>
              <p className="text-xs text-slate-400">
                Best: {analyticsData.longestStreak} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-nexus-green data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-nexus-green data-[state=active]:text-black">
              Progress
            </TabsTrigger>
            <TabsTrigger value="subjects" className="data-[state=active]:bg-nexus-green data-[state=active]:text-black">
              Subjects
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-nexus-green data-[state=active]:text-black">
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress Chart */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-nexus-green" />
                    Weekly Study Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en', { weekday: 'short' })}
                      />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#F9FAFB' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="studyTime" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Study Time Distribution */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-nexus-green" />
                    Study Time by Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}m`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-nexus-gold" />
                  AI-Powered Recommendations
                </CardTitle>
                <p className="text-slate-300 text-sm">Personalized suggestions to enhance your learning</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {analyticsData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="w-6 h-6 bg-nexus-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-nexus-green text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-white flex-1">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Weekly Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="quizzes" fill="#3B82F6" name="Quizzes" />
                    <Bar dataKey="score" fill="#10B981" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="grid gap-6">
              {analyticsData.subjectPerformance.map((subject, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{subject.subjectName}</CardTitle>
                      <Badge className="bg-nexus-green/20 text-nexus-green">
                        {subject.averageScore}% avg
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{subject.totalQuizzes}</div>
                        <div className="text-sm text-slate-400">Quizzes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{subject.studyTime}m</div>
                        <div className="text-sm text-slate-400">Study Time</div>
                      </div>
                      <div className="text-center">
                        <Progress value={subject.averageScore} className="h-3" />
                        <div className="text-sm text-slate-400 mt-1">Performance</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {subject.strongAreas.length > 0 && (
                        <div>
                          <h4 className="text-green-400 font-semibold mb-2">💪 Strong Areas</h4>
                          <ul className="space-y-1">
                            {subject.strongAreas.map((area, i) => (
                              <li key={i} className="text-sm text-slate-300">• {area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {subject.weakAreas.length > 0 && (
                        <div>
                          <h4 className="text-red-400 font-semibold mb-2">🎯 Focus Areas</h4>
                          <ul className="space-y-1">
                            {subject.weakAreas.map((area, i) => (
                              <li key={i} className="text-sm text-slate-300">• {area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-4">
              {analyticsData.insights.map((insight, index) => (
                <Card key={index} className={`border ${getInsightColor(insight.category)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {getInsightIcon(insight.category)}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                        <p className="text-slate-300 mb-3">{insight.description}</p>
                        {insight.suggestion && (
                          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-nexus-green">
                            <p className="text-sm text-slate-300">
                              <strong className="text-nexus-green">Suggestion:</strong> {insight.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}