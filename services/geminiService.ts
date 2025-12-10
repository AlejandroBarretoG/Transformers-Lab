import { GoogleGenAI, Type } from "@google/genai";
import { TestCase } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTestCases = async (topic: string, count: number = 3): Promise<TestCase[]> => {
  if (!apiKey) {
    throw new Error("API Key not found. Please set process.env.API_KEY");
  }

  const model = "gemini-2.5-flash";
  const prompt = `Genera ${count} frases en inglés sobre el tema "${topic}" para probar un modelo de análisis de sentimientos.
  Incluye una mezcla de sentimientos positivos, negativos y ambiguos/sarcásticos.
  Devuelve un JSON estrictamente estructurado.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "La frase en inglés para analizar.",
              },
              expectedSentiment: {
                type: Type.STRING,
                enum: ["POSITIVE", "NEGATIVE", "NEUTRAL"],
                description: "El sentimiento esperado.",
              },
            },
            required: ["text", "expectedSentiment"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const data = JSON.parse(jsonText) as TestCase[];
    return data;
  } catch (error) {
    console.error("Error generating test cases:", error);
    // Fallback data in case of API failure or rate limit
    return [
      { text: "The service was absolutely terrible and slow.", expectedSentiment: "NEGATIVE" },
      { text: "I simply love how easy this app is to use!", expectedSentiment: "POSITIVE" },
      { text: "It was okay, nothing special but not bad either.", expectedSentiment: "NEUTRAL" }
    ];
  }
};