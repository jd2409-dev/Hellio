import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Save, 
  Share2, 
  Heart, 
  Eye,
  BookOpen,
  Wand2,
  Download,
  Copy,
  Star,
  Film,
  Lightbulb,
  Palette,
  Volume2,
  Image
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StoryScene {
  scene_number: number;
  visual_description: string;
  narration: string;
  caption: string;
}

interface StoryCreation {
  id: number;
  title: string;
  concept: string;
  scenes: StoryScene[];
  difficulty?: string;
  subject?: string;
  tags: string[];
  isPublic: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Story Generator Component
const StoryGenerator = ({ onStoryGenerated }: { onStoryGenerated: (story: any) => void }) => {
  const { toast } = useToast();
  const [concept, setConcept] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [enhancedMode, setEnhancedMode] = useState(false);

  const generateStoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/stories/generate', {
      method: 'POST',
      body: data,
    }),
    onSuccess: (response) => {
      onStoryGenerated(response);
      toast({
        title: "Story Generated!",
        description: "Your educational story has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate story",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!concept.trim()) {
      toast({
        title: "Concept Required",
        description: "Please enter a concept or story idea to generate from.",
        variant: "destructive",
      });
      return;
    }

    generateStoryMutation.mutate({
      concept: concept.trim(),
      subject: subject || undefined,
      difficulty: difficulty || undefined,
      enhanced: enhancedMode,
    });
  };

  const exampleConcepts = [
    "A robot and a butterfly explore a neon forest filled with bioluminescent data trees to understand photosynthesis",
    "Time-traveling students visit ancient civilizations to learn about different mathematical systems",
    "A young scientist shrinks down to explore the human body and understand how the immune system works",
    "Alien visitors arrive on Earth to learn about renewable energy sources from human technology",
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-nexus-green" />
            AI Story Generator
          </CardTitle>
          <CardDescription className="text-slate-400">
            Transform any concept into an engaging 4-scene educational story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="concept" className="text-white">Your Concept or Story Idea</Label>
            <Textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe your educational concept, story idea, or topic you want to explore..."
              className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
            />
            <p className="text-sm text-slate-400 mt-2">
              Tip: Be specific about what you want to teach or explore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject" className="text-white">Subject (Optional)</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty (Optional)</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Choose difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  <SelectItem value="easy">Easy (Elementary)</SelectItem>
                  <SelectItem value="medium">Medium (Middle School)</SelectItem>
                  <SelectItem value="hard">Hard (High School+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Mode Toggle */}
          <Card className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Enhanced Multimedia Mode</Label>
                  <p className="text-sm text-slate-400 mt-1">
                    Generate images, audio narration, and video content (takes longer)
                  </p>
                </div>
                <button
                  onClick={() => setEnhancedMode(!enhancedMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enhancedMode ? 'bg-nexus-green' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enhancedMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={generateStoryMutation.isPending}
            className="w-full bg-gradient-to-r from-nexus-green to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            {generateStoryMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Generating Story...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Educational Story
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Example Concepts */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Example Concepts
          </CardTitle>
          <CardDescription className="text-slate-400">
            Click any example to use it as inspiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {exampleConcepts.map((example, index) => (
              <button
                key={index}
                onClick={() => setConcept(example)}
                className="text-left p-3 bg-slate-700/30 hover:bg-slate-600/30 rounded-lg border border-slate-600/50 hover:border-nexus-green/30 transition-all duration-200"
              >
                <p className="text-slate-300 text-sm">{example}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Story Viewer Component
const StoryViewer = ({ story, onSave, onEdit }: { 
  story: any; 
  onSave?: (storyData: any) => void;
  onEdit?: () => void;
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(story.suggestedTitle || "");
  const [isPublic, setIsPublic] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);

  const scenes: StoryScene[] = story.scenes || [];

  const nextScene = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
    }
  };

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your story",
        variant: "destructive",
      });
      return;
    }

    const storyData = {
      title: title.trim(),
      concept: story.concept,
      scenes: story.scenes,
      difficulty: story.difficulty,
      subject: story.subject,
      tags: [story.subject, story.difficulty].filter(Boolean),
      isPublic,
    };

    onSave?.(storyData);
  };

  const downloadStory = () => {
    const storyData = {
      title,
      concept: story.concept,
      scenes: story.scenes,
      subject: story.subject,
      difficulty: story.difficulty,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(storyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_story.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Story Downloaded!",
      description: "Your story has been saved as a JSON file",
    });
  };

  if (!scenes.length) {
    return null;
  }

  const currentSceneData = scenes[currentScene];

  return (
    <div className="space-y-6">
      {/* Story Header */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter story title..."
                className="bg-slate-700/50 border-slate-600 text-white text-xl font-bold mb-2"
              />
              <p className="text-slate-400">{story.concept}</p>
              <div className="flex gap-2 mt-2">
                {story.subject && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {story.subject}
                  </Badge>
                )}
                {story.difficulty && (
                  <Badge className={`${
                    story.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    story.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {story.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Scene {currentScene + 1} of {scenes.length}</span>
              <div className="flex gap-1">
                {scenes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScene(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentScene ? 'bg-nexus-green' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={prevScene}
                disabled={currentScene === 0}
                variant="outline"
                size="sm"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Previous
              </Button>
              <Button
                onClick={nextScene}
                disabled={currentScene === scenes.length - 1}
                variant="outline"
                size="sm"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scene Viewer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Film className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Scene {currentSceneData.scene_number}</h2>
              </div>

              <div className="space-y-6">
                {/* Visual Description */}
                <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Visual Scene</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {currentSceneData.visual_description}
                  </p>
                </div>

                {/* Narration */}
                <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Narration</h3>
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed italic">
                    "{currentSceneData.narration}"
                  </p>
                </div>

                {/* Educational Caption */}
                <div className="bg-gradient-to-r from-nexus-green/20 to-blue-500/20 rounded-lg p-6 border border-nexus-green/30">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-nexus-green" />
                    <h3 className="text-lg font-semibold text-white">Key Learning</h3>
                  </div>
                  <p className="text-nexus-green text-lg font-medium">
                    {currentSceneData.caption}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Save Options */}
      {onSave && (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Save Your Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-slate-600"
              />
              <Label htmlFor="isPublic" className="text-white">
                Make this story public for others to see and like
              </Label>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-nexus-green hover:bg-green-600 text-white flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Story
              </Button>
              <Button
                onClick={downloadStory}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={onEdit}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Story Library Component
const StoryLibrary = () => {
  const { toast } = useToast();

  // Fetch user's stories
  const { data: myStories = [], isLoading: loadingMyStories } = useQuery({
    queryKey: ['/api/stories/my-stories'],
  });

  // Fetch public stories
  const { data: publicStories = [], isLoading: loadingPublicStories } = useQuery({
    queryKey: ['/api/stories/public'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loadingMyStories || loadingPublicStories) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-nexus-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading stories...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="my-stories" className="space-y-6">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="my-stories" className="data-[state=active]:bg-nexus-green">
          My Stories ({Array.isArray(myStories) ? myStories.length : 0})
        </TabsTrigger>
        <TabsTrigger value="public" className="data-[state=active]:bg-nexus-green">
          Community Stories
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-stories" className="space-y-6">
        <div className="grid gap-6">
          {Array.isArray(myStories) && myStories.map((story: StoryCreation) => (
            <Card key={story.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{story.title}</h3>
                    <p className="text-slate-400 mb-2">{story.concept}</p>
                    <p className="text-sm text-slate-500">Created on {formatDate(story.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {story.subject && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {story.subject}
                      </Badge>
                    )}
                    {story.difficulty && (
                      <Badge className={`${
                        story.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        story.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {story.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{Array.isArray(story.scenes) ? story.scenes.length : 0} scenes</span>
                    {story.isPublic && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {story.likesCount || 0}
                        </div>
                        <span>•</span>
                        <span className="text-nexus-green">Public</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!Array.isArray(myStories) || myStories.length === 0) && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No stories created yet</p>
              <p className="text-slate-500">Start by generating your first educational story!</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="public" className="space-y-6">
        <div className="grid gap-6">
          {Array.isArray(publicStories) && publicStories.map((story: StoryCreation) => (
            <Card key={story.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{story.title}</h3>
                    <p className="text-slate-400 mb-2">{story.concept}</p>
                    <p className="text-sm text-slate-500">Created on {formatDate(story.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {story.subject && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {story.subject}
                      </Badge>
                    )}
                    {story.difficulty && (
                      <Badge className={`${
                        story.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        story.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {story.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{Array.isArray(story.scenes) ? story.scenes.length : 0} scenes</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {story.likesCount || 0}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <Heart className="w-4 h-4 mr-1" />
                      Like
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!Array.isArray(publicStories) || publicStories.length === 0) && (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No public stories yet</p>
              <p className="text-slate-500">Be the first to share a story with the community!</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

// Main Component
export default function Storytelling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedStory, setGeneratedStory] = useState<any>(null);

  const saveStoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/stories', {
      method: 'POST',
      body: data,
    }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/my-stories'] });
      setActiveTab("library");
      setGeneratedStory(null);
      toast({
        title: "Story Saved!",
        description: `You earned ${response.xpEarned} XP and ${response.coinsEarned} coins!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save story",
        variant: "destructive",
      });
    }
  });

  const handleStoryGenerated = (story: any) => {
    setGeneratedStory(story);
  };

  const handleSaveStory = (storyData: any) => {
    saveStoryMutation.mutate(storyData);
  };

  const handleEditStory = () => {
    setActiveTab("generate");
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
              <h1 className="text-2xl font-bold text-white">AI Storytelling Assistant</h1>
              <p className="text-slate-400">Transform any concept into engaging educational stories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="generate" className="data-[state=active]:bg-nexus-green">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Story
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-nexus-green">
              <BookOpen className="w-4 h-4 mr-2" />
              Story Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-8">
            {!generatedStory ? (
              <StoryGenerator onStoryGenerated={handleStoryGenerated} />
            ) : (
              <StoryViewer 
                story={generatedStory} 
                onSave={handleSaveStory}
                onEdit={handleEditStory}
              />
            )}
          </TabsContent>

          <TabsContent value="library">
            <StoryLibrary />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground mt-12">
          Created by JD Vinod
        </footer>
      </div>
    </div>
  );
}