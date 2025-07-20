import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from 'child_process';
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GoogleGenAI } from "@google/genai";
import { extractTextFromPDF, summarizeTextbook, searchTextbookContent } from "./services/pdfProcessor";
import { generateQuiz, generateAdaptiveQuiz, calculateQuizScore } from "./services/quizGenerator";
import { 
  generateImprovementSuggestions,
  parseMeetingRequest, 
  generateMeetingResponse, 
  generateInitialMeetingMessage 
} from "./gemini";

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

      console.log('Textbook upload attempt:', {
        userId,
        fileSize: file?.size,
        fileName: file?.originalname,
        subjectId
      });

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Save initial textbook record without extracted text first
      const textbook = await storage.createTextbook({
        userId,
        filename: `${Date.now()}_${file.originalname}`,
        originalName: file.originalname,
        subjectId: subjectId ? parseInt(subjectId) : null,
        extractedText: null, // Process separately to avoid timeout
      });

      console.log('Textbook saved to database:', textbook.id);

      // Process PDF in background (can take time)
      try {
        console.log('Starting PDF text extraction...');
        const extractedText = await extractTextFromPDF(file.buffer, file.originalname);
        console.log('PDF text extracted, length:', extractedText?.length);
        
        // Update textbook with extracted text
        const updatedTextbook = await storage.updateTextbook(textbook.id, {
          extractedText,
        });

        console.log('Textbook updated with extracted text');
        res.json(updatedTextbook);
      } catch (extractError) {
        console.error('PDF extraction error:', extractError);
        // Return textbook record even if extraction fails
        res.json({ 
          ...textbook, 
          extractionError: 'PDF text extraction failed, but file uploaded successfully'
        });
      }

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
      const { subject, difficulty = 'medium', numQuestions = 10, topic, grade, gradeName, questionType, marks } = req.body;

      const quiz = await generateQuiz(subject, difficulty, numQuestions, topic, {
        grade,
        gradeName,
        questionType,
        marks
      });

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

  // Enhanced quiz submission route
  app.post('/api/quizzes/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId, answers, timeSpent, questionType, subject, difficulty } = req.body;

      // For textbook-generated quizzes, quizId might be the quiz object directly
      let quizData;
      let actualQuizId = null;
      let quizSubject = subject || 'General';
      let quizDifficulty = difficulty || 'medium';
      let quizQuestionType = questionType || 'mcq';

      if (typeof quizId === 'object') {
        quizData = quizId;
        // Extract metadata from quiz object
        quizSubject = quizData.subject || subject || 'General';
        quizDifficulty = quizData.difficulty || difficulty || 'medium';
        quizQuestionType = quizData.questionType || questionType || 'mcq';
      } else {
        actualQuizId = quizId;
        const quiz = await storage.getQuiz(quizId);
        if (!quiz) {
          return res.status(404).json({ message: "Quiz not found" });
        }
        quizData = {
          questions: JSON.parse(quiz.questions),
          questionType: quiz.questionType || questionType
        };
        // Extract metadata from stored quiz
        quizSubject = quiz.title.split(' ')[0] || 'General';
        quizDifficulty = quiz.difficulty || 'medium';
        quizQuestionType = quiz.questionType || questionType || 'mcq';
      }

      const parsedQuestions = quizData.questions;
      let correct = 0;

      // Calculate score
      parsedQuestions.forEach((question: any, index: number) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctAnswer || question.modelAnswer;
        
        if (userAnswer && correctAnswer) {
          // Convert both to strings and normalize
          const userAnswerStr = String(userAnswer).toLowerCase().trim();
          const correctAnswerStr = String(correctAnswer).toLowerCase().trim();
          
          // For MCQ and assertion-reason, exact match
          if (quizQuestionType === 'mcq' || quizQuestionType === 'assertion-reason') {
            if (userAnswerStr === correctAnswerStr) {
              correct++;
            }
          }
          // For other types, flexible matching
          else {
            if (userAnswerStr.includes(correctAnswerStr) || 
                correctAnswerStr.includes(userAnswerStr)) {
              correct++;
            }
          }
        }
      });

      const score = Math.round((correct / parsedQuestions.length) * 100);
      const xpGained = Math.max(10, Math.round(score * 0.5 + (correct * 5)));
      const coinsGained = Math.max(1, Math.round(score / 20));

      // Always save quiz attempt with comprehensive data
      await storage.createQuizAttempt({
        userId,
        quizId: actualQuizId,
        subject: quizSubject,
        difficulty: quizDifficulty,
        questionType: quizQuestionType,
        questions: JSON.stringify(parsedQuestions),
        answers: JSON.stringify(answers),
        score: score.toString(),
        timeSpent: timeSpent || 0,
      });

      // Update user XP and coins
      const currentUser = await storage.getUser(userId);
      if (currentUser) {
        await storage.upsertUser({
          ...currentUser,
          xp: (currentUser.xp || 0) + xpGained,
          coins: (currentUser.coins || 0) + coinsGained,
        });
      }

      // Check for achievements
      const achievements = [];
      if (score === 100) {
        achievements.push({ name: "Perfect Score", description: "Got 100% on a quiz!" });
      }
      if (score >= 80) {
        achievements.push({ name: "High Achiever", description: "Scored 80% or higher!" });
      }
      if (correct >= 5) {
        achievements.push({ name: "Quiz Master", description: "Answered 5 or more questions correctly!" });
      }

      res.json({
        score,
        correct,
        incorrect: parsedQuestions.length - correct,
        total: parsedQuestions.length,
        xpGained,
        coinsGained,
        timeSpent: timeSpent || 0,
        achievements
      });
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

  // Quiz reflection endpoint - past results and improvement suggestions
  app.get('/api/user/reflection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all quiz attempts with detailed results
      const quizAttempts = await storage.getUserQuizAttempts(userId);
      
      if (quizAttempts.length === 0) {
        return res.json(null);
      }
      
      const recentAttempts = quizAttempts.slice(-10); // Last 10 attempts
      
      // Calculate performance patterns
      const subjectPerformance = {};
      const difficultyPerformance = {};
      const questionTypePerformance = {};
      let commonMistakes = [];
      
      for (const attempt of quizAttempts) {
        const score = parseFloat(attempt.score);
        const subject = attempt.subject || 'General';
        const difficulty = attempt.difficulty || 'medium';
        const questionType = attempt.questionType || 'mcq';
        
        // Track subject performance
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { total: 0, attempts: 0 };
        }
        subjectPerformance[subject].attempts++;
        subjectPerformance[subject].total += score;
        
        // Track difficulty performance
        if (!difficultyPerformance[difficulty]) {
          difficultyPerformance[difficulty] = { total: 0, attempts: 0 };
        }
        difficultyPerformance[difficulty].attempts++;
        difficultyPerformance[difficulty].total += score;
        
        // Track question type performance
        if (!questionTypePerformance[questionType]) {
          questionTypePerformance[questionType] = { total: 0, attempts: 0 };
        }
        questionTypePerformance[questionType].attempts++;
        questionTypePerformance[questionType].total += score;
        
        // Analyze answers for common mistakes (only recent attempts to avoid too much data)
        if (recentAttempts.includes(attempt) && attempt.answers && attempt.questions) {
          try {
            const answers = JSON.parse(attempt.answers);
            const questions = JSON.parse(attempt.questions);
            
            questions.forEach((question, index) => {
              const userAnswer = answers[index];
              const correctAnswer = question.correctAnswer || question.modelAnswer;
              
              if (userAnswer && correctAnswer && 
                  String(userAnswer).toLowerCase().trim() !== String(correctAnswer).toLowerCase().trim()) {
                commonMistakes.push({
                  subject,
                  difficulty,
                  questionType,
                  question: question.question.substring(0, 100),
                  userAnswer,
                  correctAnswer,
                  topic: question.topic || subject,
                  attemptId: attempt.id,
                  attemptDate: attempt.completedAt
                });
              }
            });
          } catch (parseError) {
            console.warn('Error parsing attempt data:', parseError);
          }
        }
      }
      
      // Generate improvement suggestions using AI
      const improvementSuggestions = await generateImprovementSuggestions(
        subjectPerformance,
        difficultyPerformance,
        commonMistakes.slice(-5) // Last 5 mistakes
      );
      
      res.json({
        recentAttempts: recentAttempts.map(attempt => ({
          ...attempt,
          completedAt: attempt.completedAt || new Date().toISOString()
        })),
        subjectPerformance,
        difficultyPerformance,
        questionTypePerformance,
        commonMistakes: commonMistakes.slice(-15), // Last 15 mistakes
        improvementSuggestions,
        totalAttempts: quizAttempts.length,
        averageScore: quizAttempts.length > 0 
          ? quizAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score), 0) / quizAttempts.length
          : 0
      });
    } catch (error) {
      console.error("Reflection data error:", error);
      res.status(500).json({ message: "Failed to fetch reflection data" });
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

  // Analytics endpoint
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analyticsService } = await import("./services/analyticsService");
      
      const analyticsData = await analyticsService.getAnalyticsData(userId);
      res.json(analyticsData);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
  });

  // AI Meeting routes
  app.get('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetings = await storage.getUserMeetings(userId);
      res.json(meetings);
    } catch (error) {
      console.error('Meetings fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  app.post('/api/meetings/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { request } = req.body;

      if (!request) {
        return res.status(400).json({ message: 'Meeting request is required' });
      }

      // Parse the meeting request using AI
      const meetingData = await parseMeetingRequest(request);
      
      // Create the meeting in database
      const meeting = await storage.createMeeting({
        userId,
        ...meetingData,
      });

      res.json(meeting);
    } catch (error) {
      console.error('Meeting creation error:', error);
      res.status(500).json({ message: 'Failed to create meeting' });
    }
  });

  app.post('/api/meetings/:meetingId/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingId = parseInt(req.params.meetingId);

      // Get the meeting
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting || meeting.userId !== userId) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      // Update meeting status to active
      const updatedMeeting = await storage.updateMeetingStatus(meetingId, 'active');

      // Generate initial welcome message
      const initialMessage = await generateInitialMeetingMessage({
        topic: meeting.topic,
        subject: meeting.subject,
        grade: meeting.grade,
        agenda: meeting.agenda,
      });

      // Save the initial message
      await storage.createMeetingMessage({
        meetingId,
        role: 'assistant',
        content: initialMessage,
      });

      // Get all messages for the meeting
      const messages = await storage.getMeetingMessages(meetingId);

      res.json({
        meeting: updatedMeeting,
        initialMessages: messages,
      });
    } catch (error) {
      console.error('Meeting start error:', error);
      res.status(500).json({ message: 'Failed to start meeting' });
    }
  });

  app.post('/api/meetings/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, meetingId } = req.body;

      if (!message || !meetingId) {
        return res.status(400).json({ message: 'Message and meetingId are required' });
      }

      // Verify meeting ownership
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting || meeting.userId !== userId) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      // Get previous messages for context
      const previousMessages = await storage.getMeetingMessages(meetingId);

      // Generate AI response
      const aiResponse = await generateMeetingResponse(message, {
        topic: meeting.topic,
        subject: meeting.subject,
        grade: meeting.grade,
        agenda: meeting.agenda,
        previousMessages: previousMessages.slice(-6), // Last 6 messages for context
      });

      // Save AI response
      const aiMessage = await storage.createMeetingMessage({
        meetingId,
        role: 'assistant',
        content: aiResponse,
      });

      res.json({
        messages: [aiMessage],
      });
    } catch (error) {
      console.error('Meeting chat error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // AI Lesson Panel - Create Jitsi meeting with AI bot
  app.post('/api/create-meeting', isAuthenticated, async (req: any, res) => {
    try {
      const { topic } = req.body;

      if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
      }

      // Check for HF_TOKEN
      const hfToken = process.env.HF_TOKEN || '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';
      if (!hfToken) {
        return res.status(500).json({ message: 'Hugging Face token not configured' });
      }

      console.log(`Creating AI lesson meeting for topic: ${topic}`);

      // Use Python subprocess to create the meeting
      const pythonProcess = spawn('python3', ['server/ai-lesson-bot.py', topic, hfToken]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            res.json(result);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ message: 'Failed to parse response' });
          }
        } else {
          console.error('Python process error:', errorOutput);
          res.status(500).json({ message: 'Failed to create meeting' });
        }
      });

      // Set timeout for the request
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ message: 'Request timeout' });
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({ message: 'Failed to create meeting' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
