import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeArticle(text: string): Promise<string> {
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Something went wrong";
}

export interface Sentiment {
    rating: number;
    confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
    try {
        const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        rating: { type: "number" },
                        confidence: { type: "number" },
                    },
                    required: ["rating", "confidence"],
                },
            },
            contents: text,
        });

        const rawJson = response.text;

        console.log(`Raw JSON: ${rawJson}`);

        if (rawJson) {
            const data: Sentiment = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        throw new Error(`Failed to analyze sentiment: ${error}`);
    }
}

export async function analyzeImage(jpegImagePath: string): Promise<string> {
    const imageBytes = fs.readFileSync(jpegImagePath);

    const contents = [
        {
            inlineData: {
                data: imageBytes.toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        `Analyze this image in detail and describe its key elements, context,
and any notable aspects.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

export async function analyzeVideo(mp4VideoPath: string): Promise<string> {
    const videoBytes = fs.readFileSync(mp4VideoPath);

    const contents = [
        {
            inlineData: {
                data: videoBytes.toString("base64"),
                mimeType: "video/mp4",
            },
        },
        `Analyze this video in detail and describe its key elements, context,
    and any notable aspects.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

export async function generateImage(
    prompt: string,
    imagePath: string,
): Promise<void> {
    try {
        // IMPORTANT: only this gemini model supports image generation
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            return;
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
            return;
        }

        for (const part of content.parts) {
            if (part.text) {
                console.log(part.text);
            } else if (part.inlineData && part.inlineData.data) {
                const imageData = Buffer.from(part.inlineData.data, "base64");
                fs.writeFileSync(imagePath, imageData);
                console.log(`Image saved as ${imagePath}`);
            }
        }
    } catch (error) {
        throw new Error(`Failed to generate image: ${error}`);
    }
}

export async function generateImprovementSuggestions(
    subjectPerformance: any,
    difficultyPerformance: any,
    commonMistakes: any[]
): Promise<string[]> {
    try {
        const performanceData = {
            subjects: Object.entries(subjectPerformance).map(([subject, data]: [string, any]) => ({
                subject,
                averageScore: data.attempts > 0 ? Math.round(data.total / data.attempts) : 0,
                attempts: data.attempts
            })),
            difficulties: Object.entries(difficultyPerformance).map(([difficulty, data]: [string, any]) => ({
                difficulty,
                averageScore: data.attempts > 0 ? Math.round(data.total / data.attempts) : 0,
                attempts: data.attempts
            })),
            recentMistakes: commonMistakes.map(mistake => ({
                subject: mistake.subject,
                topic: mistake.topic,
                question: mistake.question
            }))
        };

        const prompt = `Analyze this student's quiz performance data and provide 5 specific, actionable improvement suggestions.

Performance Data:
${JSON.stringify(performanceData, null, 2)}

Provide suggestions that:
1. Address weak subject areas with specific study strategies
2. Recommend difficulty progression paths
3. Suggest focused practice for common mistake patterns
4. Include concrete action items (time, resources, methods)
5. Are encouraging and motivational

Format as a JSON array of strings, each suggestion being 1-2 sentences long.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            contents: prompt,
        });

        const suggestions = JSON.parse(response.text || '[]');
        return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
        console.error('Error generating improvement suggestions:', error);
        // Fallback suggestions
        return [
            "Focus on your weakest subject areas by dedicating 15-20 minutes daily to targeted practice.",
            "Review incorrect answers immediately after each quiz to understand the reasoning behind correct solutions.",
            "Start with easier difficulty levels to build confidence before progressing to harder questions.",
            "Create summary notes for topics where you frequently make mistakes.",
            "Practice time management by setting timers during study sessions to improve quiz completion speed."
        ];
    }
}

export async function parseMeetingRequest(request: string): Promise<{
    topic: string;
    subject: string;
    grade: string;
    description: string;
    agenda: string[];
    duration: number;
}> {
    try {
        const prompt = `Parse this learning meeting request and extract structured information:

Request: "${request}"

Provide the response as JSON with these fields:
- topic: The main topic/subject matter to be taught
- subject: The academic subject (e.g., Physics, Biology, Mathematics, etc.)
- grade: The grade level (e.g., "9", "10", "12", etc.)
- description: A brief description of what will be covered
- agenda: Array of 4-6 learning objectives/topics to cover in order
- duration: Estimated duration in minutes (30-60 based on complexity)

Make sure the agenda is pedagogically structured from basic concepts to more advanced ones.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        topic: { type: "string" },
                        subject: { type: "string" },
                        grade: { type: "string" },
                        description: { type: "string" },
                        agenda: {
                            type: "array",
                            items: { type: "string" }
                        },
                        duration: { type: "number" }
                    },
                    required: ["topic", "subject", "grade", "description", "agenda", "duration"]
                }
            },
            contents: prompt,
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
            topic: parsed.topic || "Learning Session",
            subject: parsed.subject || "General",
            grade: parsed.grade || "9",
            description: parsed.description || "Educational learning session",
            agenda: Array.isArray(parsed.agenda) ? parsed.agenda : ["Introduction", "Main concepts", "Examples", "Summary"],
            duration: typeof parsed.duration === 'number' ? parsed.duration : 30
        };
    } catch (error) {
        console.error('Error parsing meeting request:', error);
        // Fallback parsing
        const lowerRequest = request.toLowerCase();
        let subject = "General";
        let grade = "9";
        let topic = "Learning Session";

        // Extract grade
        const gradeMatch = lowerRequest.match(/grade\s*(\d+)/);
        if (gradeMatch) grade = gradeMatch[1];

        // Extract subject
        const subjects = ["physics", "chemistry", "biology", "mathematics", "math", "english", "history", "geography"];
        for (const subj of subjects) {
            if (lowerRequest.includes(subj)) {
                subject = subj.charAt(0).toUpperCase() + subj.slice(1);
                break;
            }
        }

        // Extract topic
        const topicMatch = lowerRequest.match(/'([^']+)'/);
        if (topicMatch) topic = topicMatch[1];

        return {
            topic,
            subject,
            grade,
            description: `Learning session on ${topic} for grade ${grade}`,
            agenda: [
                "Introduction to the topic",
                "Key concepts and definitions", 
                "Real-world examples",
                "Practice problems",
                "Summary and review"
            ],
            duration: 45
        };
    }
}

