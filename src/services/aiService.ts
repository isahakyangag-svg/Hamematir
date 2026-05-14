
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const getAI = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features might not work.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateLogo = async (prompt: string) => {
  const client = getAI();
  if (!client) throw new Error("AI client not initialized");

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Generate a professional, high-quality app logo for a platform named 'Hamematir'. The style should be modern, minimalist, and clean. Context: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from AI");
};
