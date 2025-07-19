import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
  difficulty: string;
  totalQuestions: number;
}

export async function generateQuiz(
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  numQuestions: number = 10,
  topic?: string
): Promise<GeneratedQuiz> {
  try {
    const prompt = `Generate a ${difficulty} difficulty quiz for ${subject}${topic ? ` focusing on ${topic}` : ''}.
    
    Create exactly ${numQuestions} multiple choice questions with the following requirements:
    - Each question should have 4 options (A, B, C, D)
    - Include the correct answer index (0-3)
    - Provide a clear explanation for each answer
    - Questions should be educational and test understanding, not just memorization
    - Progressive difficulty within the ${difficulty} level
    
    Return the response in this exact JSON format:
    {
      "title": "Quiz title",
      "difficulty": "${difficulty}",
      "questions": [
        {
          "id": 1,
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Explanation of why this answer is correct",
          "difficulty": "${difficulty}"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            difficulty: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  },
                  correctAnswer: { type: "number" },
                  explanation: { type: "string" },
                  difficulty: { type: "string" }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation", "difficulty"]
              }
            }
          },
          required: ["title", "difficulty", "questions"]
        },
      },
      contents: prompt,
    });

    const quizData = JSON.parse(response.text || '{}');
    
    return {
      ...quizData,
      totalQuestions: numQuestions,
    };
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function generateAdaptiveQuiz(
  subject: string,
  userPerformance: number[], // Array of recent scores
  numQuestions: number = 10
): Promise<GeneratedQuiz> {
  // Calculate adaptive difficulty based on performance
  const avgScore = userPerformance.reduce((sum, score) => sum + score, 0) / userPerformance.length;
  
  let difficulty: 'easy' | 'medium' | 'hard';
  if (avgScore < 60) {
    difficulty = 'easy';
  } else if (avgScore < 80) {
    difficulty = 'medium';
  } else {
    difficulty = 'hard';
  }

  return generateQuiz(subject, difficulty, numQuestions);
}

export function calculateQuizScore(answers: number[], quiz: GeneratedQuiz): {
  score: number;
  correctCount: number;
  totalQuestions: number;
  feedback: string[];
} {
  let correctCount = 0;
  const feedback: string[] = [];

  quiz.questions.forEach((question, index) => {
    const userAnswer = answers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctCount++;
      feedback.push(`Question ${index + 1}: Correct! ${question.explanation}`);
    } else {
      feedback.push(`Question ${index + 1}: Incorrect. ${question.explanation}`);
    }
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);

  return {
    score,
    correctCount,
    totalQuestions: quiz.questions.length,
    feedback,
  };
}
