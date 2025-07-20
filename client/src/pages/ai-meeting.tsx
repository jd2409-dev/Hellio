import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Video,
  Mic,
  MicOff,
  MessageCircle,
  Send,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Brain,
  Play,
  Pause,
  ArrowLeft,
  Maximize2,
  Minimize2,
  HelpCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";
import { Link } from "wouter";

interface Meeting {
  id: number;
  topic: string;
  grade: string;
  subject: string;
  description: string;
  agenda: string[];
  duration: number;
  status: 'scheduled' | 'active' | 'completed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  meetingId?: number;
}

interface JitsiMeetingData {
  url: string;
  outline: string;
  status: string;
}

export default function AIMeeting() {
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [meetingProgress, setMeetingProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [jitsiMeetingData, setJitsiMeetingData] = useState<JitsiMeetingData | null>(null);
  const [lessonTopic, setLessonTopic] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize speech synthesis and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = speechSynthRef.current?.getVoices() || [];
        console.log('Speech synthesis voices loaded:', voices.length);
        
        // Filter English voices and prioritize quality ones
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        setAvailableVoices(englishVoices);
        
        // Set default voice if not already selected
        if (!selectedVoice && englishVoices.length > 0) {
          const preferredVoice = englishVoices.find(voice => 
            voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Samantha')
          ) || englishVoices[0];
          setSelectedVoice(preferredVoice.name);
        }
      };
      
      // Voices might not be loaded immediately
      if (speechSynthRef.current.getVoices().length === 0) {
        speechSynthRef.current.addEventListener('voiceschanged', loadVoices);
      } else {
        loadVoices();
      }
    }
  }, [selectedVoice]);

  // AI Speech Functions
  const startAILesson = () => {
    console.log('Starting AI Lesson...', { activeMeeting, speechSynthRef: speechSynthRef.current });
    
    if (!activeMeeting?.agenda) {
      console.log('No active meeting or agenda');
      toast({
        title: "No Meeting Active",
        description: "Please start a meeting first to begin the AI lesson.",
        variant: "destructive",
      });
      return;
    }
    
    if (!speechSynthRef.current) {
      console.log('Speech synthesis not available');
      toast({
        title: "Audio Not Available",
        description: "Speech synthesis is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAISpeaking(true);
    
    toast({
      title: "AI Lesson Started! 🎤",
      description: "The AI tutor will now speak the lesson content.",
    });
    
    const lessonContent = generateLessonContent(activeMeeting);
    console.log('Generated lesson content:', lessonContent);
    
    // Split lesson into sections for progressive delivery
    const sections = lessonContent.split('\n\n').filter(section => section.trim());
    console.log('Lesson sections:', sections.length);
    
    let currentSpeakingState = true;
    
    const speakSections = async () => {
      for (let i = 0; i < sections.length && currentSpeakingState; i++) {
        console.log(`Speaking section ${i + 1}/${sections.length}`);
        
        setCurrentSpeechText(sections[i]);
        setCurrentSection(i);
        setMeetingProgress(((i + 1) / sections.length) * 100);
        
        // Use Web Speech API to speak the content
        await speakText(sections[i]);
        
        // Pause between sections
        if (currentSpeakingState) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('Finished speaking all sections');
      setIsAISpeaking(false);
      setCurrentSpeechText('');
      currentSpeakingState = false;
    };
    
    speakSections().catch(error => {
      console.error('Error in speech sections:', error);
      setIsAISpeaking(false);
      setCurrentSpeechText('');
    });
  };

  const stopAILesson = () => {
    setIsAISpeaking(false);
    setCurrentSpeechText('');
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!speechSynthRef.current) {
        console.log('No speech synthesis available');
        resolve();
        return;
      }

      console.log('Speaking text:', text.substring(0, 50) + '...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Use selected voice
      const voices = speechSynthRef.current.getVoices();
      const selectedVoiceObj = voices.find(voice => voice.name === selectedVoice);
      
      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj;
        console.log('Using selected voice:', selectedVoiceObj.name);
      } else {
        // Fallback to default English voice
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('Using fallback voice:', englishVoice.name);
        }
      }

      utterance.onstart = () => {
        console.log('Speech started');
      };

      utterance.onend = () => {
        console.log('Speech ended');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        resolve();
      };

      speechSynthRef.current.speak(utterance);
    });
  };

  const generateLessonContent = (meeting: Meeting): string => {
    return `Welcome to your AI learning session on ${meeting.topic}.

Introduction to ${meeting.topic}:
Today we will explore the fundamental concepts of ${meeting.topic} for ${meeting.subject} at Grade ${meeting.grade} level.

${meeting.agenda.map((item, index) => `
Section ${index + 1}: ${item}
Let's dive deep into this important concept. ${item} is a crucial topic that builds the foundation for understanding ${meeting.topic}.

Key points to remember about ${item}:
- This concept helps explain real-world phenomena
- It connects to other topics we've learned
- Practice problems will help reinforce understanding
`).join('\n')}

Summary:
We have covered the essential aspects of ${meeting.topic}. Remember to review the key concepts and practice the examples we discussed.

Thank you for joining this AI-powered learning session. Feel free to ask questions in the chat for clarification on any topic.`;
  };

  // Fetch meetings
  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings"],
    retry: false,
  });

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: { request: string }) => {
      const response = await apiRequest("POST", "/api/meetings/create", meetingData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Meeting Created! 🎓",
        description: `Your AI learning session on "${data.topic}" is ready to start.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create Jitsi meeting with AI bot
  const createJitsiMeetingMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", "/api/create-meeting", { topic });
      return response.json();
    },
    onSuccess: (data) => {
      setJitsiMeetingData(data);
      toast({
        title: "AI Lesson Created!",
        description: "Your AI bot is joining the room and will start the lesson shortly.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create Jitsi meeting. Please check if HF_TOKEN is configured.",
        variant: "destructive",
      });
    },
  });

  // Start meeting mutation
  const startMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const response = await apiRequest("POST", `/api/meetings/${meetingId}/start`);
      return response.json();
    },
    onSuccess: (data) => {
      setActiveMeeting(data.meeting);
      setIsInMeeting(true);
      setChatMessages(data.initialMessages || []);
      setMeetingProgress(0);
      setCurrentSection(0);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; meetingId: number }) => {
      const response = await apiRequest("POST", "/api/meetings/chat", messageData);
      return response.json();
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, ...data.messages]);
      setNewMessage('');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeMeeting) return;
    
    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user' as const,
      content: newMessage,
      timestamp: new Date().toISOString(),
      meetingId: activeMeeting.id,
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate({ 
      message: newMessage, 
      meetingId: activeMeeting.id 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const endMeeting = () => {
    setIsInMeeting(false);
    setActiveMeeting(null);
    setChatMessages([]);
    setMeetingProgress(0);
    setCurrentSection(0);
    queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
  };

  // Meeting progress simulation
  useEffect(() => {
    if (isInMeeting && activeMeeting) {
      const interval = setInterval(() => {
        setMeetingProgress(prev => {
          const newProgress = Math.min(prev + 0.5, 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            toast({
              title: "Meeting Complete! 🎉",
              description: "Great job! You've completed the learning session.",
            });
          }
          return newProgress;
        });
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isInMeeting, activeMeeting, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nexus-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI Meeting...</p>
        </div>
      </div>
    );
  }

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
              <Video className="w-8 h-8 mr-3" />
              AI Learning Meetings
            </h1>
          </div>
          {isInMeeting && (
            <Button 
              onClick={endMeeting}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              End Meeting
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {!isInMeeting ? (
          <>
            {/* Meeting Creation Panel */}
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create AI Learning Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      What would you like to learn? (Example: "Organize a meeting for the topic 'motion' for grade 9")
                    </label>
                    <Textarea
                      placeholder="Organize a meeting for the topic 'photosynthesis' for grade 8 biology..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          const target = e.target as HTMLTextAreaElement;
                          createMeetingMutation.mutate({ request: target.value });
                          target.value = '';
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                      if (textarea?.value.trim()) {
                        createMeetingMutation.mutate({ request: textarea.value });
                        textarea.value = '';
                      }
                    }}
                    disabled={createMeetingMutation.isPending}
                    className="bg-nexus-green hover:bg-green-600"
                  >
                    {createMeetingMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Creating Meeting...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Create AI Meeting
                      </>
                    )}
                  </Button>
                  <p className="text-slate-400 text-sm">
                    Tip: Press Ctrl+Enter to create quickly. The AI will automatically organize a structured learning session based on your request.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Lesson Panel - Jitsi Video Meetings */}
            <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-500/30 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Video className="w-5 h-5 mr-2 text-blue-400" />
                  AI Lesson Panel (Video Meetings)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Enter lesson topic (e.g., 'Photosynthesis', 'Quadratic Equations')"
                      value={lessonTopic}
                      onChange={(e) => setLessonTopic(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && lessonTopic.trim()) {
                          createJitsiMeetingMutation.mutate(lessonTopic);
                          setLessonTopic('');
                        }
                      }}
                    />
                  </div>
                  
                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voice-select" className="text-white font-medium">
                        AI Voice Selection
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                        className="text-blue-300 hover:text-white"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        {showVoiceSettings ? 'Hide' : 'Voice Settings'}
                      </Button>
                    </div>
                    
                    {showVoiceSettings && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                        <div className="space-y-3">
                          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Choose AI voice type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              {availableVoices.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name} className="text-white hover:bg-slate-600">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{voice.name}</span>
                                    <span className="text-xs text-slate-400">
                                      {voice.lang} • {voice.localService ? 'Local' : 'Network'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedVoice && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (window.speechSynthesis) {
                                    const testText = "Hello! This is how I will sound during the AI lesson. I'm your AI tutor and I'm excited to help you learn!";
                                    const utterance = new SpeechSynthesisUtterance(testText);
                                    const voice = availableVoices.find(v => v.name === selectedVoice);
                                    if (voice) {
                                      utterance.voice = voice;
                                      utterance.rate = 0.8;
                                      utterance.pitch = 1;
                                      utterance.volume = 1;
                                      window.speechSynthesis.speak(utterance);
                                    }
                                  }
                                }}
                                className="border-blue-500 text-blue-300 hover:bg-blue-500 hover:text-white"
                              >
                                <Volume2 className="w-4 h-4 mr-1" />
                                Test Voice
                              </Button>
                              <span className="text-xs text-slate-400">
                                Preview how the AI will sound during lessons
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => {
                      if (lessonTopic.trim()) {
                        createJitsiMeetingMutation.mutate(lessonTopic);
                        setLessonTopic('');
                      }
                    }}
                    disabled={createJitsiMeetingMutation.isPending || !lessonTopic.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 w-full"
                  >
                    {createJitsiMeetingMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Creating Video Lesson...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Create AI Video Lesson
                      </>
                    )}
                  </Button>
                  <div className="space-y-2">
                    <p className="text-blue-200 text-sm">
                      🤖 Creates a Jitsi room where an AI bot delivers a spoken lesson via text-to-speech.
                    </p>
                    <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/20">
                      <p className="text-blue-100 text-xs font-medium mb-1">🤖 AI Live Classroom Features:</p>
                      <ul className="text-blue-200 text-xs space-y-1">
                        <li>• AI bot joins Jitsi room with video presence</li>
                        <li>• Speaks lesson content using Web Speech API</li>
                        <li>• Responds to student questions in real-time</li>
                        <li>• Interactive Q&A session with AI tutor</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jitsi Meeting Result */}
            {jitsiMeetingData && (
              <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30 backdrop-blur-sm mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Sparkles className="w-5 h-5 mr-2 text-green-400" />
                    AI Video Lesson Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Lesson Outline:</h4>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{jitsiMeetingData.outline}</p>
                    </div>
                    
                    {/* AI Bot Features */}
                    {jitsiMeetingData.bot_features && (
                      <div className="bg-purple-950/30 p-4 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <Brain className="w-5 h-5 text-purple-300" />
                          <h4 className="text-purple-100 font-medium">AI Bot Capabilities</h4>
                        </div>
                        <ul className="text-purple-200 text-xs space-y-1">
                          {jitsiMeetingData.bot_features.map((feature: string, index: number) => (
                            <li key={index}>✅ {feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => window.open(jitsiMeetingData.url, '_blank')}
                        className="bg-green-500 hover:bg-green-600 flex-1"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Video Lesson
                      </Button>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(jitsiMeetingData.url);
                          toast({ title: "Link copied to clipboard!" });
                        }}
                        variant="outline"
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        Copy Link
                      </Button>
                    </div>
                    <div className="bg-green-900/30 p-3 rounded-lg border border-green-500/20">
                      <p className="text-green-100 text-xs font-medium mb-2">🎙️ AI Lesson Active:</p>
                      <ul className="text-green-200 text-xs space-y-1">
                        <li>✅ AI tutor is speaking the lesson (server-side TTS)</li>
                        <li>✅ Structured lesson content generated</li>
                        <li>✅ Jitsi room ready for student interaction</li>
                        <li>🎯 Click "Join Video Lesson" to see the lesson outline</li>
                      </ul>
                      <div className="mt-2 p-2 bg-green-800/20 rounded border border-green-600/30">
                        <p className="text-green-100 text-xs font-semibold">Audio Lesson Ready:</p>
                        <p className="text-green-200 text-xs">AI tutor has created an audio file you can play to hear the spoken lesson! Join the room for the complete experience.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meetings List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings?.map((meeting: Meeting) => (
                <Card key={meeting.id} className="bg-slate-800/50 border-slate-700 hover:border-nexus-green/30 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <span className="truncate">{meeting.topic}</span>
                      <Badge variant={
                        meeting.status === 'completed' ? 'secondary' : 
                        meeting.status === 'active' ? 'default' : 'outline'
                      }>
                        {meeting.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-slate-400 text-sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {meeting.subject} - Grade {meeting.grade}
                      </div>
                      <div className="flex items-center text-slate-400 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        {meeting.duration} minutes
                      </div>
                      <p className="text-slate-300 text-sm">{meeting.description}</p>
                      
                      {meeting.agenda && meeting.agenda.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white text-sm mb-2">Agenda:</h4>
                          <ul className="space-y-1">
                            {meeting.agenda.slice(0, 3).map((item, index) => (
                              <li key={index} className="text-slate-400 text-xs">
                                • {item}
                              </li>
                            ))}
                            {meeting.agenda.length > 3 && (
                              <li className="text-slate-400 text-xs">
                                • ... and {meeting.agenda.length - 3} more topics
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => startMeetingMutation.mutate(meeting.id)}
                        disabled={meeting.status === 'completed' || startMeetingMutation.isPending}
                        className="w-full bg-nexus-green hover:bg-green-600 mt-4"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {meeting.status === 'completed' ? 'Completed' : 'Start Learning'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {meetings?.length === 0 && (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Meetings Yet</h3>
                <p className="text-slate-400 mb-6">Create your first AI-powered learning session!</p>
              </div>
            )}
          </>
        ) : (
          /* Meeting Interface */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Meeting Area */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700 mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      {activeMeeting?.topic}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Live Session
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                        className={`${isMuted ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}`}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Session Progress</span>
                        <span className="text-white">{Math.round(meetingProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-nexus-green h-2 rounded-full transition-all duration-500"
                          style={{ width: `${meetingProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Video/Audio Interface */}
                    <div className="bg-slate-700/50 p-6 rounded-lg min-h-[400px]">
                      <div className="text-center">
                        <div className={`w-32 h-32 ${isAISpeaking ? 'bg-green-500/30 animate-pulse' : 'bg-nexus-green/20'} rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300`}>
                          <Brain className={`w-16 h-16 ${isAISpeaking ? 'text-green-400' : 'text-nexus-green'}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {isAISpeaking ? '🎤 AI Tutor Speaking...' : 'AI Tutor Ready'}
                        </h3>
                        <p className="text-slate-400 mb-4">
                          {isAISpeaking ? 'Delivering lesson content' : 'Learning session in progress...'}
                        </p>
                        <div className="space-y-2 text-sm text-slate-300 mb-6">
                          <p><strong>Subject:</strong> {activeMeeting?.subject}</p>
                          <p><strong>Grade Level:</strong> {activeMeeting?.grade}</p>
                          <p><strong>Duration:</strong> {activeMeeting?.duration} minutes</p>
                        </div>
                        
                        {/* AI Speech Controls */}
                        <div className="space-y-4">
                          <div className="flex justify-center gap-3">
                            <Button
                              onClick={startAILesson}
                              disabled={isAISpeaking}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Volume2 className="w-4 h-4 mr-2" />
                              {isAISpeaking ? 'Speaking...' : 'Start AI Lesson'}
                            </Button>
                            <Button
                              onClick={stopAILesson}
                              disabled={!isAISpeaking}
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                            >
                              <VolumeX className="w-4 h-4 mr-2" />
                              Stop
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                              className="border-blue-500 text-blue-300 hover:bg-blue-500 hover:text-white"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Voice
                            </Button>
                          </div>
                          
                          {/* In-Meeting Voice Settings */}
                          {showVoiceSettings && (
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-600 max-w-sm mx-auto">
                              <div className="space-y-3">
                                <Label className="text-white text-sm font-medium">AI Voice Selection</Label>
                                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                                    <SelectValue placeholder="Choose voice" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-700 border-slate-600">
                                    {availableVoices.map((voice) => (
                                      <SelectItem key={voice.name} value={voice.name} className="text-white hover:bg-slate-600">
                                        <div className="flex flex-col">
                                          <span className="text-sm">{voice.name}</span>
                                          <span className="text-xs text-slate-400">
                                            {voice.lang} • {voice.localService ? 'Local' : 'Network'}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedVoice && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (window.speechSynthesis) {
                                        const testText = "Hello! This is how I will sound during the lesson.";
                                        const utterance = new SpeechSynthesisUtterance(testText);
                                        const voice = availableVoices.find(v => v.name === selectedVoice);
                                        if (voice) {
                                          utterance.voice = voice;
                                          utterance.rate = 0.8;
                                          utterance.pitch = 1;
                                          utterance.volume = 1;
                                          window.speechSynthesis.speak(utterance);
                                        }
                                      }
                                    }}
                                    className="border-blue-500 text-blue-300 hover:bg-blue-500 hover:text-white w-full"
                                  >
                                    <Volume2 className="w-4 h-4 mr-1" />
                                    Test Voice
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Current Speech Section */}
                        {currentSpeechText && (
                          <div className="bg-slate-800/60 p-4 rounded-lg text-left">
                            <h4 className="text-green-400 font-medium mb-2">AI Tutor is saying:</h4>
                            <p className="text-slate-200 text-sm leading-relaxed">
                              {currentSpeechText}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Section */}
                    {activeMeeting?.agenda && activeMeeting.agenda.length > 0 && (
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Current Topic:</h4>
                        <p className="text-nexus-green">
                          {activeMeeting.agenda[currentSection] || activeMeeting.agenda[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    AI Assistant Chat
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="ml-auto"
                    >
                      {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-nexus-green text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-700 p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask for help or clarification..."
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-nexus-green hover:bg-green-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Ask questions anytime during the session for instant help!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}