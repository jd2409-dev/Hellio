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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
    const [meeting] = await db.insert(aiMeetings).values(meetingData).returning();
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
}

export const storage = new DatabaseStorage();
