import {
  users,
  subjects,
  userSubjects,
  textbooks,
  quizzes,
  quizAttempts,
  achievements,
  userAchievements,
  chatSessions,
  aiMeetings,
  meetingMessages,
  studyPlans,
  studyPlanReminders,
  pomodoroSessions,

  type User,
  type UpsertUser,
  type Subject,
  type InsertSubject,
  type UserSubject,
  type InsertUserSubject,
  type Textbook,
  type InsertTextbook,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Achievement,
  type UserAchievement,
  type ChatSession,
  type AIMeeting,
  type InsertAIMeeting,
  type MeetingMessage,
  type InsertMeetingMessage,
  type StudyPlan,
  type InsertStudyPlan,
  type StudyPlanReminder,
  type InsertStudyPlanReminder,
  type PomodoroSession,
  type InsertPomodoroSession,

  type TimeCapsule,
  type InsertTimeCapsule,
  type TimeCapsuleReminder,
  type InsertTimeCapsuleReminder,
  timeCapsules,
  timeCapsuleReminders,
  type PeerChallenge,
  type InsertPeerChallenge,
  type ChallengeAttempt,
  type InsertChallengeAttempt,
  type ChallengeLeaderboard,
  type InsertChallengeLeaderboard,
  peerChallenges,
  challengeAttempts,
  challengeLeaderboards,

} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Subject operations
  getSubjects(): Promise<Subject[]>;
  getSubjectByName(name: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // User subject operations
  getUserSubjects(userId: string): Promise<UserSubject[]>;
  updateUserSubject(userId: string, subjectId: number, data: Partial<InsertUserSubject>): Promise<UserSubject>;
  
  // Textbook operations
  createTextbook(textbook: InsertTextbook): Promise<Textbook>;
  getUserTextbooks(userId: string): Promise<Textbook[]>;
  getTextbook(id: number): Promise<Textbook | undefined>;
  updateTextbook(id: number, data: Partial<InsertTextbook>): Promise<Textbook>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getUserQuizzes(userId: string, subjectId?: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement>;
  
  // Chat operations
  getChatSession(userId: string): Promise<ChatSession | undefined>;
  updateChatSession(userId: string, messages: any[]): Promise<ChatSession>;
  
  // AI Meeting operations
  createMeeting(meeting: InsertAIMeeting): Promise<AIMeeting>;
  getUserMeetings(userId: string): Promise<AIMeeting[]>;
  getMeeting(id: number): Promise<AIMeeting | undefined>;
  updateMeetingStatus(id: number, status: 'scheduled' | 'active' | 'completed', timestamp?: Date): Promise<AIMeeting>;
  
  // Meeting Message operations
  createMeetingMessage(message: InsertMeetingMessage): Promise<MeetingMessage>;
  getMeetingMessages(meetingId: number): Promise<MeetingMessage[]>;

  // Study Plan operations
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getUserStudyPlans(userId: string): Promise<StudyPlan[]>;
  getStudyPlan(id: number): Promise<StudyPlan | undefined>;
  updateStudyPlan(id: number, data: Partial<InsertStudyPlan>): Promise<StudyPlan>;
  deleteStudyPlan(id: number): Promise<void>;
  
  // Study Plan Reminder operations
  createStudyPlanReminder(reminder: InsertStudyPlanReminder): Promise<StudyPlanReminder>;
  getStudyPlanReminders(studyPlanId: number): Promise<StudyPlanReminder[]>;
  
  // Pomodoro Session operations
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  getUserPomodoroSessions(userId: string): Promise<PomodoroSession[]>;
  getPomodoroSession(id: number): Promise<PomodoroSession | undefined>;
  updatePomodoroSession(id: number, data: Partial<InsertPomodoroSession>): Promise<PomodoroSession>;
  getPomodoroStats(userId: string): Promise<any>;
  


  // Time Capsule operations
  createTimeCapsule(capsule: InsertTimeCapsule): Promise<TimeCapsule>;
  getUserTimeCapsules(userId: string): Promise<TimeCapsule[]>;
  getTimeCapsule(id: number): Promise<TimeCapsule | undefined>;
  updateTimeCapsule(id: number, data: Partial<InsertTimeCapsule>): Promise<TimeCapsule>;
  reflectOnTimeCapsule(id: number, reflectionData: { reflectionNotes: string; currentUnderstanding: string; growthInsights: string }): Promise<TimeCapsule>;
  getTimeCapsulesDueForReflection(): Promise<TimeCapsule[]>;
  
  // Time Capsule Reminder operations
  createTimeCapsuleReminder(reminder: InsertTimeCapsuleReminder): Promise<TimeCapsuleReminder>;
  getTimeCapsuleReminders(timeCapsuleId: number): Promise<TimeCapsuleReminder[]>;
  markReminderAsSent(id: number): Promise<TimeCapsuleReminder>;

  // Peer Challenge operations
  createPeerChallenge(challenge: InsertPeerChallenge): Promise<PeerChallenge>;
  getPeerChallenge(challengeId: string): Promise<PeerChallenge | undefined>;
  getUserCreatedChallenges(userId: string): Promise<PeerChallenge[]>;
  getPublicChallenges(limit?: number): Promise<PeerChallenge[]>;
  searchChallenges(query: string, subject?: string): Promise<PeerChallenge[]>;
  
  // Challenge Attempt operations
  createChallengeAttempt(attempt: InsertChallengeAttempt): Promise<ChallengeAttempt>;
  getChallengeAttempts(challengeId: string): Promise<ChallengeAttempt[]>;
  getUserChallengeAttempts(userId: string, challengeId: string): Promise<ChallengeAttempt[]>;
  
  // Challenge Leaderboard operations
  updateLeaderboard(leaderboard: InsertChallengeLeaderboard): Promise<ChallengeLeaderboard>;
  getChallengeLeaderboard(challengeId: string, limit?: number): Promise<ChallengeLeaderboard[]>;

  // Analytics and Stats operations
  getUserStats(userId: string): Promise<any>;
  updateStudyStreak(userId: string): Promise<void>;
  getTotalStudyTime(userId: string): Promise<number>;
  getSubjectProgress(userId: string): Promise<any[]>;
  calculateAverageQuizScore(userId: string): Promise<number>;
  getTotalAchievements(userId: string): Promise<number>;
  trackStudyActivity(userId: string, activityType: string, duration: number, subjectId?: number): Promise<void>;


}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }
  
  async getSubjectByName(name: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.name, name));
    return subject;
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }
  
  // User subject operations
  async getUserSubjects(userId: string): Promise<UserSubject[]> {
    return await db.select().from(userSubjects).where(eq(userSubjects.userId, userId));
  }
  
  async updateUserSubject(userId: string, subjectId: number, data: Partial<InsertUserSubject>): Promise<UserSubject> {
    const [updated] = await db
      .update(userSubjects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(userSubjects.userId, userId), eq(userSubjects.subjectId, subjectId)))
      .returning();
    return updated;
  }
  
  // Textbook operations
  async createTextbook(textbook: InsertTextbook): Promise<Textbook> {
    const [newTextbook] = await db.insert(textbooks).values(textbook).returning();
    return newTextbook;
  }
  
  async getUserTextbooks(userId: string): Promise<Textbook[]> {
    return await db.select().from(textbooks).where(eq(textbooks.userId, userId)).orderBy(desc(textbooks.createdAt));
  }
  
  async getTextbook(id: number): Promise<Textbook | undefined> {
    const [textbook] = await db.select().from(textbooks).where(eq(textbooks.id, id));
    return textbook;
  }

  async updateTextbook(id: number, data: Partial<InsertTextbook>): Promise<Textbook> {
    const [updated] = await db
      .update(textbooks)
      .set(data)
      .where(eq(textbooks.id, id))
      .returning();
    return updated;
  }
  
  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }
  
  async getUserQuizzes(userId: string, subjectId?: number): Promise<Quiz[]> {
    if (subjectId) {
      return await db.select().from(quizzes)
        .where(and(eq(quizzes.userId, userId), eq(quizzes.subjectId, subjectId)))
        .orderBy(desc(quizzes.createdAt));
    }
    
    return await db.select().from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt));
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }
  
  // Quiz attempt operations
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }
  
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  }
  
  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }
  
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.unlockedAt));
  }
  
  async unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement> {
    const [newAchievement] = await db.insert(userAchievements).values({
      userId,
      achievementId,
    }).returning();
    return newAchievement;
  }
  
  // Chat operations
  async getChatSession(userId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt));
    return session;
  }
  
  async updateChatSession(userId: string, messages: any[]): Promise<ChatSession> {
    const existingSession = await this.getChatSession(userId);
    
    if (existingSession) {
      const [updated] = await db
        .update(chatSessions)
        .set({ messages, updatedAt: new Date() })
        .where(eq(chatSessions.id, existingSession.id))
        .returning();
      return updated;
    } else {
      const [newSession] = await db.insert(chatSessions).values({
        userId,
        messages,
      }).returning();
      return newSession;
    }
  }
  
  // AI Meeting operations
  async createMeeting(meetingData: InsertAIMeeting): Promise<AIMeeting> {
    const [meeting] = await db.insert(aiMeetings).values([meetingData]).returning();
    return meeting;
  }
  
  async getUserMeetings(userId: string): Promise<AIMeeting[]> {
    return await db.select().from(aiMeetings).where(eq(aiMeetings.userId, userId)).orderBy(desc(aiMeetings.createdAt));
  }
  
  async getMeeting(id: number): Promise<AIMeeting | undefined> {
    const [meeting] = await db.select().from(aiMeetings).where(eq(aiMeetings.id, id));
    return meeting;
  }
  
  async updateMeetingStatus(id: number, status: 'scheduled' | 'active' | 'completed', timestamp?: Date): Promise<AIMeeting> {
    const updateData: any = { status };
    
    if (status === 'active') {
      updateData.startedAt = timestamp || new Date();
    } else if (status === 'completed') {
      updateData.completedAt = timestamp || new Date();
    }
    
    const [updated] = await db
      .update(aiMeetings)
      .set(updateData)
      .where(eq(aiMeetings.id, id))
      .returning();
    return updated;
  }
  
  // Meeting Message operations
  async createMeetingMessage(messageData: InsertMeetingMessage): Promise<MeetingMessage> {
    const [message] = await db.insert(meetingMessages).values(messageData).returning();
    return message;
  }
  
  async getMeetingMessages(meetingId: number): Promise<MeetingMessage[]> {
    return await db.select().from(meetingMessages).where(eq(meetingMessages.meetingId, meetingId)).orderBy(meetingMessages.timestamp);
  }

  // Study Plan operations
  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const [created] = await db.insert(studyPlans).values(plan).returning();
    return created;
  }

  async getUserStudyPlans(userId: string): Promise<StudyPlan[]> {
    return db.select({
      id: studyPlans.id,
      userId: studyPlans.userId,
      subjectId: studyPlans.subjectId,
      title: studyPlans.title,
      description: studyPlans.description,
      plannedDate: studyPlans.plannedDate,
      duration: studyPlans.duration,
      priority: studyPlans.priority,
      studyType: studyPlans.studyType,
      status: studyPlans.status,
      completedAt: studyPlans.completedAt,
      reminderSet: studyPlans.reminderSet,
      aiGenerated: studyPlans.aiGenerated,
      createdAt: studyPlans.createdAt,
      updatedAt: studyPlans.updatedAt,
      subject: {
        id: subjects.id,
        name: subjects.name,
        description: subjects.description,
      }
    })
    .from(studyPlans)
    .leftJoin(subjects, eq(studyPlans.subjectId, subjects.id))
    .where(eq(studyPlans.userId, userId))
    .orderBy(studyPlans.plannedDate);
  }

  async getStudyPlan(id: number): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.id, id));
    return plan;
  }

  async updateStudyPlan(id: number, data: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const [updated] = await db.update(studyPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studyPlans.id, id))
      .returning();
    return updated;
  }

  async deleteStudyPlan(id: number): Promise<void> {
    await db.delete(studyPlans).where(eq(studyPlans.id, id));
  }

  // Study Plan Reminder operations
  async createStudyPlanReminder(reminder: InsertStudyPlanReminder): Promise<StudyPlanReminder> {
    const [created] = await db.insert(studyPlanReminders).values(reminder).returning();
    return created;
  }

  async getStudyPlanReminders(studyPlanId: number): Promise<StudyPlanReminder[]> {
    return db.select().from(studyPlanReminders).where(eq(studyPlanReminders.studyPlanId, studyPlanId));
  }

  // Pomodoro Session operations
  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [created] = await db.insert(pomodoroSessions).values(session).returning();
    return created;
  }

  async getUserPomodoroSessions(userId: string): Promise<PomodoroSession[]> {
    return db.select().from(pomodoroSessions)
      .where(eq(pomodoroSessions.userId, userId))
      .orderBy(desc(pomodoroSessions.createdAt));
  }

  async getPomodoroSession(id: number): Promise<PomodoroSession | undefined> {
    const [session] = await db.select().from(pomodoroSessions).where(eq(pomodoroSessions.id, id));
    return session;
  }

  async updatePomodoroSession(id: number, data: Partial<InsertPomodoroSession>): Promise<PomodoroSession> {
    const [updated] = await db.update(pomodoroSessions)
      .set(data)
      .where(eq(pomodoroSessions.id, id))
      .returning();
    return updated;
  }

  async getPomodoroStats(userId: string): Promise<any> {
    const sessions = await db.select().from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, userId), eq(pomodoroSessions.status, 'completed')));
    
    const totalSessions = sessions.length;
    const totalFocusTime = sessions
      .filter(s => s.sessionType === 'work')
      .reduce((acc, s) => acc + (s.actualDuration || s.duration * 60), 0);
    
    return {
      totalSessions,
      totalFocusTime: Math.floor(totalFocusTime / 60), // in minutes
      averageSession: totalSessions > 0 ? Math.floor(totalFocusTime / totalSessions / 60) : 0,
    };
  }



  // Time Capsule operations
  async createTimeCapsule(capsule: InsertTimeCapsule): Promise<TimeCapsule> {
    const [newCapsule] = await db.insert(timeCapsules).values(capsule).returning();
    return newCapsule;
  }

  async getUserTimeCapsules(userId: string): Promise<TimeCapsule[]> {
    return await db.select().from(timeCapsules)
      .where(eq(timeCapsules.userId, userId))
      .orderBy(desc(timeCapsules.createdAt));
  }

  async getTimeCapsule(id: number): Promise<TimeCapsule | undefined> {
    const [capsule] = await db.select().from(timeCapsules).where(eq(timeCapsules.id, id));
    return capsule;
  }

  async updateTimeCapsule(id: number, data: Partial<InsertTimeCapsule>): Promise<TimeCapsule> {
    const [updated] = await db.update(timeCapsules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeCapsules.id, id))
      .returning();
    return updated;
  }

  async reflectOnTimeCapsule(id: number, reflectionData: { reflectionNotes: string; currentUnderstanding: string; growthInsights: string }): Promise<TimeCapsule> {
    const [updated] = await db.update(timeCapsules)
      .set({
        ...reflectionData,
        status: 'reflected',
        reflectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timeCapsules.id, id))
      .returning();
    return updated;
  }

  async getTimeCapsulesDueForReflection(): Promise<TimeCapsule[]> {
    return await db.select().from(timeCapsules)
      .where(and(
        eq(timeCapsules.status, 'active'),
        lte(timeCapsules.reflectionDate, new Date())
      ));
  }

  // Time Capsule Reminder operations
  async createTimeCapsuleReminder(reminder: InsertTimeCapsuleReminder): Promise<TimeCapsuleReminder> {
    const [newReminder] = await db.insert(timeCapsuleReminders).values(reminder).returning();
    return newReminder;
  }

  async getTimeCapsuleReminders(timeCapsuleId: number): Promise<TimeCapsuleReminder[]> {
    return await db.select().from(timeCapsuleReminders)
      .where(eq(timeCapsuleReminders.timeCapsuleId, timeCapsuleId))
      .orderBy(desc(timeCapsuleReminders.reminderDate));
  }

  async markReminderAsSent(id: number): Promise<TimeCapsuleReminder> {
    const [updated] = await db.update(timeCapsuleReminders)
      .set({ sent: true })
      .where(eq(timeCapsuleReminders.id, id))
      .returning();
    return updated;
  }

  // Peer Challenge operations
  async createPeerChallenge(challenge: InsertPeerChallenge): Promise<PeerChallenge> {
    const [newChallenge] = await db.insert(peerChallenges).values(challenge).returning();
    return newChallenge;
  }

  async getPeerChallenge(challengeId: string): Promise<PeerChallenge | undefined> {
    const [challenge] = await db.select().from(peerChallenges)
      .where(eq(peerChallenges.challengeId, challengeId));
    return challenge;
  }

  async getUserCreatedChallenges(userId: string): Promise<PeerChallenge[]> {
    return await db.select().from(peerChallenges)
      .where(eq(peerChallenges.creatorId, userId))
      .orderBy(desc(peerChallenges.createdAt));
  }

  async getPublicChallenges(limit: number = 20): Promise<PeerChallenge[]> {
    return await db.select().from(peerChallenges)
      .where(eq(peerChallenges.isPublic, true))
      .orderBy(desc(peerChallenges.createdAt))
      .limit(limit);
  }

  async searchChallenges(query: string, subject?: string): Promise<PeerChallenge[]> {
    let whereCondition = and(
      eq(peerChallenges.isPublic, true),
      // Simple text search in title and description
    );

    if (subject) {
      const subjectRecord = await this.getSubjectByName(subject);
      if (subjectRecord) {
        whereCondition = and(
          whereCondition,
          eq(peerChallenges.subjectId, subjectRecord.id)
        );
      }
    }

    return await db.select().from(peerChallenges)
      .where(whereCondition)
      .orderBy(desc(peerChallenges.createdAt))
      .limit(20);
  }

  // Challenge Attempt operations
  async createChallengeAttempt(attempt: InsertChallengeAttempt): Promise<ChallengeAttempt> {
    const [newAttempt] = await db.insert(challengeAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getChallengeAttempts(challengeId: string): Promise<ChallengeAttempt[]> {
    return await db.select().from(challengeAttempts)
      .where(eq(challengeAttempts.challengeId, challengeId))
      .orderBy(desc(challengeAttempts.completedAt));
  }

  async getUserChallengeAttempts(userId: string, challengeId: string): Promise<ChallengeAttempt[]> {
    return await db.select().from(challengeAttempts)
      .where(and(
        eq(challengeAttempts.participantId, userId),
        eq(challengeAttempts.challengeId, challengeId)
      ))
      .orderBy(desc(challengeAttempts.completedAt));
  }

  // Challenge Leaderboard operations
  async updateLeaderboard(leaderboardData: InsertChallengeLeaderboard): Promise<ChallengeLeaderboard> {
    // Check if entry exists
    const [existing] = await db.select().from(challengeLeaderboards)
      .where(and(
        eq(challengeLeaderboards.challengeId, leaderboardData.challengeId),
        eq(challengeLeaderboards.participantId, leaderboardData.participantId)
      ));

    if (existing) {
      // Update existing entry if new score is better
      if (parseFloat(leaderboardData.bestScore.toString()) > parseFloat(existing.bestScore.toString())) {
        const [updated] = await db.update(challengeLeaderboards)
          .set({
            bestScore: leaderboardData.bestScore,
            bestTime: leaderboardData.bestTime,
            attemptCount: (existing.attemptCount || 0) + 1,
            lastAttemptAt: new Date(),
          })
          .where(eq(challengeLeaderboards.id, existing.id))
          .returning();
        return updated;
      } else {
        // Just update attempt count
        const [updated] = await db.update(challengeLeaderboards)
          .set({
            attemptCount: (existing.attemptCount || 0) + 1,
            lastAttemptAt: new Date(),
          })
          .where(eq(challengeLeaderboards.id, existing.id))
          .returning();
        return updated;
      }
    } else {
      // Create new entry
      const [newEntry] = await db.insert(challengeLeaderboards)
        .values(leaderboardData)
        .returning();
      return newEntry;
    }
  }

  async getChallengeLeaderboard(challengeId: string, limit: number = 10): Promise<ChallengeLeaderboard[]> {
    return await db.select().from(challengeLeaderboards)
      .where(eq(challengeLeaderboards.challengeId, challengeId))
      .orderBy(desc(challengeLeaderboards.bestScore), challengeLeaderboards.bestTime)
      .limit(limit);
  }

  // Analytics and Stats operations
  async getUserStats(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    // Calculate total study time from all activities
    const totalStudyTime = await this.getTotalStudyTime(userId);
    
    // Calculate average quiz score
    const averageQuizScore = await this.calculateAverageQuizScore(userId);
    
    // Get total achievements
    const totalAchievements = await this.getTotalAchievements(userId);
    
    // Update and get current study streak
    await this.updateStudyStreak(userId);
    const updatedUser = await this.getUser(userId);

    return {
      xp: updatedUser?.xp || 0,
      coins: updatedUser?.coins || 0,
      level: updatedUser?.level || 1,
      studyStreak: updatedUser?.studyStreak || 0,
      totalStudyTime,
      averageQuizScore,
      totalAchievements,
    };
  }

  async updateStudyStreak(userId: string): Promise<void> {
    // Check if user has any activity today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check pomodoro sessions, quiz attempts, and study plans completed today
    const todayActivity = await Promise.all([
      db.select().from(pomodoroSessions)
        .where(
          and(
            eq(pomodoroSessions.userId, userId),
            eq(pomodoroSessions.status, 'completed'),
            sql`${pomodoroSessions.completedAt} >= ${today}`,
            sql`${pomodoroSessions.completedAt} < ${tomorrow}`
          )
        ).limit(1),
      
      db.select().from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            sql`${quizAttempts.completedAt} >= ${today}`,
            sql`${quizAttempts.completedAt} < ${tomorrow}`
          )
        ).limit(1)
    ]);

    const hasActivityToday = todayActivity.some(activity => activity.length > 0);
    
    const user = await this.getUser(userId);
    if (!user) return;

    let newStreak = user.studyStreak || 0;
    
    if (hasActivityToday) {
      // Check if streak should continue (activity yesterday or today is first day)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayActivity = await Promise.all([
        db.select().from(pomodoroSessions)
          .where(
            and(
              eq(pomodoroSessions.userId, userId),
              eq(pomodoroSessions.status, 'completed'),
              sql`${pomodoroSessions.completedAt} >= ${yesterday}`,
              sql`${pomodoroSessions.completedAt} < ${today}`
            )
          ).limit(1),
        
        db.select().from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.userId, userId),
              sql`${quizAttempts.completedAt} >= ${yesterday}`,
              sql`${quizAttempts.completedAt} < ${today}`
            )
          ).limit(1)
      ]);

      const hasActivityYesterday = yesterdayActivity.some(activity => activity.length > 0);
      
      if (hasActivityYesterday || newStreak === 0) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset streak if gap found
      }
    }

    await this.upsertUser({
      ...user,
      studyStreak: newStreak,
    });
  }

  async getTotalStudyTime(userId: string): Promise<number> {
    // Get time from completed pomodoro sessions (in seconds)
    const pomodoroTime = await db.select({
      totalTime: sql<number>`COALESCE(SUM(${pomodoroSessions.actualDuration}), 0)`
    })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        eq(pomodoroSessions.status, 'completed')
      )
    );

    // Get time from quiz attempts (convert to seconds)
    const quizTime = await db.select({
      totalTime: sql<number>`COALESCE(SUM(${quizAttempts.timeSpent}), 0)`
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

    // Get time from AI meetings
    const meetingTime = await db.select({
      totalTime: sql<number>`COALESCE(SUM(${aiMeetings.duration} * 60), 0)`
    })
    .from(aiMeetings)
    .where(
      and(
        eq(aiMeetings.userId, userId),
        eq(aiMeetings.status, 'completed')
      )
    );

    const totalSeconds = (pomodoroTime[0]?.totalTime || 0) + 
                        (quizTime[0]?.totalTime || 0) + 
                        (meetingTime[0]?.totalTime || 0);
    
    return Math.round(totalSeconds / 60); // Return in minutes
  }

  async getSubjectProgress(userId: string): Promise<any[]> {
    const subjects = await this.getSubjects();
    const userSubjects = await this.getUserSubjects(userId);
    
    const progress = await Promise.all(subjects.map(async (subject) => {
      // Calculate progress based on activities
      const quizCount = await db.select({ count: sql<number>`COUNT(*)` })
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            eq(quizAttempts.subject, subject.name)
          )
        );

      const avgScore = await db.select({ 
        avg: sql<number>`COALESCE(AVG(CAST(${quizAttempts.score} AS DECIMAL)), 0)` 
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.subject, subject.name)
        )
      );

      const studyTime = await db.select({
        time: sql<number>`COALESCE(SUM(${pomodoroSessions.actualDuration}), 0)`
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          eq(pomodoroSessions.subjectId, subject.id),
          eq(pomodoroSessions.status, 'completed')
        )
      );

      const userSubject = userSubjects.find(us => us.subjectId === subject.id);
      
      return {
        ...subject,
        progress: Math.min(Math.round((avgScore[0]?.avg || 0)), 100),
        averageScore: Math.round(avgScore[0]?.avg || 0),
        studyTime: Math.round((studyTime[0]?.time || 0) / 60), // minutes
        quizCount: quizCount[0]?.count || 0,
      };
    }));

    return progress;
  }

  async calculateAverageQuizScore(userId: string): Promise<number> {
    const result = await db.select({ 
      avg: sql<number>`COALESCE(AVG(CAST(${quizAttempts.score} AS DECIMAL)), 0)` 
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

    return Math.round(result[0]?.avg || 0);
  }

  async getTotalAchievements(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    return result[0]?.count || 0;
  }

  async trackStudyActivity(userId: string, activityType: string, duration: number, subjectId?: number): Promise<void> {
    // Update study streak
    await this.updateStudyStreak(userId);
    
    // Award XP based on activity
    const user = await this.getUser(userId);
    if (user) {
      const xpGain = Math.ceil(duration / 10); // 1 XP per 10 seconds
      const coinGain = Math.ceil(duration / 60); // 1 coin per minute
      
      await this.upsertUser({
        ...user,
        xp: (user.xp || 0) + xpGain,
        coins: (user.coins || 0) + coinGain,
        level: Math.floor(((user.xp || 0) + xpGain) / 1000) + 1,
      });
    }
  }
}

export const storage = new DatabaseStorage();
