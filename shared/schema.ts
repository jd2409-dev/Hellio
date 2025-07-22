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
  quizId: integer("quiz_id").references(() => quizzes.id), // Can be null for external quizzes
  subject: varchar("subject").notNull(), // Store subject directly
  difficulty: varchar("difficulty").notNull(), // Store difficulty directly
  questionType: varchar("question_type").notNull(), // mcq, fill-blank, etc.
  questions: jsonb("questions").notNull(), // Store the actual questions and correct answers
  answers: jsonb("answers").notNull(), // User's answers
  score: decimal("score").notNull(),
  timeSpent: integer("time_spent").default(0), // Time in seconds
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

export const aiMeetings = pgTable("ai_meetings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: varchar("topic").notNull(),
  subject: varchar("subject").notNull(),
  grade: varchar("grade").notNull(),
  description: text("description"),
  agenda: jsonb("agenda").$type<string[]>().default([]),
  duration: integer("duration").notNull().default(30), // in minutes
  status: varchar("status").notNull().default("scheduled"), // scheduled, active, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetingMessages = pgTable("meeting_messages", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => aiMeetings.id),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
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

// Study Plans table
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  title: varchar("title").notNull(),
  description: text("description"),
  plannedDate: timestamp("planned_date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  priority: varchar("priority").notNull().default("medium"), // high, medium, low
  studyType: varchar("study_type").notNull().default("reading"), // reading, practice, revision, quiz, project
  status: varchar("status").notNull().default("pending"), // pending, completed, skipped
  completedAt: timestamp("completed_at"),
  reminderSet: boolean("reminder_set").default(false),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study Plan Reminders table
export const studyPlanReminders = pgTable("study_plan_reminders", {
  id: serial("id").primaryKey(),
  studyPlanId: integer("study_plan_id").notNull().references(() => studyPlans.id),
  reminderTime: timestamp("reminder_time").notNull(),
  reminderType: varchar("reminder_type").notNull().default("notification"), // notification, email
  message: text("message"),
  sent: boolean("sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pomodoro Timer Sessions table
export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  sessionType: varchar("session_type").notNull().default("work"), // work, short_break, long_break
  duration: integer("duration").notNull(), // in minutes
  actualDuration: integer("actual_duration"), // actual time spent in seconds
  status: varchar("status").notNull().default("pending"), // pending, active, completed, paused, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  pausedTime: integer("paused_time").default(0), // cumulative paused time in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// PDF Drive Books table - for storing search results and user library
export const pdfDriveBooks = pgTable("pdf_drive_books", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  author: varchar("author"),
  pages: integer("pages"),
  year: varchar("year"),
  size: varchar("size"),
  extension: varchar("extension").default("pdf"),
  preview: text("preview"),
  downloadUrl: text("download_url"),
  imageUrl: text("image_url"),
  category: varchar("category"),
  language: varchar("language").default("english"),
  searchKeywords: jsonb("search_keywords").$type<string[]>().default([]),
  popularity: integer("popularity").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User PDF Drive Library - books saved by users
export const userPdfLibrary = pgTable("user_pdf_library", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => pdfDriveBooks.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  status: varchar("status").notNull().default("saved"), // saved, downloaded, reading, completed
  progress: integer("progress").default(0), // reading progress in percentage
  notes: text("notes"),
  rating: integer("rating"), // 1-5 star rating
  addedAt: timestamp("added_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

// Time Capsule recordings - for recording concepts to future self
export const timeCapsules = pgTable("time_capsules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  title: varchar("title").notNull(),
  concept: text("concept").notNull(), // The concept being explained
  description: text("description"), // Additional details about the recording
  recordingType: varchar("recording_type").notNull(), // 'video', 'audio', 'text'
  recordingUrl: text("recording_url"), // URL to stored recording file
  transcript: text("transcript"), // Auto-generated or manual transcript
  reflectionPeriod: integer("reflection_period").notNull().default(90), // Days until reflection reminder
  reflectionDate: timestamp("reflection_date").notNull(),
  status: varchar("status").notNull().default("active"), // active, reflected, archived
  reflectedAt: timestamp("reflected_at"),
  reflectionNotes: text("reflection_notes"), // Notes added during reflection
  currentUnderstanding: text("current_understanding"), // Updated understanding after reflection
  growthInsights: text("growth_insights"), // Insights about learning growth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time Capsule reminders for future reflection
export const timeCapsuleReminders = pgTable("time_capsule_reminders", {
  id: serial("id").primaryKey(),
  timeCapsuleId: integer("time_capsule_id").notNull().references(() => timeCapsules.id),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderType: varchar("reminder_type").notNull().default("reflection"), // reflection, follow_up
  message: text("message"),
  sent: boolean("sent").default(false),
  responded: boolean("responded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = typeof studyPlans.$inferInsert;
export type StudyPlanReminder = typeof studyPlanReminders.$inferSelect;
export type InsertStudyPlanReminder = typeof studyPlanReminders.$inferInsert;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = typeof pomodoroSessions.$inferInsert;
export type PdfDriveBook = typeof pdfDriveBooks.$inferSelect;
export type InsertPdfDriveBook = typeof pdfDriveBooks.$inferInsert;
export type UserPdfLibrary = typeof userPdfLibrary.$inferSelect;
export type InsertUserPdfLibrary = typeof userPdfLibrary.$inferInsert;
export type TimeCapsule = typeof timeCapsules.$inferSelect;
export type InsertTimeCapsule = typeof timeCapsules.$inferInsert;
export type TimeCapsuleReminder = typeof timeCapsuleReminders.$inferSelect;
export type InsertTimeCapsuleReminder = typeof timeCapsuleReminders.$inferInsert;

// Create schemas using drizzle-zod
export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudyPlanReminderSchema = createInsertSchema(studyPlanReminders).omit({
  id: true,
  createdAt: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPdfDriveBookSchema = createInsertSchema(pdfDriveBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPdfLibrarySchema = createInsertSchema(userPdfLibrary).omit({
  id: true,
  addedAt: true,
});

export const insertTimeCapsuleSchema = createInsertSchema(timeCapsules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeCapsuleReminderSchema = createInsertSchema(timeCapsuleReminders).omit({
  id: true,
  createdAt: true,
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
  aiMeetings: many(aiMeetings),
  studyPlans: many(studyPlans),
  pomodoroSessions: many(pomodoroSessions),
  userPdfLibrary: many(userPdfLibrary),
  timeCapsules: many(timeCapsules),
}));

export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  user: one(users, { fields: [studyPlans.userId], references: [users.id] }),
  subject: one(subjects, { fields: [studyPlans.subjectId], references: [subjects.id] }),
  reminders: many(studyPlanReminders),
}));

export const studyPlanRemindersRelations = relations(studyPlanReminders, ({ one }) => ({
  studyPlan: one(studyPlans, { fields: [studyPlanReminders.studyPlanId], references: [studyPlans.id] }),
}));

export const aiMeetingsRelations = relations(aiMeetings, ({ one, many }) => ({
  user: one(users, { fields: [aiMeetings.userId], references: [users.id] }),
  messages: many(meetingMessages),
}));

export const meetingMessagesRelations = relations(meetingMessages, ({ one }) => ({
  meeting: one(aiMeetings, { fields: [meetingMessages.meetingId], references: [aiMeetings.id] }),
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

export const pomodoroSessionsRelations = relations(pomodoroSessions, ({ one }) => ({
  user: one(users, { fields: [pomodoroSessions.userId], references: [users.id] }),
  subject: one(subjects, { fields: [pomodoroSessions.subjectId], references: [subjects.id] }),
}));

export const timeCapsulesRelations = relations(timeCapsules, ({ one, many }) => ({
  user: one(users, { fields: [timeCapsules.userId], references: [users.id] }),
  subject: one(subjects, { fields: [timeCapsules.subjectId], references: [subjects.id] }),
  reminders: many(timeCapsuleReminders),
}));

export const timeCapsuleRemindersRelations = relations(timeCapsuleReminders, ({ one }) => ({
  timeCapsule: one(timeCapsules, { fields: [timeCapsuleReminders.timeCapsuleId], references: [timeCapsules.id] }),
}));

export const pdfDriveBooksRelations = relations(pdfDriveBooks, ({ many }) => ({
  userLibrary: many(userPdfLibrary),
}));

export const userPdfLibraryRelations = relations(userPdfLibrary, ({ one }) => ({
  user: one(users, { fields: [userPdfLibrary.userId], references: [users.id] }),
  book: one(pdfDriveBooks, { fields: [userPdfLibrary.bookId], references: [pdfDriveBooks.id] }),
  subject: one(subjects, { fields: [userPdfLibrary.subjectId], references: [subjects.id] }),
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

export const insertAIMeetingSchema = createInsertSchema(aiMeetings).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertMeetingMessageSchema = createInsertSchema(meetingMessages).omit({
  id: true,
  timestamp: true,
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
export type AIMeeting = typeof aiMeetings.$inferSelect;
export type InsertAIMeeting = z.infer<typeof insertAIMeetingSchema>;
export type MeetingMessage = typeof meetingMessages.$inferSelect;
export type InsertMeetingMessage = z.infer<typeof insertMeetingMessageSchema>;
