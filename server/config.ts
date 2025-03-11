import { config } from "dotenv";
config();

interface Config {
  geminiApiKey: string;
  mongoDbUrl?: string;  // Optional for now since MongoDB integration is a future feature
  rateLimits: {
    requestsPerMinute: number;
    requestBurst: number;
  };
}

const serverConfig: Config = {
  geminiApiKey: process.env.GEMINI_API_KEY || "AIzaSyBgMncGVrLtkw2ZLel7O7mgmQo7RES047Q",
  mongoDbUrl: process.env.MONGODB_URL,
  rateLimits: {
    requestsPerMinute: 30,  // Adjust based on Gemini API limits
    requestBurst: 5,
  }
};

// Validate required configuration
if (!serverConfig.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required in environment variables");
}

export default serverConfig;
