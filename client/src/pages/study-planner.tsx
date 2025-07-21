import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarDays, 
  Plus, 
  BookOpen, 
  Clock, 
  Bell, 
  Target, 
  Brain,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { Link } from "wouter";

export default function StudyPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'week' | 'day'>('calendar');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const { data: studyPlans } = useQuery({
    queryKey: ["/api/study-plans"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/study-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      setShowCreateDialog(false);
    },
  });

  const generateAIPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/study-plans/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      setShowAIDialog(false);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/study-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
    },
  });

  const getPlansForDate = (date: Date) => {
    return studyPlans?.filter((plan: any) => 
      isSameDay(parseISO(plan.plannedDate), date)
    ) || [];
  };

  const getWeekDates = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createPlanMutation.mutate({
      subjectId: parseInt(formData.get('subjectId') as string),
      title: formData.get('title'),
      description: formData.get('description'),
      plannedDate: selectedDate.toISOString(),
      duration: parseInt(formData.get('duration') as string),
      priority: formData.get('priority'),
      studyType: formData.get('studyType'),
    });
  };

  const handleGenerateAIPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    generateAIPlanMutation.mutate({
      subjectId: parseInt(formData.get('subjectId') as string),
      examType: formData.get('examType'),
      examDate: formData.get('examDate'),
      currentDate: new Date().toISOString(),
      syllabus: formData.get('syllabus'),
      dailyStudyHours: parseInt(formData.get('dailyStudyHours') as string),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="default" size="sm" className="bg-nexus-green hover:bg-nexus-green/90 text-white font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                Study Planner
              </h1>
              <p className="text-slate-400">Plan your learning journey and stay organized</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              {['calendar', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Create Plan Button */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <CreatePlanDialog onSubmit={handleCreatePlan} subjects={subjects} isLoading={createPlanMutation.isPending} />
            </Dialog>

            {/* AI Plan Generator */}
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Planner
                </Button>
              </DialogTrigger>
              <AIGeneratorDialog onSubmit={handleGenerateAIPlan} subjects={subjects} isLoading={generateAIPlanMutation.isPending} />
            </Dialog>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border-slate-700"
                    modifiers={{
                      hasPlans: studyPlans?.map((plan: any) => parseISO(plan.plannedDate)) || []
                    }}
                    modifiersStyles={{
                      hasPlans: { 
                        backgroundColor: '#10b981', 
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Daily Plans */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">
                    Plans for {format(selectedDate, 'EEEE, MMMM dd')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyPlansView 
                    plans={getPlansForDate(selectedDate)} 
                    onDelete={(id) => deletePlanMutation.mutate(id)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="space-y-6">
            <WeekView 
              selectedDate={selectedDate}
              studyPlans={studyPlans || []}
              onDateSelect={setSelectedDate}
              onDelete={(id) => deletePlanMutation.mutate(id)}
            />
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-6">
            <DayView 
              selectedDate={selectedDate}
              plans={getPlansForDate(selectedDate)}
              onDateChange={setSelectedDate}
              onDelete={(id) => deletePlanMutation.mutate(id)}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          Created by JD Vinod
        </footer>
      </div>
    </div>
  );
}

// Create Plan Dialog Component
function CreatePlanDialog({ onSubmit, subjects, isLoading }: any) {
  return (
    <DialogContent className="bg-slate-800 border-slate-700 text-white">
      <DialogHeader>
        <DialogTitle>Create Study Plan</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Subject</Label>
          <Select name="subjectId" required>
            <SelectTrigger className="bg-slate-700 border-slate-600">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects?.map((subject: any) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Title</Label>
          <Input 
            name="title" 
            placeholder="e.g., Algebra Practice" 
            className="bg-slate-700 border-slate-600" 
            required 
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea 
            name="description" 
            placeholder="What will you study?"
            className="bg-slate-700 border-slate-600"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Duration (minutes)</Label>
            <Input 
              name="duration" 
              type="number" 
              placeholder="60" 
              className="bg-slate-700 border-slate-600" 
              required 
            />
          </div>

          <div>
            <Label>Priority</Label>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Study Type</Label>
          <Select name="studyType" defaultValue="reading">
            <SelectTrigger className="bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
          {isLoading ? "Creating..." : "Create Plan"}
        </Button>
      </form>
    </DialogContent>
  );
}

// AI Generator Dialog Component
function AIGeneratorDialog({ onSubmit, subjects, isLoading }: any) {
  return (
    <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
      <DialogHeader>
        <DialogTitle>AI Study Plan Generator</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Subject</Label>
            <Select name="subjectId" required>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Exam Type</Label>
            <Select name="examType" required>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midterm">Midterm</SelectItem>
                <SelectItem value="final">Final Exam</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="test">Unit Test</SelectItem>
                <SelectItem value="board">Board Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Exam Date</Label>
            <Input 
              name="examDate" 
              type="date" 
              className="bg-slate-700 border-slate-600" 
              required 
            />
          </div>

          <div>
            <Label>Daily Study Hours</Label>
            <Input 
              name="dailyStudyHours" 
              type="number" 
              min="1" 
              max="12" 
              defaultValue="2"
              className="bg-slate-700 border-slate-600" 
              required 
            />
          </div>
        </div>

        <div>
          <Label>Syllabus/Topics to Cover</Label>
          <Textarea 
            name="syllabus" 
            placeholder="List the topics or chapters you need to study for the exam..."
            className="bg-slate-700 border-slate-600"
            rows={4}
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Generating..." : "Generate AI Study Plan"}
        </Button>
      </form>
    </DialogContent>
  );
}

// Daily Plans View Component
function DailyPlansView({ plans, onDelete }: any) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>No study plans for this day</p>
        <p className="text-sm">Click "Add Plan" to create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan: any) => (
        <Card key={plan.id} className="bg-slate-700/50 border-slate-600/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={plan.priority === 'high' ? 'destructive' : plan.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {plan.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {plan.studyType}
                  </Badge>
                </div>
                <h3 className="font-semibold text-white mb-1">{plan.title}</h3>
                <p className="text-slate-400 text-sm mb-2">{plan.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.duration}m
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {plan.subject?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-400 hover:text-red-300"
                  onClick={() => onDelete(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Week View Component
function WeekView({ selectedDate, studyPlans, onDateSelect, onDelete }: any) {
  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Week of {format(weekDates[0], 'MMM dd')} - {format(weekDates[6], 'MMM dd')}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateSelect(addDays(selectedDate, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateSelect(addDays(selectedDate, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dayPlans = studyPlans.filter((plan: any) => 
            isSameDay(parseISO(plan.plannedDate), date)
          );

          return (
            <Card 
              key={date.toISOString()} 
              className="bg-slate-800/50 border-slate-700/50 cursor-pointer hover:border-emerald-500/30"
              onClick={() => onDateSelect(date)}
            >
              <CardContent className="p-3">
                <div className="text-center mb-3">
                  <div className="text-xs text-slate-400 uppercase">
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isSameDay(date, selectedDate) ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {format(date, 'dd')}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayPlans.slice(0, 3).map((plan: any) => (
                    <div 
                      key={plan.id} 
                      className="text-xs p-2 bg-slate-700/50 rounded text-slate-300 truncate"
                    >
                      {plan.title}
                    </div>
                  ))}
                  {dayPlans.length > 3 && (
                    <div className="text-xs text-slate-400 text-center">
                      +{dayPlans.length - 3} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component  
function DayView({ selectedDate, plans, onDateChange, onDelete }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <DailyPlansView plans={plans} onDelete={onDelete} />
        </CardContent>
      </Card>
    </div>
  );
}

function getWeekDates(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}