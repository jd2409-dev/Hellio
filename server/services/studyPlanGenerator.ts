import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StudyPlanRequest {
  subjectId: number;
  examType: string;
  examDate: string;
  currentDate: string;
  syllabus: string;
  dailyStudyHours: number;
}

export interface StudyPlanItem {
  title: string;
  description: string;
  plannedDate: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  studyType: 'reading' | 'practice' | 'revision' | 'quiz' | 'project';
}

export async function generateAIStudyPlan(request: StudyPlanRequest): Promise<StudyPlanItem[]> {
  try {
    const examDate = new Date(request.examDate);
    const currentDate = new Date(request.currentDate);
    const daysUntilExam = Math.ceil((examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `You are an AI study planner. Create a comprehensive study plan with the following requirements:

EXAM DETAILS:
- Subject: ${request.subjectId}
- Exam Type: ${request.examType}
- Exam Date: ${request.examDate}
- Days until exam: ${daysUntilExam}
- Daily study hours available: ${request.dailyStudyHours}

SYLLABUS TO COVER:
${request.syllabus}

INSTRUCTIONS:
1. Create a day-by-day study plan from today until the exam
2. Break down the syllabus into manageable daily tasks
3. Include different types of study activities: reading, practice, revision, quizzes
4. Prioritize topics based on importance and difficulty
5. Leave time for revision closer to the exam date
6. Each study session should be between 30-120 minutes
7. Include practice sessions and mock tests

RESPONSE FORMAT:
Return a JSON array of study plan items with this exact structure:
[
  {
    "title": "Chapter 1: Introduction to Algebra",
    "description": "Read and understand basic algebraic concepts, solve practice problems from textbook pages 15-25",
    "plannedDate": "2024-01-15T09:00:00.000Z",
    "duration": 90,
    "priority": "high",
    "studyType": "reading"
  }
]

STUDY TYPES:
- "reading": Initial learning of new concepts
- "practice": Problem solving and exercises
- "revision": Review of previously learned material
- "quiz": Self-assessment and testing
- "project": Comprehensive assignments or case studies

PRIORITIES:
- "high": Essential topics that are heavily weighted in exams
- "medium": Important but less critical topics
- "low": Nice-to-know topics or reinforcement

Generate a complete study plan covering all topics in the syllabus, distributed optimally across the available time.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from AI model");
    }

    const studyPlan: StudyPlanItem[] = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!Array.isArray(studyPlan)) {
      throw new Error("AI response is not an array");
    }

    // Validate each study plan item
    for (const item of studyPlan) {
      if (!item.title || !item.plannedDate || !item.duration || !item.priority || !item.studyType) {
        throw new Error("Invalid study plan item structure");
      }
    }

    return studyPlan;
  } catch (error) {
    console.error("Study plan generation error:", error);
    throw new Error(`Failed to generate study plan: ${error}`);
  }
}

export async function generateStudyPlanSummary(studyPlan: StudyPlanItem[]): Promise<string> {
  try {
    const prompt = `Analyze this study plan and provide a brief summary (2-3 sentences) highlighting:
1. Total number of study sessions
2. Key focus areas
3. Study approach (reading vs practice vs revision balance)

Study Plan:
${JSON.stringify(studyPlan, null, 2)}

Provide a concise, encouraging summary for the student.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Study plan generated successfully!";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "Your personalized study plan has been created and scheduled.";
  }
}

export async function generateStudyReminders(studyPlan: StudyPlanItem[]): Promise<{ message: string; reminderTime: Date }[]> {
  const reminders: { message: string; reminderTime: Date }[] = [];

  studyPlan.forEach((item) => {
    const studyDate = new Date(item.plannedDate);
    
    // Create reminder 30 minutes before study session
    const reminderTime = new Date(studyDate.getTime() - 30 * 60 * 1000);
    
    if (reminderTime > new Date()) { // Only create future reminders
      reminders.push({
        message: `Reminder: "${item.title}" scheduled in 30 minutes. Duration: ${item.duration} minutes.`,
        reminderTime,
      });
    }
  });

  return reminders;
}