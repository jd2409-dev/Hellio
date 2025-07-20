import { db } from "../db";
import { 
  studySessions, 
  learningStreaks, 
  performanceMetrics, 
  quizAttempts, 
  subjects,
  type StudySession,
  type LearningStreak,
  type PerformanceMetric,
  type InsertStudySession,
  type InsertLearningStreak,
  type InsertPerformanceMetric
} from "@shared/schema";
import { eq, and, sql, desc, asc, gte, lt } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PerformanceInsight {
  category: 'strength' | 'weakness' | 'improvement' | 'achievement';
  title: string;
  description: string;
  suggestion?: string;
  subjectName?: string;
}

export interface AnalyticsData {
  totalStudyTime: number; // in minutes
  averageScore: number;
  totalQuizzes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: {
    date: string;
    studyTime: number;
    quizzes: number;
    score: number;
  }[];
  subjectPerformance: {
    subjectName: string;
    averageScore: number;
    totalQuizzes: number;
    studyTime: number;
    strongAreas: string[];
    weakAreas: string[];
  }[];
  insights: PerformanceInsight[];
  recommendations: string[];
}

export class AnalyticsService {
  // Track study session
  async trackStudySession(data: InsertStudySession): Promise<StudySession> {
    const [session] = await db
      .insert(studySessions)
      .values(data)
      .returning();
    
    await this.updateLearningStreak(data.userId);
    await this.updatePerformanceMetrics(data.userId, data.subjectId);
    
    return session;
  }

  // Get learning streak for a user
  async getLearningStreak(userId: string): Promise<LearningStreak | null> {
    const [streak] = await db
      .select()
      .from(learningStreaks)
      .where(eq(learningStreaks.userId, userId));
    
    return streak || null;
  }

  // Get total study time for a user (in seconds)
  async getTotalStudyTime(userId: string): Promise<number> {
    const [result] = await db
      .select({
        totalTime: sql<number>`COALESCE(SUM(${studySessions.duration}), 0)`.as('totalTime')
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId));
    
    return result?.totalTime || 0;
  }

  // Update learning streak
  async updateLearningStreak(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existingStreak] = await db
      .select()
      .from(learningStreaks)
      .where(eq(learningStreaks.userId, userId));

