import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StoryScene {
  scene_number: number;
  visual_description: string;
  narration: string;
  caption: string;
}

export async function generateEducationalStory(concept: string, subject?: string, difficulty?: string): Promise<StoryScene[]> {
  try {
    const systemPrompt = `You are an educational storytelling assistant for an AI-powered study app.

Your task is to convert the user-submitted concept into a structured breakdown of exactly 4 animated scenes. Each scene must include:

1. "scene_number": A numbered index starting from 1.
2. "visual_description": A short visual summary of the scene (for image generation, keep under 100 characters).
3. "narration": One line of spoken narration describing the action or theme (keep engaging and educational).
4. "caption": A short line summarizing the educational takeaway or idea (keep concise).

Make the story engaging and educational. Focus on the core learning concepts while maintaining narrative flow.
${subject ? `Subject context: ${subject}` : ''}
${difficulty ? `Difficulty level: ${difficulty}` : ''}

Return the result as a JSON array of exactly 4 scenes.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scene_number: { type: "number" },
              visual_description: { type: "string" },
              narration: { type: "string" },
              caption: { type: "string" },
            },
            required: ["scene_number", "visual_description", "narration", "caption"],
          },
        },
      },
      contents: `Convert this concept into an educational story: ${concept}`,
    });

    const rawJson = response.text;
    console.log(`Generated story JSON: ${rawJson}`);

    if (rawJson) {
      const scenes: StoryScene[] = JSON.parse(rawJson);
      
      // Validate that we have exactly 4 scenes
      if (scenes.length !== 4) {
        throw new Error(`Expected 4 scenes, got ${scenes.length}`);
      }

      // Validate scene structure
      scenes.forEach((scene, index) => {
        if (scene.scene_number !== index + 1) {
          scene.scene_number = index + 1;
        }
        if (!scene.visual_description || !scene.narration || !scene.caption) {
          throw new Error(`Scene ${index + 1} is missing required fields`);
        }
      });

      return scenes;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("Story generation error:", error);
    throw new Error(`Failed to generate educational story: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function suggestStoryTitle(concept: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a short, catchy title (under 50 characters) for an educational story about: ${concept}`,
    });

    return response.text?.trim() || `Story: ${concept.substring(0, 30)}...`;
  } catch (error) {
    console.error("Title generation error:", error);
    return `Story: ${concept.substring(0, 30)}...`;
  }
}