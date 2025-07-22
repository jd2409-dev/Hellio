import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from 'child_process';
import { insertPomodoroSessionSchema, insertPdfDriveBookSchema, insertUserPdfLibrarySchema, insertTimeCapsuleSchema, insertTimeCapsuleReminderSchema, insertPeerChallengeSchema, insertChallengeAttemptSchema, insertStoryCreationSchema } from "@shared/schema";
import express from "express";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateEducationalStory, suggestStoryTitle, generateEnhancedStory } from "./services/storytelling";
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

      // Track study session for analytics
      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(quizSubject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'quiz',
        duration: timeSpent || 60, // Default 1 minute if no time provided
        completedAt: new Date(),
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

  // User stats routes - now using real analytics data
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      const achievements = await storage.getUserAchievements(userId);
      const quizAttempts = await storage.getUserQuizAttempts(userId);
      
      // Get real learning streak data
      const { analyticsService } = await import("./services/analyticsService");
      const learningStreak = await analyticsService.getLearningStreak(userId);
      
      // Calculate total study time from all sessions
      const totalStudyTime = await analyticsService.getTotalStudyTime(userId);
      
      // Calculate level based on actual XP (every 100 XP = 1 level)
      const actualLevel = Math.floor((user?.xp || 0) / 100) + 1;
      
      const stats = {
        xp: user?.xp || 0,
        coins: user?.coins || 0,
        level: actualLevel,
        studyStreak: learningStreak?.currentStreak || 0,
        longestStreak: learningStreak?.longestStreak || 0,
        totalStudyTime: Math.round(totalStudyTime / 60), // Convert to minutes
        totalAchievements: achievements.length,
        averageQuizScore: quizAttempts.length > 0 
          ? Math.round((quizAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score), 0) / quizAttempts.length) * 100) / 100
          : 0,
        totalQuizzes: quizAttempts.length,
        lastStudyDate: learningStreak?.lastStudyDate || null,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Subject progress endpoint - real data based on user activity
  app.get('/api/subjects/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const subjects = await storage.getSubjects();
      const quizAttempts = await storage.getUserQuizAttempts(userId);
      const { analyticsService } = await import("./services/analyticsService");
      
      // Calculate progress for each subject
      const subjectProgress = await Promise.all(subjects.map(async (subject) => {
        // Get quizzes for this subject - handle async check properly
        const subjectQuizzes = [];
        for (const attempt of quizAttempts) {
          if (attempt.subject === subject.name) {
            subjectQuizzes.push(attempt);
          } else if (attempt.quizId) {
            const quiz = await storage.getQuiz(attempt.quizId);
            if (quiz?.subjectId === subject.id) {
              subjectQuizzes.push(attempt);
            }
          }
        }
        
        // Get study time for this subject
        const studyTime = await analyticsService.getTotalStudyTimeForSubject(userId, subject.id);
        
        // Calculate average score
        const averageScore = subjectQuizzes.length > 0 
          ? subjectQuizzes.reduce((sum, attempt) => sum + parseFloat(attempt.score), 0) / subjectQuizzes.length
          : 0;
        
        // Calculate progress based on activity (quizzes taken + study time)
        // Progress = (average_score * 0.7) + (activity_factor * 0.3)
        const activityFactor = Math.min(100, (subjectQuizzes.length * 10) + (studyTime / 3600 * 20)); // Max 100
        const progress = Math.round((averageScore * 0.7) + (activityFactor * 0.3));
        
        return {
          ...subject,
          progress: Math.max(0, Math.min(100, progress)), // Ensure between 0-100
          averageScore: Math.round(averageScore),
          totalQuizzes: subjectQuizzes.length,
          studyTime: Math.round(studyTime / 60), // Convert to minutes
        };
      }));
      
      res.json(subjectProgress);
    } catch (error) {
      console.error("Subject progress error:", error);
      res.status(500).json({ message: "Failed to fetch subject progress" });
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

      // Track study session for starting a meeting
      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(meeting.subject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'ai_meeting',
        duration: meeting.duration * 60, // Convert minutes to seconds
        completedAt: new Date(),
      });

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

      // Save user message first
      await storage.createMeetingMessage({
        meetingId,
        role: 'user',
        content: message,
      });

      // Save AI response
      const aiMessage = await storage.createMeetingMessage({
        meetingId,
        role: 'assistant',
        content: aiResponse,
      });

      // Track additional study session time for chat interaction (30 seconds per message exchange)
      const { analyticsService } = await import("./services/analyticsService");
      const subjectRecord = await storage.getSubjectByName(meeting.subject);
      await analyticsService.trackStudySession({
        userId,
        subjectId: subjectRecord?.id || null,
        activityType: 'ai_chat',
        duration: 30, // 30 seconds per chat exchange
        completedAt: new Date(),
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
      const hfToken = process.env.HF_TOKEN;
      if (!hfToken) {
        return res.status(500).json({ message: 'Hugging Face token not configured' });
      }

      console.log(`Creating AI lesson meeting for topic: ${topic}`);

      // Use Python subprocess to create the AI live classroom
      const pythonProcess = spawn('python3', ['server/ai-classroom-simple.py', topic, hfToken]);

      let output = '';
      let errorOutput = '';
      let responseHandled = false;

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

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

      // Set timeout for the request
      const timeoutId = setTimeout(() => {
        if (responseHandled) return;
        responseHandled = true;
        
        pythonProcess.kill();
        res.status(408).json({ message: 'Request timeout' });
      }, 30000); // 30 second timeout

      // Clean up timeout if process completes
      pythonProcess.on('close', () => {
        clearTimeout(timeoutId);
      });

    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({ message: 'Failed to create meeting' });
    }
  });

  // Study Planner API Routes
  
  // Get user's study plans
  app.get('/api/study-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const studyPlans = await storage.getUserStudyPlans(userId);
      res.json(studyPlans);
    } catch (error) {
      console.error("Get study plans error:", error);
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });

  // Create a new study plan
  app.post('/api/study-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request data
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

  // Generate AI study plan
  app.post('/api/study-plans/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { generateAIStudyPlan, generateStudyPlanSummary } = await import("./services/studyPlanGenerator");
      
      const request = {
        subjectId: parseInt(req.body.subjectId),
        examType: req.body.examType,
        examDate: req.body.examDate,
        currentDate: new Date().toISOString(),
        syllabus: req.body.syllabus,
        dailyStudyHours: parseInt(req.body.dailyStudyHours),
      };

      // Generate AI study plan
      const aiPlan = await generateAIStudyPlan(request);
      
      // Create study plans in database
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

        // Create reminders if needed
        if (planData.plannedDate > new Date()) {
          const reminderTime = new Date(planData.plannedDate.getTime() - 30 * 60 * 1000); // 30 min before
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

      // Generate summary
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

  // Update study plan
  app.patch('/api/study-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updateData.userId;
      delete updateData.createdAt;
      
      const updatedPlan = await storage.updateStudyPlan(planId, updateData);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Update study plan error:", error);
      res.status(500).json({ message: "Failed to update study plan" });
    }
  });

  // Delete study plan
  app.delete('/api/study-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deleteStudyPlan(planId);
      res.json({ message: "Study plan deleted successfully" });
    } catch (error) {
      console.error("Delete study plan error:", error);
      res.status(500).json({ message: "Failed to delete study plan" });
    }
  });

  // Mark study plan as completed
  app.post('/api/study-plans/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updatedPlan = await storage.updateStudyPlan(planId, {
        status: 'completed',
        completedAt: new Date(),
      });

      // Award XP for completing study plan
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        const xpGained = Math.floor(updatedPlan.duration / 15); // 1 XP per 15 minutes
        await storage.updateUserXP(userId, user.xp + xpGained, user.coins + Math.floor(xpGained / 2));
        
        // Track study session
        const { analyticsService } = await import("./services/analyticsService");
        await analyticsService.trackStudySession({
          userId,
          subjectId: updatedPlan.subjectId,
          activityType: 'study_plan',
          duration: updatedPlan.duration * 60, // Convert to seconds
          completedAt: new Date(),
        });
      }

      res.json(updatedPlan);
    } catch (error) {
      console.error("Complete study plan error:", error);
      res.status(500).json({ message: "Failed to complete study plan" });
    }
  });

  // Pomodoro Timer Routes
  
  // Create a pomodoro session
  app.post('/api/pomodoro/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertPomodoroSessionSchema.parse({
        ...req.body,
        userId,
        startedAt: new Date(),
        status: 'active',
      });

      const session = await storage.createPomodoroSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Create pomodoro session error:", error);
      res.status(500).json({ message: "Failed to create pomodoro session" });
    }
  });

  // Update a pomodoro session (pause, complete, etc.)
  app.patch('/api/pomodoro/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;

      // Set appropriate timestamps
      if (updateData.status === 'completed') {
        updateData.completedAt = new Date();
      }

      const session = await storage.updatePomodoroSession(sessionId, updateData);

      // Award XP for completed work sessions
      if (updateData.status === 'completed' && session.sessionType === 'work') {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          const xpGained = Math.floor(session.duration * 0.8); // ~0.8 XP per minute
          await storage.upsertUser({
            ...user,
            xp: (user.xp || 0) + xpGained,
            coins: (user.coins || 0) + Math.floor(xpGained / 3),
          });
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Update pomodoro session error:", error);
      res.status(500).json({ message: "Failed to update pomodoro session" });
    }
  });

  // Get pomodoro stats
  app.get('/api/pomodoro/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getPomodoroStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get pomodoro stats error:", error);
      res.status(500).json({ message: "Failed to get pomodoro stats" });
    }
  });

  // Get weekly pomodoro stats
  app.get('/api/pomodoro/weekly-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserPomodoroSessions(userId);
      
      // Filter sessions from the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weeklySessions = sessions.filter(session => 
        session.createdAt && new Date(session.createdAt) >= weekAgo && 
        session.status === 'completed'
      );
      
      const totalSessions = weeklySessions.length;
      const totalFocusTime = weeklySessions
        .filter(s => s.sessionType === 'work')
        .reduce((acc, s) => acc + (s.actualDuration || s.duration * 60), 0);
      
      const hours = Math.floor(totalFocusTime / 3600);
      const minutes = Math.floor((totalFocusTime % 3600) / 60);
      
      res.json({
        totalSessions,
        totalFocusTime: `${hours}h ${minutes}m`,
        averageSession: totalSessions > 0 ? `${Math.floor(totalFocusTime / totalSessions / 60)}m` : '0m',
      });
    } catch (error) {
      console.error("Get weekly pomodoro stats error:", error);
      res.status(500).json({ message: "Failed to get weekly stats" });
    }
  });

  // Get recent pomodoro sessions
  app.get('/api/pomodoro/recent-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserPomodoroSessions(userId);
      res.json(sessions.slice(0, 10)); // Return last 10 sessions
    } catch (error) {
      console.error("Get recent pomodoro sessions error:", error);
      res.status(500).json({ message: "Failed to get recent sessions" });
    }
  });

  // PDF Drive Routes

  // Search Archive.org
  app.post('/api/pdf-drive/search', isAuthenticated, async (req: any, res) => {
    try {
      const { query, category, limit = 20 } = req.body;

      if (!query?.trim()) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      // Use Python script to search Archive.org
      const pythonProcess = spawn('python3', [
        'server/archive-org-search.py',
        'search',
        query.trim(),
        category || 'null',
        limit.toString()
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', async (code: number) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            
            if (result.success && result.books) {
              // Cache books in database for future reference
              const books = [];
              for (const bookData of result.books) {
                try {
                  const book = await storage.createPdfBook({
                    title: bookData.title || '',
                    author: bookData.author || 'Unknown Author',
                    pages: null, // Archive.org doesn't provide page count directly
                    year: bookData.year,
                    size: bookData.size || null,
                    extension: bookData.format?.includes('PDF') ? 'pdf' : 'various',
                    preview: bookData.viewUrl,
                    downloadUrl: bookData.downloadUrl,
                    imageUrl: bookData.imageUrl,
                    category: bookData.category || 'books',
                    language: bookData.language || 'english',
                    searchKeywords: query.split(' ').filter(word => word.length > 2),
                    popularity: bookData.downloads || 0,
                  });
                  books.push({ 
                    ...book, 
                    id: book.id,
                    identifier: bookData.identifier, // Add Archive.org identifier
                    description: bookData.description,
                    subject: bookData.subject
                  });
                } catch (dbError) {
                  // If book already exists, just add it to results
                  books.push({ 
                    ...bookData, 
                    id: bookData.id || Math.random() * 1000000
                  });
                }
              }

              res.json({
                success: true,
                books,
                total: books.length
              });
            } else {
              res.json(result);
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            console.error('Raw output:', output);
            res.status(500).json({ 
              success: false, 
              message: 'Failed to parse search results',
              error: errorOutput 
            });
          }
        } else {
          console.error('Python scraper error:', errorOutput);
          res.status(500).json({ 
            success: false, 
            message: 'Search failed',
            error: errorOutput 
          });
        }
      });
    } catch (error) {
      console.error("Archive.org search error:", error);
      res.status(500).json({ message: "Failed to search Archive.org" });
    }
  });

  // Save book to user library
  app.post('/api/pdf-drive/save-book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId, subjectId } = req.body;

      const libraryItem = await storage.addBookToUserLibrary({
        userId,
        bookId: parseInt(bookId),
        subjectId: subjectId ? parseInt(subjectId) : null,
        status: 'saved',
        progress: 0,
      });

      res.json(libraryItem);
    } catch (error) {
      console.error("Save book error:", error);
      res.status(500).json({ message: "Failed to save book" });
    }
  });

  // Get user's PDF library
  app.get('/api/pdf-drive/library', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const library = await storage.getUserPdfLibrary(userId);
      res.json(library);
    } catch (error) {
      console.error("Get PDF library error:", error);
      res.status(500).json({ message: "Failed to get PDF library" });
    }
  });

  // Get book details and download URLs from Archive.org
  app.post('/api/pdf-drive/download/:identifier', isAuthenticated, async (req: any, res) => {
    try {
      const identifier = req.params.identifier;

      // Use Python script to get book details from Archive.org
      const pythonProcess = spawn('python3', [
        'server/archive-org-search.py',
        'details',
        identifier
      ]);

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
            if (result.success) {
              res.json({
                success: true,
                downloadUrls: result.downloadUrls,
                viewUrl: result.viewUrl,
                title: result.title,
                description: result.description
              });
            } else {
              res.status(404).json({ message: result.error || 'Book not found' });
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ message: 'Failed to parse book details' });
          }
        } else {
          console.error('Python process error:', errorOutput);
          res.status(500).json({ message: 'Failed to get book details' });
        }
      });
    } catch (error) {
      console.error("Get book details error:", error);
      res.status(500).json({ message: "Failed to get book details" });
    }
  });

  // Get PDF Drive stats
  app.get('/api/pdf-drive/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const library = await storage.getUserPdfLibrary(userId);
      
      const stats = {
        totalBooks: library.length,
        readingBooks: library.filter(item => item.status === 'reading').length,
        completedBooks: library.filter(item => item.status === 'completed').length,
        downloadedBooks: library.filter(item => item.status === 'downloaded').length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get PDF Drive stats error:", error);
      res.status(500).json({ message: "Failed to get PDF Drive stats" });
    }
  });

  // Time Capsule Routes
  
  // Get user's time capsules
  app.get('/api/time-capsules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeCapsules = await storage.getUserTimeCapsules(userId);
      res.json(timeCapsules);
    } catch (error) {
      console.error("Get time capsules error:", error);
      res.status(500).json({ message: "Failed to get time capsules" });
    }
  });

  // Create a new time capsule
  app.post('/api/time-capsules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeCapsuleData = insertTimeCapsuleSchema.parse({
        ...req.body,
        userId,
      });

      // Calculate reflection date based on period
      const reflectionDate = new Date();
      reflectionDate.setDate(reflectionDate.getDate() + (timeCapsuleData.reflectionPeriod || 90));
      timeCapsuleData.reflectionDate = reflectionDate;

      const timeCapsule = await storage.createTimeCapsule(timeCapsuleData);
      
      // Create reminder for reflection
      await storage.createTimeCapsuleReminder({
        timeCapsuleId: timeCapsule.id,
        reminderDate: reflectionDate,
        reminderType: 'reflection',
        message: `Time to reflect on your understanding of: ${timeCapsule.title}`,
      });

      // Award XP for creating time capsule
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          xp: (user.xp || 0) + 25,
          coins: (user.coins || 0) + 10,
        });
      }

      res.json(timeCapsule);
    } catch (error) {
      console.error("Create time capsule error:", error);
      res.status(500).json({ message: "Failed to create time capsule" });
    }
  });

  // Get specific time capsule
  app.get('/api/time-capsules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeCapsuleId = parseInt(req.params.id);
      
      const timeCapsule = await storage.getTimeCapsule(timeCapsuleId);
      if (!timeCapsule || timeCapsule.userId !== userId) {
        return res.status(404).json({ message: 'Time capsule not found' });
      }

      res.json(timeCapsule);
    } catch (error) {
      console.error("Get time capsule error:", error);
      res.status(500).json({ message: "Failed to get time capsule" });
    }
  });

  // Reflect on a time capsule
  app.post('/api/time-capsules/:id/reflect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeCapsuleId = parseInt(req.params.id);
      const { reflectionNotes, currentUnderstanding, growthInsights } = req.body;

      const timeCapsule = await storage.getTimeCapsule(timeCapsuleId);
      if (!timeCapsule || timeCapsule.userId !== userId) {
        return res.status(404).json({ message: 'Time capsule not found' });
      }

      const updatedCapsule = await storage.reflectOnTimeCapsule(timeCapsuleId, {
        reflectionNotes,
        currentUnderstanding,
        growthInsights,
      });

      // Award XP for reflection
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          xp: (user.xp || 0) + 50,
          coins: (user.coins || 0) + 20,
        });
      }

      res.json(updatedCapsule);
    } catch (error) {
      console.error("Reflect on time capsule error:", error);
      res.status(500).json({ message: "Failed to reflect on time capsule" });
    }
  });

  // Update time capsule
  app.patch('/api/time-capsules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeCapsuleId = parseInt(req.params.id);
      const updateData = req.body;

      const timeCapsule = await storage.getTimeCapsule(timeCapsuleId);
      if (!timeCapsule || timeCapsule.userId !== userId) {
        return res.status(404).json({ message: 'Time capsule not found' });
      }

      const updatedCapsule = await storage.updateTimeCapsule(timeCapsuleId, updateData);
      res.json(updatedCapsule);
    } catch (error) {
      console.error("Update time capsule error:", error);
      res.status(500).json({ message: "Failed to update time capsule" });
    }
  });

  // Get time capsules due for reflection
  app.get('/api/time-capsules/due-for-reflection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dueTimeCapsules = await storage.getTimeCapsulesDueForReflection();
      
      // Filter by user
      const userDueCapsules = dueTimeCapsules.filter(capsule => capsule.userId === userId);
      res.json(userDueCapsules);
    } catch (error) {
      console.error("Get due time capsules error:", error);
      res.status(500).json({ message: "Failed to get due time capsules" });
    }
  });

  // Peer Challenge Routes
  
  // Create a new peer challenge
  app.post('/api/peer-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate unique challenge ID
      const challengeId = 'ch_' + Math.random().toString(36).substr(2, 16);
      
      const challengeData = insertPeerChallengeSchema.parse({
        ...req.body,
        challengeId,
        creatorId: userId,
        creatorName: `${user.firstName || 'Anonymous'} ${user.lastName || 'User'}`.trim(),
      });

      const challenge = await storage.createPeerChallenge(challengeData);
      
      // Award XP for creating challenge
      await storage.upsertUser({
        ...user,
        xp: (user.xp || 0) + 30,
        coins: (user.coins || 0) + 15,
      });

      res.json(challenge);
    } catch (error) {
      console.error("Create peer challenge error:", error);
      res.status(500).json({ message: "Failed to create peer challenge" });
    }
  });

  // Get public challenges (discovery)
  app.get('/api/peer-challenges/public', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const challenges = await storage.getPublicChallenges(limit);
      res.json(challenges);
    } catch (error) {
      console.error("Get public challenges error:", error);
      res.status(500).json({ message: "Failed to get public challenges" });
    }
  });

  // Get user's created challenges
  app.get('/api/peer-challenges/my-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getUserCreatedChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Get user challenges error:", error);
      res.status(500).json({ message: "Failed to get user challenges" });
    }
  });

  // Get specific challenge by ID
  app.get('/api/peer-challenges/:challengeId', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = req.params.challengeId;
      const challenge = await storage.getPeerChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }

      // Get leaderboard for this challenge
      const leaderboard = await storage.getChallengeLeaderboard(challengeId);
      
      res.json({
        ...challenge,
        leaderboard,
      });
    } catch (error) {
      console.error("Get challenge error:", error);
      res.status(500).json({ message: "Failed to get challenge" });
    }
  });

  // Submit challenge attempt
  app.post('/api/peer-challenges/:challengeId/attempt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const challengeId = req.params.challengeId;
      const { answers, score, timeSpent } = req.body;

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const challenge = await storage.getPeerChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }

      // Check attempt limit
      const userAttempts = await storage.getUserChallengeAttempts(userId, challengeId);
      if (userAttempts.length >= (challenge.maxAttempts || 3)) {
        return res.status(400).json({ message: 'Maximum attempts exceeded' });
      }

      // Create attempt record
      const attemptData = insertChallengeAttemptSchema.parse({
        challengeId,
        participantId: userId,
        participantName: `${user.firstName || 'Anonymous'} ${user.lastName || 'User'}`.trim(),
        answers,
        score,
        timeSpent,
      });

      const attempt = await storage.createChallengeAttempt(attemptData);

      // Update leaderboard
      await storage.updateLeaderboard({
        challengeId,
        participantId: userId,
        participantName: attemptData.participantName,
        bestScore: score,
        bestTime: timeSpent,
      });

      // Award XP for completing challenge
      const xpReward = Math.floor(parseFloat(score.toString()) * 0.5); // 0.5 XP per percentage point
      await storage.upsertUser({
        ...user,
        xp: (user.xp || 0) + xpReward,
        coins: (user.coins || 0) + Math.floor(xpReward / 2),
      });

      res.json({ 
        attempt, 
        xpEarned: xpReward,
        coinsEarned: Math.floor(xpReward / 2) 
      });
    } catch (error) {
      console.error("Submit challenge attempt error:", error);
      res.status(500).json({ message: "Failed to submit challenge attempt" });
    }
  });

  // Get challenge leaderboard
  app.get('/api/peer-challenges/:challengeId/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = req.params.challengeId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const leaderboard = await storage.getChallengeLeaderboard(challengeId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // Search challenges
  app.get('/api/peer-challenges/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      const subject = req.query.subject as string;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const challenges = await storage.searchChallenges(query, subject);
      res.json(challenges);
    } catch (error) {
      console.error("Search challenges error:", error);
      res.status(500).json({ message: "Failed to search challenges" });
    }
  });

  // AI Educational Storytelling Routes
  
  // Generate story from concept
  app.post('/api/stories/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { concept, subject, difficulty, enhanced = false } = req.body;
      
      if (!concept) {
        return res.status(400).json({ message: 'Concept is required' });
      }

      if (enhanced) {
        // Use enhanced Python-based generation with multimedia
        const enhancedResult = await generateEnhancedStory(concept, subject, difficulty);
        
        const suggestedTitle = await suggestStoryTitle(concept);
        
        // If video was created successfully, return it as the primary result
        if (enhancedResult.success && enhancedResult.media_files.video_path) {
          res.json({
            ...enhancedResult,
            suggestedTitle,
            videoUrl: enhancedResult.media_files.video_path ? `/stories/${path.basename(enhancedResult.media_files.video_path)}` : null,
            hasVideo: true
          });
        } else {
          res.json({
            ...enhancedResult,
            suggestedTitle,
            hasVideo: false
          });
        }
      } else {
        // Use basic TypeScript generation
        const scenes = await generateEducationalStory(concept, subject, difficulty);
        const suggestedTitle = await suggestStoryTitle(concept);
        
        res.json({
          scenes,
          suggestedTitle,
          concept,
          subject,
          difficulty,
        });
      }
    } catch (error) {
      console.error("Generate story error:", error);
      res.status(500).json({ 
        message: "Failed to generate story",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Save generated story
  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const storyData = insertStoryCreationSchema.parse({
        ...req.body,
        userId,
      });

      const story = await storage.createStory(storyData);
      
      // Award XP for creating story
      await storage.upsertUser({
        ...user,
        xp: (user.xp || 0) + 20,
        coins: (user.coins || 0) + 10,
      });

      res.json({ 
        ...story,
        xpEarned: 20,
        coinsEarned: 10 
      });
    } catch (error) {
      console.error("Save story error:", error);
      res.status(500).json({ message: "Failed to save story" });
    }
  });

  // Get user's stories
  app.get('/api/stories/my-stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getUserStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Get user stories error:", error);
      res.status(500).json({ message: "Failed to get user stories" });
    }
  });

  // Get public stories
  app.get('/api/stories/public', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const stories = await storage.getPublicStories(limit);
      res.json(stories);
    } catch (error) {
      console.error("Get public stories error:", error);
      res.status(500).json({ message: "Failed to get public stories" });
    }
  });

  // Get specific story
  app.get('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const story = await storage.getStoryById(id);
      
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }

      res.json(story);
    } catch (error) {
      console.error("Get story error:", error);
      res.status(500).json({ message: "Failed to get story" });
    }
  });

  // Like/Unlike story
  app.post('/api/stories/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);
      const { action } = req.body; // 'like' or 'unlike'

      if (action === 'like') {
        const like = await storage.likeStory(storyId, userId);
        res.json({ like, action: 'liked' });
      } else if (action === 'unlike') {
        await storage.unlikeStory(storyId, userId);
        res.json({ action: 'unliked' });
      } else {
        res.status(400).json({ message: 'Invalid action. Use "like" or "unlike"' });
      }
    } catch (error) {
      console.error("Like/unlike story error:", error);
      res.status(500).json({ message: "Failed to process like/unlike" });
    }
  });

  // Update story (make public/private, edit)
  app.patch('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      // Check if user owns the story
      const story = await storage.getStoryById(id);
      if (!story || story.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to edit this story' });
      }

      const updatedStory = await storage.updateStory(id, req.body);
      res.json(updatedStory);
    } catch (error) {
      console.error("Update story error:", error);
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  // Delete story
  app.delete('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      // Check if user owns the story
      const story = await storage.getStoryById(id);
      if (!story || story.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this story' });
      }

      await storage.deleteStory(id);
      res.json({ message: 'Story deleted successfully' });
    } catch (error) {
      console.error("Delete story error:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Serve audio files
  app.use('/audio', express.static('public/audio'));

  const httpServer = createServer(app);
  return httpServer;
}