    if (!existingStreak) {
      await db.insert(learningStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(),
      });
      return;
    }

    const lastStudyDate = existingStreak.lastStudyDate || new Date(0);
    const daysDiff = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak = existingStreak.currentStreak;
    if (daysDiff === 0) {
      // Same day, don't increment
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment
      newCurrentStreak = existingStreak.currentStreak + 1;
    } else {
      // Streak broken, reset
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(existingStreak.longestStreak, newCurrentStreak);

    await db
      .update(learningStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(learningStreaks.userId, userId));
  }

  // Update performance metrics
  async updatePerformanceMetrics(userId: string, subjectId?: number): Promise<void> {
    if (!subjectId) return;

    // Get quiz performance data
    const quizData = await db
      .select({
        avgScore: sql<number>`AVG(${quizAttempts.score})`.as('avgScore'),
        totalQuizzes: sql<number>`COUNT(*)`.as('totalQuizzes'),
        totalTime: sql<number>`SUM(${quizAttempts.timeSpent})`.as('totalTime'),
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.subjectId, subjectId)
        )
      );

    // Get study session data
    const sessionData = await db
      .select({
        totalStudyTime: sql<number>`SUM(${studySessions.duration})`.as('totalStudyTime'),
      })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          eq(studySessions.subjectId, subjectId)
        )
      );

    if (quizData[0] && quizData[0].totalQuizzes > 0) {
      const weakAreas = await this.identifyWeakAreas(userId, subjectId);
      const strongAreas = await this.identifyStrongAreas(userId, subjectId);
      const recommendations = await this.generateRecommendations(userId, subjectId, quizData[0]);

      const existingMetrics = await db
        .select()
        .from(performanceMetrics)
        .where(
          and(
            eq(performanceMetrics.userId, userId),
            eq(performanceMetrics.subjectId, subjectId)
          )
        );

      const metricsData: InsertPerformanceMetric = {
        userId,
        subjectId,
        averageScore: parseFloat(quizData[0].avgScore.toFixed(2)),
        totalQuizzes: quizData[0].totalQuizzes,
        totalStudyTime: Math.round((sessionData[0]?.totalStudyTime || 0) / 60), // Convert to minutes
        weakAreas,
        strongAreas,
        recommendations,
      };

      if (existingMetrics.length > 0) {
        await db
          .update(performanceMetrics)
          .set({ ...metricsData, lastUpdated: new Date() })
          .where(
            and(
              eq(performanceMetrics.userId, userId),
              eq(performanceMetrics.subjectId, subjectId)
            )
          );
      } else {
        await db.insert(performanceMetrics).values(metricsData);
      }
    }
  }

  // Identify weak areas based on quiz performance
  private async identifyWeakAreas(userId: string, subjectId: number): Promise<string[]> {
    const recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.subjectId, subjectId),
          gte(quizAttempts.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      )
      .orderBy(desc(quizAttempts.completedAt))
      .limit(10);

    // Simple heuristic: identify areas where score is below 70%
    const weakAreas: string[] = [];
    const scoreThreshold = 70;

    for (const attempt of recentAttempts) {
      if (attempt.score < scoreThreshold) {
        if (attempt.difficulty === 'hard' && attempt.score < 60) {
          weakAreas.push(`Complex ${attempt.quizType} problems`);
        } else if (attempt.difficulty === 'medium' && attempt.score < 70) {
          weakAreas.push(`Intermediate ${attempt.quizType} concepts`);
        } else if (attempt.difficulty === 'easy' && attempt.score < 80) {
          weakAreas.push(`Basic ${attempt.quizType} fundamentals`);
        }
      }
    }

    return [...new Set(weakAreas)].slice(0, 3); // Return unique weak areas, max 3
  }

  // Identify strong areas
  private async identifyStrongAreas(userId: string, subjectId: number): Promise<string[]> {
    const recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.subjectId, subjectId),
          gte(quizAttempts.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(quizAttempts.completedAt))
      .limit(10);

    const strongAreas: string[] = [];

    for (const attempt of recentAttempts) {
      if (attempt.score >= 85) {
        if (attempt.difficulty === 'hard') {
          strongAreas.push(`Advanced ${attempt.quizType} mastery`);
        } else if (attempt.difficulty === 'medium') {
          strongAreas.push(`Strong ${attempt.quizType} understanding`);
        }
      }
    }

    return [...new Set(strongAreas)].slice(0, 3);
  }

  // Generate AI-powered recommendations
  private async generateRecommendations(userId: string, subjectId: number, performanceData: any): Promise<string[]> {
    try {
      const subject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, subjectId));

      const prompt = `Based on the following student performance data, provide 3 specific learning recommendations:

Subject: ${subject[0]?.name || 'Unknown'}
Average Score: ${performanceData.avgScore}%
Total Quizzes: ${performanceData.totalQuizzes}
Total Study Time: ${Math.round((performanceData.totalTime || 0) / 60)} minutes

Generate concise, actionable recommendations to improve learning outcomes. Focus on specific study strategies, practice areas, or learning techniques.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const recommendations = response.text?.split('\n')
        .filter(line => line.trim() && (line.includes('1.') || line.includes('2.') || line.includes('3.') || line.includes('-')))
        .map(line => line.replace(/^\d+\.|\s*-\s*/, '').trim())
        .slice(0, 3) || [];

      return recommendations.length > 0 ? recommendations : [
        "Focus on consistent daily practice",
        "Review challenging topics more frequently", 
        "Try different learning methods like visual aids"
      ];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        "Focus on consistent daily practice",
        "Review challenging topics more frequently",
        "Try different learning methods like visual aids"
      ];
    }
  }

  // Get comprehensive analytics data
  async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    // Get learning streak
    const [streakData] = await db
      .select()
      .from(learningStreaks)
      .where(eq(learningStreaks.userId, userId));

    // Get overall performance
    const [overallPerf] = await db
      .select({
        avgScore: sql<number>`AVG(${quizAttempts.score})`.as('avgScore'),
        totalQuizzes: sql<number>`COUNT(*)`.as('totalQuizzes'),
        totalStudyTime: sql<number>`SUM(${studySessions.duration})`.as('totalStudyTime'),
      })
      .from(quizAttempts)
      .leftJoin(studySessions, eq(quizAttempts.userId, studySessions.userId))
      .where(eq(quizAttempts.userId, userId));

    // Get weekly progress (last 7 days)
    const weeklyProgress = await this.getWeeklyProgress(userId);

    // Get subject performance
    const subjectPerformance = await this.getSubjectPerformance(userId);

    // Generate insights
    const insights = await this.generateInsights(userId, overallPerf, streakData);

    // Get recommendations from performance metrics
    const allRecommendations = await db
      .select({ recommendations: performanceMetrics.recommendations })
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId));

    const recommendations = allRecommendations
      .flatMap(r => r.recommendations || [])
      .slice(0, 5);

    return {
      totalStudyTime: Math.round((overallPerf?.totalStudyTime || 0) / 60),
      averageScore: parseFloat((overallPerf?.avgScore || 0).toFixed(1)),
      totalQuizzes: overallPerf?.totalQuizzes || 0,
      currentStreak: streakData?.currentStreak || 0,
      longestStreak: streakData?.longestStreak || 0,
      weeklyProgress,
      subjectPerformance,
      insights,
      recommendations: recommendations.length > 0 ? recommendations : [
        "Take regular quizzes to track progress",
        "Focus on your weaker subjects",
        "Maintain a consistent study schedule"
      ],
    };
  }

  // Get weekly progress data
  private async getWeeklyProgress(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const progressData = await db
      .select({
        date: sql<string>`DATE(${studySessions.completedAt})`.as('date'),
        studyTime: sql<number>`SUM(${studySessions.duration})`.as('studyTime'),
        quizzes: sql<number>`COUNT(${quizAttempts.id})`.as('quizzes'),
        avgScore: sql<number>`AVG(${quizAttempts.score})`.as('avgScore'),
      })
      .from(studySessions)
      .leftJoin(quizAttempts, and(
        eq(studySessions.userId, quizAttempts.userId),
        sql`DATE(${studySessions.completedAt}) = DATE(${quizAttempts.completedAt})`
      ))
      .where(
        and(
          eq(studySessions.userId, userId),
          gte(studySessions.completedAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${studySessions.completedAt})`)
      .orderBy(asc(sql`DATE(${studySessions.completedAt})`));

    // Fill in missing days with zero values
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = progressData.find(p => p.date === dateStr);
      weeklyProgress.push({
        date: dateStr,
        studyTime: Math.round((dayData?.studyTime || 0) / 60),
        quizzes: dayData?.quizzes || 0,
        score: parseFloat((dayData?.avgScore || 0).toFixed(1)),
      });
    }

    return weeklyProgress;
  }

  // Get subject-wise performance
  private async getSubjectPerformance(userId: string) {
    const subjectData = await db
      .select({
        subjectId: subjects.id,
        subjectName: subjects.name,
        averageScore: performanceMetrics.averageScore,
        totalQuizzes: performanceMetrics.totalQuizzes,
        studyTime: performanceMetrics.totalStudyTime,
        strongAreas: performanceMetrics.strongAreas,
        weakAreas: performanceMetrics.weakAreas,
      })
      .from(performanceMetrics)
      .innerJoin(subjects, eq(performanceMetrics.subjectId, subjects.id))
      .where(eq(performanceMetrics.userId, userId));

    return subjectData.map(data => ({
      subjectName: data.subjectName,
      averageScore: parseFloat(data.averageScore?.toString() || '0'),
      totalQuizzes: data.totalQuizzes,
      studyTime: data.studyTime,
      strongAreas: data.strongAreas || [],
      weakAreas: data.weakAreas || [],
    }));
  }

  // Generate performance insights
  private async generateInsights(userId: string, overallPerf: any, streakData: any): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // Streak insights
    if (streakData?.currentStreak >= 7) {
      insights.push({
        category: 'achievement',
        title: 'Excellent Consistency!',
        description: `You've maintained a ${streakData.currentStreak}-day study streak.`,
        suggestion: 'Keep up the momentum and try to beat your longest streak!'
      });
    } else if (streakData?.currentStreak >= 3) {
      insights.push({
        category: 'improvement',
        title: 'Building Good Habits',
        description: `You're on a ${streakData.currentStreak}-day streak.`,
        suggestion: 'Try to study a little each day to build consistency.'
      });
    }

    // Performance insights
    if (overallPerf?.avgScore >= 85) {
      insights.push({
        category: 'strength',
        title: 'Outstanding Performance',
        description: `Your average score of ${overallPerf.avgScore.toFixed(1)}% shows excellent mastery.`,
        suggestion: 'Consider tackling more challenging topics or helping others learn.'
      });
    } else if (overallPerf?.avgScore >= 70) {
      insights.push({
        category: 'improvement',
        title: 'Good Progress',
        description: `Your average score of ${overallPerf.avgScore.toFixed(1)}% shows solid understanding.`,
        suggestion: 'Focus on your weak areas to push your average above 85%.'
      });
    } else if (overallPerf?.avgScore < 70) {
      insights.push({
        category: 'weakness',
        title: 'Room for Improvement',
        description: `Your average score of ${overallPerf.avgScore.toFixed(1)}% suggests you need more practice.`,
        suggestion: 'Try starting with easier topics and gradually increase difficulty.'
      });
    }

    // Study time insights
    if (overallPerf?.totalStudyTime && overallPerf.totalStudyTime > 3600) { // > 1 hour
      insights.push({
        category: 'achievement',
        title: 'Dedicated Learner',
        description: `You've spent ${Math.round(overallPerf.totalStudyTime / 3600)} hours studying.`,
        suggestion: 'Make sure to take breaks and vary your study methods.'
      });
    }

    return insights.slice(0, 4); // Return max 4 insights
  }
}

export const analyticsService = new AnalyticsService();