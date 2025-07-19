import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GoogleGenAI } from "@google/genai";
import { extractTextFromPDF, summarizeTextbook, searchTextbookContent } from "./services/pdfProcessor";
import { generateQuiz, generateAdaptiveQuiz, calculateQuizScore } from "./services/quizGenerator";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Award "First Steps" achievement to new users
      if (user && !user.xp) {
        const achievements = await storage.getAchievements();
        const firstStepsAchievement = achievements.find(a => a.name === 'First Steps');
        if (firstStepsAchievement) {
          const userAchievements = await storage.getUserAchievements(userId);
          const hasFirstSteps = userAchievements.some(ua => ua.achievementId === firstStepsAchievement.id);
          if (!hasFirstSteps) {
            await storage.unlockAchievement(userId, firstStepsAchievement.id);
            // Award initial XP and coins
            await storage.upsertUser({
              ...user,
              xp: 100,
              coins: 50,
              level: 1,
            });
          }
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize default subjects
  app.post('/api/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const defaultSubjects = [
        { name: 'Mathematics', description: 'Algebra, Calculus, Geometry', icon: 'fas fa-calculator', color: '#3B82F6' },
        { name: 'Physics', description: 'Mechanics, Waves, Quantum', icon: 'fas fa-atom', color: '#EF4444' },
        { name: 'Chemistry', description: 'Organic, Inorganic, Physical', icon: 'fas fa-flask', color: '#10B981' },
        { name: 'Biology', description: 'Cell Biology, Genetics, Ecology', icon: 'fas fa-dna', color: '#8B5CF6' },
        { name: 'English', description: 'Literature, Grammar, Writing', icon: 'fas fa-book', color: '#F59E0B' },
        { name: 'History', description: 'World History, Ancient Civilizations', icon: 'fas fa-landmark', color: '#6B7280' },
      ];

      const subjects = await storage.getSubjects();
      if (subjects.length === 0) {
        for (const subject of defaultSubjects) {
          await storage.createSubject(subject);
        }
      }

      res.json({ message: 'Initialization complete' });
    } catch (error) {
      console.error("Initialization error:", error);
      res.status(500).json({ message: "Failed to initialize" });
    }
  });

  // Subject routes
  app.get('/api/subjects', isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get('/api/user-subjects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userSubjects = await storage.getUserSubjects(userId);
      res.json(userSubjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user subjects" });
    }
  });

  // AI Tutor routes
  app.post('/api/ai-chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, history } = req.body;

      // Get or create chat session
      let chatSession = await storage.getChatSession(userId);
      const messages: any[] = (chatSession?.messages as any[]) || [];

      // Add user message
      messages.push({ role: 'user', content: message, timestamp: new Date() });

      // Generate AI response
      const systemPrompt = `You are an AI tutor for NexusLearn AI, a gamified learning platform. 
      Help students understand concepts across all subjects. Be encouraging, clear, and educational.
      If asked about topics outside academics, politely redirect to educational content.`;

      const conversationHistory = messages.slice(-6).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
      });

      const aiResponse = response.text || "I'm here to help with your studies!";

      // Add AI response
      messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });

      // Update chat session
      await storage.updateChatSession(userId, messages);

      res.json({ response: aiResponse, messages });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Textbook upload routes
  app.post('/api/textbooks/upload', isAuthenticated, upload.single('textbook'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { subjectId } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file.buffer, file.originalname);

      // Save textbook record
      const textbook = await storage.createTextbook({
        userId,
        filename: `${Date.now()}_${file.originalname}`,
        originalName: file.originalname,
        subjectId: subjectId ? parseInt(subjectId) : null,
        extractedText,
      });

      res.json(textbook);
    } catch (error) {
      console.error("Textbook upload error:", error);
      res.status(500).json({ message: "Failed to upload textbook" });
    }
  });

  // Generate quiz from textbook
  app.post('/api/textbooks/generate-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { textbookId, questionType, numQuestions = 10 } = req.body;

      const textbook = await storage.getTextbook(textbookId);
      if (!textbook || textbook.userId !== userId) {
        return res.status(404).json({ message: "Textbook not found" });
      }

      if (!textbook.extractedText) {
        return res.status(400).json({ message: "Textbook content not processed yet" });
      }

      const { generateTextbookQuiz } = await import('./services/textbookExplainer');
      const quiz = await generateTextbookQuiz(
        textbook.extractedText, 
        questionType, 
        numQuestions
      );

      res.json(quiz);
    } catch (error) {
      console.error("Textbook quiz generation error:", error);
      res.status(500).json({ message: "Failed to generate quiz from textbook" });
    }
  });

  // AI explainer for textbook
  app.post('/api/textbooks/explain', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { textbookId } = req.body;

      const textbook = await storage.getTextbook(textbookId);
      if (!textbook || textbook.userId !== userId) {
        return res.status(404).json({ message: "Textbook not found" });
      }

      if (!textbook.extractedText) {
        return res.status(400).json({ message: "Textbook content not processed yet" });
      }

      const { explainTextbook } = await import('./services/textbookExplainer');
      const explanation = await explainTextbook(textbook.extractedText);

      res.json({ explanation });
    } catch (error) {
      console.error("Textbook explanation error:", error);
      res.status(500).json({ message: "Failed to generate explanation for textbook" });
    }
  });

  app.get('/api/textbooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const textbooks = await storage.getUserTextbooks(userId);
      res.json(textbooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch textbooks" });
    }
  });

  app.post('/api/textbooks/:id/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { query } = req.body;

      const textbook = await storage.getTextbook(parseInt(id));
      if (!textbook || textbook.userId !== userId) {
        return res.status(404).json({ message: "Textbook not found" });
      }

      if (!textbook.extractedText) {
        return res.status(400).json({ message: "Textbook content not processed yet" });
      }

      const searchResult = await searchTextbookContent(textbook.extractedText, query);
      res.json({ result: searchResult });
    } catch (error) {
      console.error("Textbook search error:", error);
      res.status(500).json({ message: "Failed to search textbook" });
    }
  });

  // Quiz routes
  app.post('/api/quizzes/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subject, difficulty = 'medium', numQuestions = 10, topic } = req.body;

      const quiz = await generateQuiz(subject, difficulty, numQuestions, topic);

      // Save quiz to database
      const savedQuiz = await storage.createQuiz({
        userId,
        subjectId: 1, // Default subject for now
        title: quiz.title,
        questions: quiz.questions,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.totalQuestions,
      });

      res.json({ quiz: savedQuiz, generatedQuiz: quiz });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  app.post('/api/quizzes/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { answers } = req.body;

      const quiz = await storage.getQuiz(parseInt(id));
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const result = calculateQuizScore(answers, {
        title: quiz.title,
        questions: quiz.questions as any,
        difficulty: quiz.difficulty || 'medium',
        totalQuestions: quiz.totalQuestions,
      });

      // Save quiz attempt
      await storage.createQuizAttempt({
        userId,
        quizId: parseInt(id),
        answers,
        score: result.score.toString(),
      });

      // Update user XP and coins based on performance
      const user = await storage.getUser(userId);
      if (user) {
        const xpGain = Math.floor(result.score * 2); // 2 XP per percentage point
        const coinGain = result.score >= 80 ? 50 : result.score >= 60 ? 25 : 10;

        await storage.upsertUser({
          ...user,
          xp: (user.xp || 0) + xpGain,
          coins: (user.coins || 0) + coinGain,
          level: Math.floor(((user.xp || 0) + xpGain) / 1000) + 1,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Quiz submission error:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  app.get('/api/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subjectId } = req.query;
      
      const quizzes = await storage.getUserQuizzes(userId, subjectId ? parseInt(subjectId) : undefined);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // User stats routes
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      const achievements = await storage.getUserAchievements(userId);
      const quizAttempts = await storage.getUserQuizAttempts(userId);
      
      const stats = {
        xp: user?.xp || 0,
        coins: user?.coins || 0,
        level: user?.level || 1,
        studyStreak: user?.studyStreak || 0,
        totalAchievements: achievements.length,
        averageQuizScore: quizAttempts.length > 0 
          ? quizAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score), 0) / quizAttempts.length
          : 0,
        totalQuizzes: quizAttempts.length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // User achievements endpoint
  app.get('/api/user/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAchievements = await storage.getUserAchievements(userId);
      const allAchievements = await storage.getAchievements();
      
      // Add earned status to achievements
      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement,
        earned: userAchievements.some(ua => ua.achievementId === achievement.id),
        unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null,
      }));

      res.json(achievementsWithStatus);
    } catch (error) {
      console.error("User achievements error:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
