import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Video, Mic, FileText, Play, Pause, Square, Clock, Calendar, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type TimeCapsule = {
  id: number;
  title: string;
  concept: string;
  description: string;
  recordingType: 'video' | 'audio' | 'text';
  recordingUrl?: string;
  transcript?: string;
  reflectionPeriod: number;
  reflectionDate: string;
  status: 'active' | 'reflected' | 'archived';
  reflectedAt?: string;
  reflectionNotes?: string;
  currentUnderstanding?: string;
  growthInsights?: string;
  createdAt: string;
  subjectId?: number;
};

type Subject = {
  id: number;
  name: string;
  color: string;
};

export default function TimeCapsule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for creating new time capsules
  const [title, setTitle] = useState("");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | 'text'>('text');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [reflectionPeriod, setReflectionPeriod] = useState(90);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showReflectionModal, setShowReflectionModal] = useState<TimeCapsule | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reflection form states
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [currentUnderstanding, setCurrentUnderstanding] = useState("");
  const [growthInsights, setGrowthInsights] = useState("");

  // Fetch time capsules
  const { data: timeCapsules = [], isLoading: isLoadingCapsules } = useQuery<TimeCapsule[]>({
    queryKey: ['/api/time-capsules'],
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Create time capsule mutation
  const createTimeCapsuleMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/time-capsules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-capsules'] });
      toast({
        title: "Time Capsule Created!",
        description: "Your concept has been recorded for future reflection.",
      });
      resetForm();
    },
  });

  // Reflect on time capsule mutation
  const reflectMutation = useMutation({
    mutationFn: async ({ id, reflectionData }: { id: number; reflectionData: any }) =>
      apiRequest('POST', `/api/time-capsules/${id}/reflect`, reflectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-capsules'] });
      toast({
        title: "Reflection Saved!",
        description: "Your growth insights have been recorded.",
      });
      setShowReflectionModal(null);
    },
  });

  const resetForm = () => {
    setTitle("");
    setConcept("");
    setDescription("");
    setRecordingType('text');
    setSelectedSubject(null);
    setReflectionPeriod(90);
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      let stream: MediaStream;
      
      if (recordingType === 'video') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: true 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else if (recordingType === 'audio') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        return; // Text mode doesn't need recording
      }

      const recorder = new MediaRecorder(stream!);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: recordingType === 'video' ? 'video/webm' : 'audio/webm'
        });
        setRecordedBlob(blob);
        
        // Stop all tracks to release camera/microphone
        stream!.getTracks().forEach(track => track.stop());
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Failed to access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!title || !concept) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and concept explanation.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll store text-based time capsules
    // In a production app, you'd upload the blob to cloud storage
    const timeCapsuleData = {
      title,
      concept,
      description,
      recordingType,
      subjectId: selectedSubject,
      reflectionPeriod,
      transcript: recordingType === 'text' ? concept : '',
      recordingUrl: recordedBlob ? 'blob://' + URL.createObjectURL(recordedBlob) : null,
    };

    createTimeCapsuleMutation.mutate(timeCapsuleData);
  };

  const handleReflect = (timeCapsule: TimeCapsule) => {
    setShowReflectionModal(timeCapsule);
    setReflectionNotes(timeCapsule.reflectionNotes || "");
    setCurrentUnderstanding(timeCapsule.currentUnderstanding || "");
    setGrowthInsights(timeCapsule.growthInsights || "");
  };

  const submitReflection = () => {
    if (!showReflectionModal) return;

    reflectMutation.mutate({
      id: showReflectionModal.id,
      reflectionData: {
        reflectionNotes,
        currentUnderstanding,
        growthInsights,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'reflected': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isReflectionDue = (reflectionDate: string) => {
    return new Date(reflectionDate) <= new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="default" size="sm" className="bg-nexus-green hover:bg-nexus-green/90 text-white font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Time Capsule Mode</h1>
              <p className="text-slate-400">Record concepts for your future self to reflect on</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Create New Time Capsule */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-nexus-green" />
              Create New Time Capsule
            </CardTitle>
            <CardDescription className="text-slate-400">
              Record your current understanding of a concept to reflect on later
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., My understanding of Quantum Physics"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="subject" className="text-white">Subject (Optional)</Label>
                <Select value={selectedSubject?.toString() || ""} onValueChange={(value) => setSelectedSubject(parseInt(value))}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="concept" className="text-white">Concept Explanation</Label>
              <Textarea
                id="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Explain the concept in your own words..."
                className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Additional Notes (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional context or questions..."
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Recording Type</Label>
                <Select value={recordingType} onValueChange={(value: 'video' | 'audio' | 'text') => setRecordingType(value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Text Only
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Audio Recording
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video Recording
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reflectionPeriod" className="text-white">Reflection Period (Days)</Label>
                <Input
                  id="reflectionPeriod"
                  type="number"
                  value={reflectionPeriod}
                  onChange={(e) => setReflectionPeriod(parseInt(e.target.value) || 90)}
                  min="1"
                  max="365"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Recording Interface */}
            {recordingType !== 'text' && (
              <Card className="bg-slate-700/30 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    {recordingType === 'video' && (
                      <video
                        ref={videoRef}
                        className="w-full max-w-md mx-auto rounded-lg bg-slate-800"
                        muted
                        autoPlay
                      />
                    )}
                    
                    {recordingType === 'audio' && isRecording && (
                      <div className="text-2xl text-nexus-green">
                        🎤 Recording... {formatTime(recordingTime)}
                      </div>
                    )}

                    {recordedBlob && (
                      <div className="space-y-2">
                        <p className="text-green-400">✅ Recording completed!</p>
                        {recordingType === 'video' && (
                          <video
                            src={URL.createObjectURL(recordedBlob)}
                            controls
                            className="w-full max-w-md mx-auto rounded-lg"
                          />
                        )}
                        {recordingType === 'audio' && (
                          <audio
                            src={URL.createObjectURL(recordedBlob)}
                            controls
                            className="w-full max-w-md mx-auto"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 justify-center">
                      {!isRecording && !recordedBlob && (
                        <Button
                          onClick={startRecording}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          {recordingType === 'video' ? <Video className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                          Start Recording
                        </Button>
                      )}
                      
                      {isRecording && (
                        <>
                          <Button
                            onClick={stopRecording}
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Stop ({formatTime(recordingTime)})
                          </Button>
                        </>
                      )}
                      
                      {recordedBlob && (
                        <Button
                          onClick={() => {
                            setRecordedBlob(null);
                            setRecordingTime(0);
                          }}
                          variant="outline"
                          className="border-slate-600 text-white hover:bg-slate-700"
                        >
                          Record Again
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={createTimeCapsuleMutation.isPending}
              className="w-full bg-nexus-green hover:bg-green-600 text-white"
            >
              {createTimeCapsuleMutation.isPending ? 'Creating...' : 'Create Time Capsule'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Time Capsules */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-nexus-green" />
              Your Time Capsules
            </CardTitle>
            <CardDescription className="text-slate-400">
              Track your learning journey and reflections over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCapsules ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading time capsules...</p>
              </div>
            ) : (timeCapsules as TimeCapsule[]).length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">No time capsules yet</p>
                <p className="text-slate-500">Create your first time capsule to start tracking your learning journey!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {(timeCapsules as TimeCapsule[]).map((capsule: TimeCapsule) => (
                  <Card key={capsule.id} className="bg-slate-700/30 border-slate-600/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{capsule.title}</h3>
                          <p className="text-slate-400 text-sm">
                            Created: {new Date(capsule.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`${getStatusColor(capsule.status)} text-white`}>
                            {capsule.status}
                          </Badge>
                          {isReflectionDue(capsule.reflectionDate) && capsule.status === 'active' && (
                            <Badge className="bg-yellow-500 text-black">Due for Reflection!</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 mb-3 line-clamp-2">{capsule.concept}</p>
                      
                      <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                        <span>Type: {capsule.recordingType}</span>
                        <span>Reflect by: {new Date(capsule.reflectionDate).toLocaleDateString()}</span>
                      </div>

                      {capsule.status === 'active' && isReflectionDue(capsule.reflectionDate) && (
                        <Button
                          onClick={() => handleReflect(capsule)}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                        >
                          Reflect on This Capsule
                        </Button>
                      )}

                      {capsule.status === 'reflected' && (
                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-green-400 text-sm">
                            ✅ Reflected on {new Date(capsule.reflectedAt!).toLocaleDateString()}
                          </p>
                          {capsule.growthInsights && (
                            <p className="text-slate-300 text-sm mt-2">
                              <strong>Growth Insight:</strong> {capsule.growthInsights}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground">
          Created by JD Vinod
        </footer>
      </div>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Reflect on: {showReflectionModal.title}</CardTitle>
              <CardDescription className="text-slate-400">
                How has your understanding evolved since you created this time capsule?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-white font-medium mb-2">Your Original Explanation:</h4>
                <p className="text-slate-300">{showReflectionModal.concept}</p>
                <p className="text-slate-400 text-sm mt-2">
                  Created: {new Date(showReflectionModal.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <Label htmlFor="reflectionNotes" className="text-white">Reflection Notes</Label>
                <Textarea
                  id="reflectionNotes"
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="What are your thoughts looking back at this explanation?"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="currentUnderstanding" className="text-white">Current Understanding</Label>
                <Textarea
                  id="currentUnderstanding"
                  value={currentUnderstanding}
                  onChange={(e) => setCurrentUnderstanding(e.target.value)}
                  placeholder="How would you explain this concept now?"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="growthInsights" className="text-white">Growth Insights</Label>
                <Textarea
                  id="growthInsights"
                  value={growthInsights}
                  onChange={(e) => setGrowthInsights(e.target.value)}
                  placeholder="What have you learned about your learning process?"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowReflectionModal(null)}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReflection}
                  disabled={reflectMutation.isPending}
                  className="bg-nexus-green hover:bg-green-600 text-white"
                >
                  {reflectMutation.isPending ? 'Saving...' : 'Save Reflection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}