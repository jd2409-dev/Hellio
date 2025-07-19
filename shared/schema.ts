import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  xp: integer("xp").default(0),
  coins: integer("coins").default(0),
  level: integer("level").default(1),
  studyStreak: integer("study_streak").default(0),
  board: varchar("board"), // CBSE, ICSE, GCSE, IB, State Board
  gradeLevel: integer("grade_level"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-book"),
  color: varchar("color").default("#50C878"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSubjects = pgTable("user_subjects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  progress: decimal("progress").default("0"),
  studyTime: integer("study_time").default(0), // in minutes
  averageScore: decimal("average_score").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const textbooks = pgTable("textbooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  subjectId: integer("subject_id").references(() => subjects.id),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  title: varchar("title").notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  answers: jsonb("answers").notNull(), // User's answers
  score: decimal("score").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-trophy"),
  color: varchar("color").default("#FFD700"),
  requirement: jsonb("requirement").notNull(), // Conditions to unlock
  xpReward: integer("xp_reward").default(100),
  coinReward: integer("coin_reward").default(50),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics and Performance Tracking Tables
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  activityType: varchar("activity_type").notNull(), // 'quiz', 'chat', 'textbook_upload'
  duration: integer("duration").notNull(), // in seconds
  xpEarned: integer("xp_earned").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const learningStreaks = pgTable("learning_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).notNull(),
  totalQuizzes: integer("total_quizzes").notNull(),
  totalStudyTime: integer("total_study_time").notNull(), // in minutes
  weakAreas: jsonb("weak_areas").$type<string[]>().default([]),
  strongAreas: jsonb("strong_areas").$type<string[]>().default([]),
  recommendations: jsonb("recommendations").$type<string[]>().default([]),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userSubjects: many(userSubjects),
  textbooks: many(textbooks),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  userAchievements: many(userAchievements),
  chatSessions: many(chatSessions),
  studySessions: many(studySessions),
  performanceMetrics: many(performanceMetrics),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  userSubjects: many(userSubjects),
  textbooks: many(textbooks),
  quizzes: many(quizzes),
}));

export const userSubjectsRelations = relations(userSubjects, ({ one }) => ({
  user: one(users, { fields: [userSubjects.userId], references: [users.id] }),
  subject: one(subjects, { fields: [userSubjects.subjectId], references: [subjects.id] }),
}));

export const textbooksRelations = relations(textbooks, ({ one }) => ({
  user: one(users, { fields: [textbooks.userId], references: [users.id] }),
  subject: one(subjects, { fields: [textbooks.subjectId], references: [subjects.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, { fields: [quizzes.userId], references: [users.id] }),
  subject: one(subjects, { fields: [quizzes.subjectId], references: [subjects.id] }),
  attempts: many(quizAttempts),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, { fields: [studySessions.userId], references: [users.id] }),
  subject: one(subjects, { fields: [studySessions.subjectId], references: [subjects.id] }),
}));

export const learningStreaksRelations = relations(learningStreaks, ({ one }) => ({
  user: one(users, { fields: [learningStreaks.userId], references: [users.id] }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, { fields: [performanceMetrics.userId], references: [users.id] }),
  subject: one(subjects, { fields: [performanceMetrics.subjectId], references: [subjects.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertTextbookSchema = createInsertSchema(textbooks).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertUserSubjectSchema = createInsertSchema(userSubjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  completedAt: true,
});

export const insertLearningStreakSchema = createInsertSchema(learningStreaks).omit({
  id: true,
  updatedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type UserSubject = typeof userSubjects.$inferSelect;
export type InsertUserSubject = z.infer<typeof insertUserSubjectSchema>;
export type Textbook = typeof textbooks.$inferSelect;
export type InsertTextbook = z.infer<typeof insertTextbookSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type LearningStreak = typeof learningStreaks.$inferSelect;
export type InsertLearningStreak = z.infer<typeof insertLearningStreakSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
