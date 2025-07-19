import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractTextFromPDF(pdfBuffer: Buffer, filename: string): Promise<string> {
  try {
    // For now, we'll use a placeholder for PDF text extraction
    // In a real implementation, you would use libraries like pdf-parse or pdf2pic
    // and then use Gemini for OCR if needed
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: pdfBuffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
        "Extract all text content from this PDF document. Organize it clearly with headings and maintain the structure."
      ],
    });

    return response.text || "Could not extract text from PDF";
  } catch (error) {
    console.error("PDF processing error:", error);
    throw new Error("Failed to process PDF document");
  }
}

export async function summarizeTextbook(text: string): Promise<string> {
  try {
    const prompt = `Please create a comprehensive summary of this textbook content. 
    Focus on key concepts, important formulas, and main topics. 
    Structure the summary with clear headings and bullet points:
    
    ${text.substring(0, 10000)}`; // Limit text to avoid token limits

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate summary";
  } catch (error) {
    console.error("Summarization error:", error);
    throw new Error("Failed to summarize textbook content");
  }
}

export async function searchTextbookContent(text: string, query: string): Promise<string> {
  try {
    const prompt = `Search through this textbook content and find relevant information for the query: "${query}"
    
    Provide a detailed answer based on the textbook content, including page references if available.
    If the information is not found in the textbook, clearly state that.
    
    Textbook content (first 8000 characters):
    ${text.substring(0, 8000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not find relevant information";
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to search textbook content");
  }
}
