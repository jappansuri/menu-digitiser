import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Provider helper connecting the AI SDK directly to Google's Gemini API.
 * Server-only: reads the API key passed from a server handler.
 */
export function createGeminiProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey });
}
