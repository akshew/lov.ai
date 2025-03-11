import { CharacterType, PersonalityType } from "@shared/schema";

export async function generateAIResponse(
  message: string,
  characterType: CharacterType,
  personality: PersonalityType
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest/generateText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: {
          text: `You are ${characterType === "AI-GF" ? "a girlfriend" : "a boyfriend"} with a ${personality} personality. Respond to: ${message}`
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to generate AI response");
    }

    const data = await response.json();
    return data.candidates[0].output;
  } catch (error) {
    console.error("AI response generation failed:", error);
    throw error;
  }
}