export async function generateMeetingResponse(
    message: string, 
    meetingContext: {
        topic: string;
        subject: string;
        grade: string;
        agenda: string[];
        previousMessages?: any[];
    }
): Promise<string> {
    try {
        const context = meetingContext.previousMessages 
            ? meetingContext.previousMessages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
            : '';

        const prompt = `You are an AI tutor conducting a live learning session. Respond helpfully to the student's question.

Meeting Context:
- Topic: ${meetingContext.topic}
- Subject: ${meetingContext.subject}
- Grade Level: ${meetingContext.grade}
- Learning Agenda: ${meetingContext.agenda.join(', ')}

Recent Conversation:
${context}

Student's Question: "${message}"

Provide a clear, educational response appropriate for grade ${meetingContext.grade}. Use examples and analogies when helpful. Keep responses concise but informative (2-4 sentences).`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "I'm here to help you learn! Could you rephrase your question?";
    } catch (error) {
        console.error('Error generating meeting response:', error);
        return "I'm having trouble processing your question right now. Could you try asking in a different way?";
    }
}

export async function generateInitialMeetingMessage(meetingData: {
    topic: string;
    subject: string;
    grade: string;
    agenda: string[];
}): Promise<string> {
    try {
        const prompt = `Generate a welcoming introduction message for an AI tutoring session.

Session Details:
- Topic: ${meetingData.topic}
- Subject: ${meetingData.subject}
- Grade Level: ${meetingData.grade}
- Agenda: ${meetingData.agenda.join(', ')}

Create a friendly, encouraging welcome message that:
1. Welcomes the student to the learning session
2. Briefly introduces the topic
3. Mentions what we'll cover
4. Encourages questions
Keep it conversational and appropriate for grade ${meetingData.grade} (2-3 sentences).`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || `Welcome to your learning session on ${meetingData.topic}! I'm your AI tutor and I'm here to help you understand this topic step by step. Feel free to ask me any questions during our session!`;
    } catch (error) {
        console.error('Error generating initial meeting message:', error);
        return `Welcome to your learning session on ${meetingData.topic}! I'm excited to explore this topic with you. Ask me anything you'd like to know!`;
    }
}
