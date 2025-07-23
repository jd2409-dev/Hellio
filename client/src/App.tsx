import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AITutor from "@/pages/ai-tutor";
import AIMeeting from "@/pages/ai-meeting";
import TextbookUpload from "@/pages/textbook-upload";
import QuizSelection from "@/pages/quiz-selection";
import SubjectDetail from "@/pages/subject-detail";
import Analytics from "@/pages/analytics";
import Reflection from "@/pages/reflection";
import StudyPlanner from "@/pages/study-planner";
import PomodoroPage from "@/pages/pomodoro";
import TimeCapsule from "@/pages/time-capsule";
import PeerChallenges from "@/pages/peer-challenges";
import ChallengePlay from "@/pages/challenge-play";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-black">
        <div className="glass-effect p-8 rounded-2xl">
          <div className="animate-spin w-8 h-8 border-2 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-nexus-green">Loading NexusLearn AI...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/ai-tutor" component={AITutor} />
          <Route path="/ai-meeting" component={AIMeeting} />
          <Route path="/textbook-upload" component={TextbookUpload} />
          <Route path="/quiz-selection" component={QuizSelection} />
          <Route path="/subject/:id" component={SubjectDetail} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reflection" component={Reflection} />
          <Route path="/study-planner" component={StudyPlanner} />
          <Route path="/pomodoro" component={PomodoroPage} />
          <Route path="/time-capsule" component={TimeCapsule} />
          <Route path="/peer-challenges" component={PeerChallenges} />
          <Route path="/peer-challenges/:challengeId" component={ChallengePlay} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
