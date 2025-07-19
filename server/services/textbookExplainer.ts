import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainTextbook(
  textbookContent: string,
  subject?: string
): Promise<string> {
  try {
    const prompt = `You are an expert teacher and educational content simplifier. Please explain the following textbook content in simple, easy-to-understand terms suitable for students.

${subject ? `Subject: ${subject}` : ''}

Your explanation should:
- Use simple, everyday language
- Break down complex concepts into smaller, digestible parts
- Provide real-world examples and analogies where possible
- Organize information with clear headings and bullet points
- Explain technical terms when first introduced
- Make the content engaging and relatable for students
- Include key takeaways at the end

Textbook Content:
${textbookContent.substring(0, 10000)} // Limit content to avoid token limits

Please provide a comprehensive but simplified explanation of this content.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "Unable to generate explanation";
  } catch (error) {
    console.error("Error explaining textbook:", error);
    throw new Error("Failed to generate textbook explanation");
  }
}

export async function generateTextbookQuiz(
  textbookContent: string,
  questionType: string,
  numQuestions: number = 10,
  subject?: string
): Promise<any> {
  try {
    let prompt = '';
    
    switch (questionType) {
      case '2-marks':
        prompt = `Based on the following textbook content, generate ${numQuestions} short answer questions (2 marks each).
        
        Each question should:
        - Be answerable in 2-3 sentences based on the textbook content
        - Test basic understanding of key concepts
        - Have a model answer of 30-50 words
        - Be worth 2 marks
        
        Return in JSON format:
        {
          "title": "Quiz title based on content",
          "type": "2-marks",
          "questions": [
            {
              "id": 1,
              "question": "Question text",
              "modelAnswer": "Expected answer (30-50 words)",
              "marks": 2,
              "keywords": ["key", "terms", "expected"]
            }
          ]
        }`;
        break;
        
      case 'mcq':
        prompt = `Based on the following textbook content, generate ${numQuestions} multiple choice questions.
        
        Return in JSON format:
        {
          "title": "Quiz title",
          "type": "mcq",
          "questions": [
            {
              "id": 1,
              "question": "Question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Why this answer is correct"
            }
          ]
        }`;
        break;
        
      case 'assertion-reason':
        prompt = `Based on the following textbook content, generate ${numQuestions} assertion-reason type questions.
        
        Return in JSON format:
        {
          "title": "Quiz title",
          "type": "assertion-reason",
          "questions": [
            {
              "id": 1,
              "assertion": "Assertion statement",
              "reason": "Reason statement",
              "options": [
                "Both assertion and reason are true and reason is the correct explanation of assertion",
                "Both assertion and reason are true but reason is not the correct explanation of assertion",
                "Assertion is true but reason is false",
                "Both assertion and reason are false"
              ],
              "correctAnswer": 0,
              "explanation": "Detailed explanation"
            }
          ]
        }`;
        break;
        
      case '3-marks':
        prompt = `Based on the following textbook content, generate ${numQuestions} medium answer questions (3 marks each).
        
        Return in JSON format:
        {
          "title": "Quiz title",
          "type": "3-marks",
          "questions": [
            {
              "id": 1,
              "question": "Question text",
              "modelAnswer": "Expected answer (60-100 words)",
              "marks": 3,
              "keywords": ["important", "concepts", "to", "cover"]
            }
          ]
        }`;
        break;
        
      case '5-marks':
        prompt = `Based on the following textbook content, generate ${numQuestions} long answer questions (5 marks each).
        
        Return in JSON format:
        {
          "title": "Quiz title", 
          "type": "5-marks",
          "questions": [
            {
              "id": 1,
              "question": "Question text",
              "modelAnswer": "Expected comprehensive answer (150-200 words)",
              "marks": 5,
              "keywords": ["comprehensive", "topics", "to", "cover"]
            }
          ]
        }`;
        break;
    }

    prompt += `\n\nTextbook Content:\n${textbookContent.substring(0, 8000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Error generating textbook quiz:", error);
    throw new Error("Failed to generate quiz from textbook content");
  }
}