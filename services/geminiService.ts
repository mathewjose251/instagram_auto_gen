import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { AspectRatio } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const geminiService = {
  generateImage: async (
    prompt: string,
    aspectRatio: AspectRatio,
  ): Promise<string> => {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      if (base64ImageBytes) {
        return base64ImageBytes;
      }
      throw new Error("No image data in response.");
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error("Failed to generate image with Gemini.");
    }
  },

  editImage: async (
    imageBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<string> => {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data;
      }
      throw new Error("No image data in response.");
    } catch (error) {
      console.error("Error editing image:", error);
      throw new Error("Failed to edit image with Gemini.");
    }
  },

  generateQuote: async (): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate a short, motivational quote about travel with friends, stepping into the outdoors, and connecting with nature. The quote should be inspiring and concise, perfect for an Instagram post. No quotation marks.",
      });
      return response.text.trim();
    } catch (error) {
      console.error("Error generating quote:", error);
      throw new Error("Failed to generate a quote.");
    }
  },

  generateHashtags: async (context: string): Promise<string[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the quote "${context}", generate an array of 10 trending and relevant Instagram hashtags to maximize reach.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hashtags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: 'A trending Instagram hashtag without the # symbol.'
                }
              }
            }
          }
        }
      });
      const jsonStr = response.text.trim();
      const result = JSON.parse(jsonStr);
      return result.hashtags || [];
    } catch (error) {
      console.error("Error generating hashtags:", error);
      throw new Error("Failed to generate hashtags.");
    }
  },
};
