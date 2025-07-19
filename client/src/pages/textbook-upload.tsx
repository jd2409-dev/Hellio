import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { BookOpen, Brain, Target, Lightbulb, MessageSquare, FileText } from "lucide-react";

export default function TextbookUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTextbook, setSelectedTextbook] = useState<any>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showExplainerDialog, setShowExplainerDialog] = useState(false);
  const [quizType, setQuizType] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [explainerContent, setExplainerContent] = useState('');
  const { toast } = useToast();

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: textbooks, refetch: refetchTextbooks } = useQuery({
    queryKey: ["/api/textbooks"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, subjectId }: { file: File; subjectId?: string }) => {
      const formData = new FormData();
      formData.append('textbook', file);
      if (subjectId) {
        formData.append('subjectId', subjectId);
      }

      const response = await fetch('/api/textbooks/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Textbook uploaded and processed successfully!",
      });
      setSelectedFile(null);
      setSelectedSubject('');
      refetchTextbooks();
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
        description: "Failed to upload textbook. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Quiz generation from textbook
  const generateQuizMutation = useMutation({
    mutationFn: async ({ textbookId, questionType, numQuestions = 10 }: { 
      textbookId: number; 
      questionType: string; 
      numQuestions?: number;
    }) => {
      const response = await apiRequest("POST", "/api/textbooks/generate-quiz", {
        textbookId,
        questionType,
        numQuestions,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data);
      toast({
        title: "Quiz Generated",
        description: `Generated ${data.questions?.length || 0} questions from your textbook!`,
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
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI explainer for textbook
  const explainTextbookMutation = useMutation({
    mutationFn: async ({ textbookId }: { textbookId: number }) => {
      const response = await apiRequest("POST", "/api/textbooks/explain", {
        textbookId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setExplainerContent(data.explanation);
      setShowExplainerDialog(true);
      toast({
        title: "Explanation Ready",
        description: "AI has simplified your textbook content!",
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
        description: "Failed to generate explanation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      subjectId: selectedSubject,
    });
  };

  return (
    <div className="min-h-screen bg-nexus-black text-white">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </Link>
            <h2 className="font-orbitron text-2xl font-bold text-nexus-green">Upload Textbook</h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <Card className="glass-effect neon-border mb-6">
              <CardHeader>
                <CardTitle className="text-center text-nexus-green">Upload Your Textbook</CardTitle>
                <p className="text-gray-400 text-center">Upload your textbook PDF for AI-powered analysis and search</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Image */}
                <div className="mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                    alt="Digital textbook upload interface" 
                    className="rounded-xl w-full h-48 object-cover"
                  />
                </div>

                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  accept=".pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Subject (Optional)</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-nexus-gray border-gray-600 focus:border-nexus-green">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-nexus-gray border-gray-600">
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <i className={`${subject.icon} text-sm`} style={{ color: subject.color }}></i>
                            <span>{subject.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full bg-nexus-green text-black hover:bg-nexus-gold"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Upload & Analyze'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* My Textbooks */}
          <div>
            <Card className="glass-effect neon-border">
              <CardHeader>
                <CardTitle className="text-nexus-gold">My Textbooks</CardTitle>
              </CardHeader>
              <CardContent>
                {textbooks && textbooks.length > 0 ? (
                  <div className="space-y-3">
                    {textbooks.map((textbook: any) => (
                      <div key={textbook.id} className="glass-effect p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                            <div>
                              <p className="font-medium">{textbook.originalName}</p>
                              <p className="text-sm text-gray-400">
                                Uploaded {new Date(textbook.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            {textbook.extractedText ? (
                              <>
                                <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                  Processed
                                </Badge>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTextbook(textbook);
                                      setShowQuizDialog(true);
                                    }}
                                    className="text-xs border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                                  >
                                    <Target className="w-3 h-3 mr-1" />
                                    Quiz
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedTextbook(textbook);
                                      explainTextbookMutation.mutate({ textbookId: textbook.id });
                                    }}
                                    disabled={explainTextbookMutation.isPending}
                                    className="text-xs border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                                  >
                                    <Brain className="w-3 h-3 mr-1" />
                                    {explainTextbookMutation.isPending ? 'Explaining...' : 'Explain'}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Badge className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                Processing...
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-upload text-4xl mb-4 opacity-50"></i>
                    <p>No textbooks uploaded yet.</p>
                    <p className="text-sm">Upload your first textbook to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">What You Can Do</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2">Smart Search</h4>
                <p className="text-gray-400">Search through your textbooks using natural language queries</p>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-gold to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-brain text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2">AI Analysis</h4>
                <p className="text-gray-400">Get AI-generated summaries and key concept extraction</p>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-nexus-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-question-circle text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2">Quiz Generation</h4>
                <p className="text-gray-400">Generate custom quizzes based on your textbook content</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quiz Generation Dialog */}
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent className="bg-black border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Generate Quiz from Textbook</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Select Question Type:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '2-marks', label: '2 Marks', desc: 'Short answer questions' },
                    { value: 'mcq', label: 'MCQ', desc: 'Multiple choice questions' },
                    { value: 'assertion-reason', label: 'Assertion-Reason', desc: 'Logic based questions' },
                    { value: '3-marks', label: '3 Marks', desc: 'Medium answer questions' },
                    { value: '5-marks', label: '5 Marks', desc: 'Long answer questions' },
                  ].map((type) => (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-all border ${
                        quizType === type.value 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                      }`}
                      onClick={() => setQuizType(type.value)}
                    >
                      <CardContent className="p-4">
                        <h5 className="font-semibold text-white">{type.label}</h5>
                        <p className="text-xs text-slate-400">{type.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {generatedQuiz ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-emerald-400">Generated Quiz: {generatedQuiz.title}</h4>
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {generatedQuiz.questions?.map((question: any, index: number) => (
                      <Card key={index} className="bg-slate-800 border-slate-600">
                        <CardContent className="p-4">
                          <h6 className="font-medium mb-2 text-white">
                            {index + 1}. {question.question || question.assertion}
                          </h6>
                          {question.options ? (
                            <div className="space-y-1 text-sm">
                              {question.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="text-slate-300">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                          ) : question.modelAnswer ? (
                            <div className="text-sm text-slate-300">
                              <strong>Model Answer:</strong> {question.modelAnswer}
                            </div>
                          ) : null}
                          {question.reason && (
                            <div className="text-sm text-slate-400 mt-2">
                              <strong>Reason:</strong> {question.reason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      if (!quizType) {
                        toast({
                          title: "Error",
                          description: "Please select a question type",
                          variant: "destructive",
                        });
                        return;
                      }
                      generateQuizMutation.mutate({
                        textbookId: selectedTextbook?.id,
                        questionType: quizType,
                        numQuestions: 10,
                      });
                    }}
                    disabled={generateQuizMutation.isPending || !quizType}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  >
                    {generateQuizMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Explainer Dialog */}
        <Dialog open={showExplainerDialog} onOpenChange={setShowExplainerDialog}>
          <DialogContent className="bg-black border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Textbook Explanation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                    {explainerContent}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExplainerDialog(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(explainerContent);
                    toast({
                      title: "Copied!",
                      description: "Explanation copied to clipboard",
                    });
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Copy Text
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
