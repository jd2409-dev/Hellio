import { Request, Response } from "express";
import { createServer, Server } from "http";
import { spawn } from 'child_process';
import { insertPomodoroSessionSchema, insertTimeCapsuleSchema } from "@shared/schema";
import express from "express";
// User type for authentication
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  user_metadata?: any
}

export type RequestWithUser = Request & { user: User };
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

import { GoogleGenAI } from "@google/genai";
import { extractTextFromPDF, searchTextbookContent } from "./services/pdfProcessor";
import { generateQuiz, calculateQuizScore } from "./services/quizGenerator";
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

export async function registerRoutes(app: express.Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      if (!user) return res.status(404).json({ message: "User not found" });

      const userId = user.id;
      let dbUser = await storage.getUser(userId);

      if (!dbUser) {
        // Create a default user if not found in storage
        dbUser = {
          id: userId,
          email: user.email,
          firstName: user.firstName || 'Guest',
          lastName: user.lastName || 'User',
          profileImageUrl: user.user_metadata?.avatar_url || '',
          xp: 0,
          coins: 0,
          level: 1,
        };
        await storage.upsertUser(dbUser);
      }
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize default subjects
  app.post('/api/initialize', isAuthenticated, async (req: Request, res: Response) => {
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
        for (const subject of defaultSubjects) await storage.createSubject(subject);
      }
      res.json({ message: 'Initialization complete' });
    } catch (error) {
      console.error("Initialization error:", error);
      res.status(500).json({ message: "Failed to initialize" });
    }
  });

  // Subject routes
  app.get('/api/subjects', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get('/api/user-subjects', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const userSubjects = await storage.getUserSubjects(userId);
      res.json(userSubjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user subjects" });
    }
  });

  // AI Tutor chat route
  app.post('/api/ai-chat', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { message } = req.body;

      let chatSession = await storage.getChatSession(userId);
      const messages: any[] = (chatSession?.messages as any[]) || [];
      messages.push({ role: 'user', content: message, timestamp: new Date() });

      const systemPrompt = `You are an AI tutor for NexusLearn AI, a gamified learning platform. 
      Help students understand concepts across all subjects. Be encouraging, clear, and educational.
      If asked about topics outside academics, politely redirect to educational content.`;

      const conversationHistory = messages.slice(-6).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: { systemInstruction: systemPrompt },
        contents: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
      });

      const aiResponse = response.text || "I'm here to help with your studies!";
      messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
      await storage.updateChatSession(userId, messages);

      res.json({ response: aiResponse, messages });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Textbook upload route
  app.post('/api/textbooks/upload', isAuthenticated, upload.single('textbook'), async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const file = req.file;
      const { subjectId } = req.body;

      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const textbook = await storage.createTextbook({
        userId,
        filename: `${Date.now()}_${file.originalname}`,
        originalName: file.originalname,
        subjectId: subjectId ? parseInt(subjectId) : null,
        extractedText: null,
      });

      try {
        const extractedText = await extractTextFromPDF(file.buffer, file.originalname);
        const updatedTextbook = await storage.updateTextbook(textbook.id, { extractedText });
        res.json(updatedTextbook);
      } catch (extractError) {
        console.error('PDF extraction error:', extractError);
        res.json({ ...textbook, extractionError: 'PDF text extraction failed, but file uploaded successfully' });
      }
    } catch (error) {
      console.error("Textbook upload error:", error);
      res.status(500).json({ message: "Failed to upload textbook" });
    }
  });

  // Generate quiz from textbook
  app.post('/api/textbooks/generate-quiz', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { textbookId, questionType, numQuestions = 10 } = req.body;

      const textbook = await storage.getTextbook(textbookId);
      if (!textbook || textbook.userId !== userId) return res.status(404).json({ message: "Textbook not found" });
      if (!textbook.extractedText) return res.status(400).json({ message: "Textbook content not processed yet" });

      const { generateTextbookQuiz } = await import('./services/textbookExplainer');
      const quiz = await generateTextbookQuiz(textbook.extractedText, questionType, numQuestions);
      res.json(quiz);
    } catch (error) {
      console.error("Textbook quiz generation error:", error);
      res.status(500).json({ message: "Failed to generate quiz from textbook" });
    }
  });

  // AI explainer for textbook
  app.post('/api/textbooks/explain', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { textbookId } = req.body;

      const textbook = await storage.getTextbook(textbookId);
      if (!textbook || textbook.userId !== userId) return res.status(404).json({ message: "Textbook not found" });
      if (!textbook.extractedText) return res.status(400).json({ message: "Textbook content not processed yet" });

      const { explainTextbook } = await import('./services/textbookExplainer');
      const explanation = await explainTextbook(textbook.extractedText);
      res.json({ explanation });
    } catch (error) {
      console.error("Textbook explanation error:", error);
      res.status(500).json({ message: "Failed to generate explanation for textbook" });
    }
  });

  // Get user textbooks
  app.get('/api/textbooks', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const textbooks = await storage.getUserTextbooks(userId);
      res.json(textbooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch textbooks" });
    }
  });

  // Search textbook content
  app.post('/api/textbooks/:id/search', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { id } = req.params;
      const { query } = req.body;

      const textbook = await storage.getTextbook(parseInt(id));
      if (!textbook || textbook.userId !== userId) return res.status(404).json({ message: "Textbook not found" });
      if (!textbook.extractedText) return res.status(400).json({ message: "Textbook content not processed yet" });

      const searchResult = await searchTextbookContent(textbook.extractedText, query);
      res.json({ result: searchResult });
    } catch (error) {
      console.error("Textbook search error:", error);
      res.status(500).json({ message: "Failed to search textbook" });
    }
  });

  // Generate quiz route
  app.post('/api/quizzes/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { subject, difficulty = 'medium', numQuestions = 10, topic, grade, gradeName, questionType, marks } = req.body;

      const quiz = await generateQuiz(subject, difficulty, numQuestions, topic, {
        grade,
        gradeName,
        questionType,
        marks
      });

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

  // Submit quiz by ID
  app.post('/api/quizzes/:id/submit', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { id } = req.params;
      const { answers } = req.body;

      const quiz = await storage.getQuiz(parseInt(id));
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

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
        questionType: quiz.questionType || 'mcq',
        subject: quiz.title.split(' ')[0] || 'General',
        difficulty: quiz.difficulty || 'medium',
        questions: quiz.questions,
        answers: JSON.stringify(answers),
        score: result.score.toString(),
      });

      // Update user XP and coins
      const user = await storage.getUser(userId);
      if (user) {
        const xpGain = Math.floor(result.score * 2);
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
  app.post('/api/quizzes/submit', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { quizId, answers, timeSpent, questionType, subject, difficulty } = req.body;

      let quizData;
      let actualQuizId: number | null = null;
      let quizSubject = subject || 'General';
      let quizDifficulty = difficulty || 'medium';
      let quizQuestionType = questionType || 'mcq';

      if (typeof quizId === 'object') {
        quizData = quizId;
        quizSubject = quizData.subject || quizSubject;
        quizDifficulty = quizData.difficulty || quizDifficulty;
        quizQuestionType = quizData.questionType || quizQuestionType;
      } else {
        actualQuizId = quizId;
        const quiz = await storage.getQuiz(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });
        quizData = {
          questions: JSON.parse(quiz.questions as string),
          questionType: quiz.questionType || quizQuestionType,
        };
        quizSubject = quiz.title.split(' ')[0] || quizSubject;
        quizDifficulty = quiz.difficulty || quizDifficulty;
        quizQuestionType = quiz.questionType || quizQuestionType;
      }

      const parsedQuestions = quizData.questions;
      let correct = 0;

      parsedQuestions.forEach((question: any, index: number) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctAnswer || question.modelAnswer;

        if (userAnswer && correctAnswer) {
          const userAnswerStr = String(userAnswer).toLowerCase().trim();
          const correctAnswerStr = String(correctAnswer).toLowerCase().trim();

          if (quizQuestionType === 'mcq' || quizQuestionType === 'assertion-reason') {
            if (userAnswerStr === correctAnswerStr) correct++;
          } else {
            if (userAnswerStr.includes(correctAnswerStr) || correctAnswerStr.includes(userAnswerStr)) correct++;
          }
        }
      });

      const score = Math.round((correct / parsedQuestions.length) * 100);
      const xpGained = Math.max(10, Math.round(score * 0.5 + (correct * 5)));
      const coinsGained = Math.max(1, Math.round(score / 20));

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

      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(quizSubject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'quiz',
        duration: timeSpent || 60,
        completedAt: new Date(),
      });

      const currentUser = await storage.getUser(userId);
      if (currentUser) {
        await storage.upsertUser({
          ...currentUser,
          xp: (currentUser.xp || 0) + xpGained,
          coins: (currentUser.coins || 0) + coinsGained,
        });
      }

      const achievements = [];
      if (score === 100) achievements.push({ name: "Perfect Score", description: "Got 100% on a quiz!" });
      if (score >= 80) achievements.push({ name: "High Achiever", description: "Scored 80% or higher!" });
      if (correct >= 5) achievements.push({ name: "Quiz Master", description: "Answered 5 or more questions correctly!" });

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

  // Get quizzes
  app.get('/api/quizzes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const subjectId = req.query.subjectId as string | undefined;
      const quizzes = await storage.getUserQuizzes(userId, subjectId ? parseInt(subjectId) : undefined);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // User stats
  app.get('/api/user/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const stats = await storage.getUserStats(userId);
      if (!stats) return res.status(404).json({ message: 'User not found' });
      res.json(stats);
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ message: 'Failed to get user stats' });
    }
  });

  // Subject progress
  app.get('/api/subjects/progress', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const progress = await storage.getSubjectProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error('Subject progress error:', error);
      res.status(500).json({ message: 'Failed to get subject progress' });
    }
  });

  // Quiz reflection
  app.get('/api/user/reflection', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const quizAttempts = await storage.getUserQuizAttempts(userId);
      if (quizAttempts.length === 0) return res.json(null);

      const recentAttempts = quizAttempts.slice(-10);

      const subjectPerformance: Record<string, { total: number; attempts: number }> = {};
      const difficultyPerformance: Record<string, { total: number; attempts: number }> = {};
      const questionTypePerformance: Record<string, { total: number; attempts: number }> = {};
      let commonMistakes: any[] = [];

      for (const attempt of quizAttempts) {
        const score = parseFloat(attempt.score);
        const subject = attempt.subject || 'General';
        const difficulty = attempt.difficulty || 'medium';
        const questionType = attempt.questionType || 'mcq';

        // Track performances
        if (!subjectPerformance[subject]) subjectPerformance[subject] = { total: 0, attempts: 0 };
        subjectPerformance[subject].attempts++;
        subjectPerformance[subject].total += score;

        if (!difficultyPerformance[difficulty]) difficultyPerformance[difficulty] = { total: 0, attempts: 0 };
        difficultyPerformance[difficulty].attempts++;
        difficultyPerformance[difficulty].total += score;

        if (!questionTypePerformance[questionType]) questionTypePerformance[questionType] = { total: 0, attempts: 0 };
        questionTypePerformance[questionType].attempts++;
        questionTypePerformance[questionType].total += score;

        if (recentAttempts.includes(attempt) && attempt.answers && attempt.questions) {
          try {
            const answers = JSON.parse(attempt.answers);
            const questions = JSON.parse(attempt.questions);

            questions.forEach((question: any, index: number) => {
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

      const improvementSuggestions = await generateImprovementSuggestions(
        subjectPerformance,
        difficultyPerformance,
        commonMistakes.slice(-5)
      );

      res.json({
        recentAttempts: recentAttempts.map(attempt => ({
          ...attempt,
          completedAt: attempt.completedAt || new Date().toISOString()
        })),
        subjectPerformance,
        difficultyPerformance,
        questionTypePerformance,
        commonMistakes: commonMistakes.slice(-15),
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

  // User achievements
  app.get('/api/user/achievements', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const userAchievements = await storage.getUserAchievements(userId);
      const allAchievements = await storage.getAchievements();

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
  app.get('/api/analytics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { analyticsService } = await import("./services/analyticsService");
      const analyticsData = await analyticsService.getAnalyticsData(userId);
      res.json(analyticsData);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
  });

  // Meetings routes
  app.get('/api/meetings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const meetings = await storage.getUserMeetings(userId);
      res.json(meetings);
    } catch (error) {
      console.error('Meetings fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  app.post('/api/meetings/create', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { request } = req.body;
      if (!request) return res.status(400).json({ message: 'Meeting request is required' });

      const meetingData = await parseMeetingRequest(request);
      const meeting = await storage.createMeeting({ userId, ...meetingData });
      res.json(meeting);
    } catch (error) {
      console.error('Meeting creation error:', error);
      res.status(500).json({ message: 'Failed to create meeting' });
    }
  });

  app.post('/api/meetings/:meetingId/start', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const meetingId = parseInt(req.params.meetingId);

      const meeting = await storage.getMeeting(meetingId);
      if (!meeting || meeting.userId !== userId) return res.status(404).json({ message: 'Meeting not found' });

      const updatedMeeting = await storage.updateMeetingStatus(meetingId, 'active');

      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(meeting.subject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'ai_meeting',
        duration: meeting.duration * 60,
        completedAt: new Date(),
      });

      const initialMessage = await generateInitialMeetingMessage({
        topic: meeting.topic,
        subject: meeting.subject,
        grade: meeting.grade,
        agenda: meeting.agenda,
      });

      await storage.createMeetingMessage({
        meetingId,
        role: 'assistant',
        content: initialMessage,
      });

      const messages = await storage.getMeetingMessages(meetingId);

      res.json({ meeting: updatedMeeting, initialMessages: messages });
    } catch (error) {
      console.error('Meeting start error:', error);
      res.status(500).json({ message: 'Failed to start meeting' });
    }
  });

  app.post('/api/meetings/chat', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { message, meetingId } = req.body;
      if (!message || !meetingId) return res.status(400).json({ message: 'Message and meetingId are required' });

      const meeting = await storage.getMeeting(meetingId);
      if (!meeting || meeting.userId !== userId) return res.status(404).json({ message: 'Meeting not found' });

      const previousMessages = await storage.getMeetingMessages(meetingId);

      const aiResponse = await generateMeetingResponse(message, {
        topic: meeting.topic,
        subject: meeting.subject,
        grade: meeting.grade,
        agenda: meeting.agenda,
        previousMessages: previousMessages.slice(-6),
      });

      await storage.createMeetingMessage({ meetingId, role: 'user', content: message });
      const aiMessage = await storage.createMeetingMessage({ meetingId, role: 'assistant', content: aiResponse });

      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(meeting.subject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'ai_chat',
        duration: 30,
        completedAt: new Date(),
      });

      res.json({ messages: [aiMessage] });
    } catch (error) {
      console.error('Meeting chat error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // AI Lesson Panel - Create Jitsi meeting with AI bot
  app.post('/api/create-meeting', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { topic } = req.body;
      if (!topic) return res.status(400).json({ message: 'Topic is required' });

      const hfToken = process.env.HF_TOKEN;
      if (!hfToken) return res.status(500).json({ message: 'Hugging Face token not configured' });

      const pythonProcess = spawn('python3', ['server/ai-classroom-simple.py', topic, hfToken]);

      let output = '';
      let errorOutput = '';
      let responseHandled = false;

      pythonProcess.stdout.on('data', (data: Buffer) => { output += data.toString(); });
      pythonProcess.stderr.on('data', (data: Buffer) => { errorOutput += data.toString(); });

      pythonProcess.on('close', (code: number) => {
        if (responseHandled) return;
        responseHandled = true;

        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            res.json(result);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            console.error('Raw output:', output);
            res.status(500).json({ message: 'Failed to parse response' });
          }
        } else {
          console.error('Python process error:', errorOutput);
          res.status(500).json({ message: 'Failed to create meeting' });
        }
      });

      const timeoutId = setTimeout(() => {
        if (responseHandled) return;
        responseHandled = true;
        pythonProcess.kill();
        res.status(408).json({ message: 'Request timeout' });
      }, 30000);

      pythonProcess.on('close', () => clearTimeout(timeoutId));
    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({ message: 'Failed to create meeting' });
    }
  });

  // Study Planner API Routes

  app.get('/api/study-plans', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const studyPlans = await storage.getUserStudyPlans(userId);
      res.json(studyPlans);
    } catch (error) {
      console.error("Get study plans error:", error);
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });

  app.post('/api/study-plans', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planData = {
        userId,
        subjectId: parseInt(req.body.subjectId),
        title: req.body.title,
        description: req.body.description || null,
        plannedDate: new Date(req.body.plannedDate),
        duration: parseInt(req.body.duration),
        priority: req.body.priority || 'medium',
        studyType: req.body.studyType || 'reading',
        status: 'pending',
        aiGenerated: false,
      };

      const studyPlan = await storage.createStudyPlan(planData);
      res.json(studyPlan);
    } catch (error) {
      console.error("Create study plan error:", error);
      res.status(500).json({ message: "Failed to create study plan" });
    }
  });

  app.post('/api/study-plans/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { generateAIStudyPlan, generateStudyPlanSummary } = await import("./services/studyPlanGenerator");

      const request = {
        subjectId: parseInt(req.body.subjectId),
        examType: req.body.examType,
        examDate: req.body.examDate,
        currentDate: new Date().toISOString(),
        syllabus: req.body.syllabus,
        dailyStudyHours: parseInt(req.body.dailyStudyHours),
      };

      const aiPlan = await generateAIStudyPlan(request);

      const createdPlans = [];
      for (const item of aiPlan) {
        const planData = {
          userId,
          subjectId: request.subjectId,
          title: item.title,
          description: item.description,
          plannedDate: new Date(item.plannedDate),
          duration: item.duration,
          priority: item.priority,
          studyType: item.studyType,
          status: 'pending',
          aiGenerated: true,
        };

        const createdPlan = await storage.createStudyPlan(planData);
        createdPlans.push(createdPlan);

        if (planData.plannedDate > new Date()) {
          const reminderTime = new Date(planData.plannedDate.getTime() - 30 * 60 * 1000);
          if (reminderTime > new Date()) {
            await storage.createStudyPlanReminder({
              studyPlanId: createdPlan.id,
              reminderTime,
              reminderType: 'notification',
              message: `Reminder: "${item.title}" starts in 30 minutes. Duration: ${item.duration} minutes.`,
              sent: false,
            });
          }
        }
      }

      const summary = await generateStudyPlanSummary(aiPlan);

      res.json({
        plans: createdPlans,
        summary,
        message: `Generated ${createdPlans.length} study sessions for your ${request.examType}`,
      });
    } catch (error) {
      console.error("Generate AI study plan error:", error);
      res.status(500).json({ message: "Failed to generate AI study plan" });
    }
  });

  app.patch('/api/study-plans/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const planId = parseInt(req.params.id);
      
      const plan = await storage.getStudyPlan(planId);
      if (!plan || plan.userId !== userId) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      
      const updatedPlan = await storage.updateStudyPlan(planId, req.body);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Update study plan error:", error);
      res.status(500).json({ message: "Failed to update study plan" });
    }
  });

  app.delete('/api/study-plans/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const planId = parseInt(req.params.id);
      
      const plan = await storage.getStudyPlan(planId);
      if (!plan || plan.userId !== userId) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      
      await storage.deleteStudyPlan(planId);
      res.json({ message: "Study plan deleted successfully" });
    } catch (error) {
      console.error("Delete study plan error:", error);
      res.status(500).json({ message: "Failed to delete study plan" });
    }
  });

  // Pomodoro Timer Routes
  app.get('/api/pomodoro', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const sessions = await storage.getUserPomodoroSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get pomodoro sessions error:", error);
      res.status(500).json({ message: "Failed to fetch pomodoro sessions" });
    }
  });

  app.post('/api/pomodoro', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      
      const sessionData = {
        userId,
        subjectId: req.body.subjectId ? parseInt(req.body.subjectId) : null,
        sessionType: req.body.sessionType || 'work',
        duration: parseInt(req.body.duration),
        status: 'pending',
      };
      
      const session = await storage.createPomodoroSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Create pomodoro session error:", error);
      res.status(500).json({ message: "Failed to create pomodoro session" });
    }
  });

  app.patch('/api/pomodoro/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const sessionId = parseInt(req.params.id);
      
      const session = await storage.getPomodoroSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Pomodoro session not found" });
      }
      
      const updatedSession = await storage.updatePomodoroSession(sessionId, req.body);
      res.json(updatedSession);
    } catch (error) {
      console.error("Update pomodoro session error:", error);
      res.status(500).json({ message: "Failed to update pomodoro session" });
    }
  });

  app.get('/api/pomodoro/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as RequestWithUser).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const stats = await storage.getPomodoroStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get pomodoro stats error:", error);
      res.status(500).json({ message: "Failed to fetch pomodoro stats" });
    }
  });

  // Serve audio files
  app.use('/audio', express.static('public/audio'));

  return createServer(app);
}