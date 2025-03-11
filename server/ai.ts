import { GoogleGenerativeAI } from "@google/generative-ai";
import { CharacterType, PersonalityType } from "../shared/schema"; // Ensure this path is correct
import serverConfig from "./config";

if (!serverConfig.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(serverConfig.geminiApiKey);

// Create personality-specific system instructions
const getSystemInstruction = (characterType: CharacterType, personality: PersonalityType) => {
  const role = characterType === "AI-GF" ? "girlfriend" : "boyfriend";
  const traits =
    personality === "romantic"
      ? "caring and affectionate"
      : personality === "funny"
      ? "playful and humorous"
      : "supportive and understanding";

  return `You are an AI ${role} with a ${traits} personality. You communicate naturally and concisely, 
  keeping responses friendly and engaging while maintaining appropriate boundaries. Your responses are brief 
  (1-2 sentences) but meaningful, showing genuine interest in the conversation.`;
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Rate limiting implementation
class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();
  private readonly resetInterval: number = 60000; // 1 minute
  private readonly maxRequests: number;

  constructor(maxRequests: number) {
    this.maxRequests = maxRequests || 60; // Default to 60 requests per minute
  }

  isAllowed(): boolean {
    const now = Date.now();
    if (now - this.lastReset >= this.resetInterval) {
      this.requests = 0;
      this.lastReset = now;
    }

    if (this.requests >= this.maxRequests) {
      return false;
    }

    this.requests++;
    return true;
  }

  async waitForAvailability(timeoutMs: number = 30000): Promise<void> {
    const start = Date.now();
    while (!this.isAllowed()) {
      if (Date.now() - start >= timeoutMs) {
        throw new Error("Rate limit exceeded, please try again later.");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

const rateLimiter = new RateLimiter(serverConfig.rateLimits?.requestsPerMinute ?? 60);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function detectPersonality(message: string): Promise<PersonalityType> {
  try {
    await rateLimiter.waitForAvailability();

    const prompt = `Given this message, what personality type would be most appropriate for responding? Choose only one: romantic, funny, or supportive.
Message: "${message}"
Respond with just the word (romantic/funny/supportive):`;

    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });

    const response = (await result.response.text())?.toLowerCase().trim();

    if (response === "romantic" || response === "funny" || response === "supportive") {
      return response as PersonalityType;
    }

    console.warn("Unexpected personality detection response:", response);
    return "supportive"; // Default fallback
  } catch (error) {
    console.error("Personality detection error:", error);
    return "supportive";
  }
}

export async function generateAIResponse(
  message: string,
  characterType: CharacterType,
  personality: PersonalityType
): Promise<string> {
  try {
    await rateLimiter.waitForAvailability();

    const systemInstruction = getSystemInstruction(characterType, personality);
    const userPrompt = `${systemInstruction}\n\nUser message: "${message}"\n\nYour response:`;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: userPrompt }] }] });

        const response = (await result.response.text())?.trim();

        if (response) {
          console.log("Successfully generated response:", response);
          return response;
        }

        console.log("Empty response, retrying...");
        await sleep(1000);
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (error?.status === 429 && error?.headers?.get("Retry-After")) {
          const waitTime = parseInt(error.headers.get("Retry-After")) * 1000;
          console.log(`Rate limit hit, waiting for ${waitTime}ms`);
          await sleep(waitTime);
          continue;
        }

        const waitTime = Math.pow(2, attempt) * 1000;
        await sleep(waitTime);
      }
    }

    throw new Error("Failed to generate response after retries");
  } catch (error) {
    console.error("AI response generation error:", error);
    return "I'm having a bit of trouble responding right now. Could you try saying that again?";
  }
}
