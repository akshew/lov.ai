import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateAIResponse, detectPersonality } from "./ai";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    res.json(user);
  });

  app.patch("/api/users/theme", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { theme } = req.body;
    const user = await storage.updateUserTheme(req.session.userId, theme);
    res.json(user);
  });

  wss.on("connection", async (ws: WebSocket, req) => {
    console.log("New WebSocket connection established");

    ws.on("message", async (data: string) => {
      try {
        const message = JSON.parse(data);
        const user = await storage.getUser(1); // Simplified for demo

        if (!user) {
          throw new Error("User not found");
        }

        // First, notify the client that we're processing
        ws.send(JSON.stringify({
          type: "typing",
          data: { isTyping: true }
        }));

        // Detect personality from the message
        console.log("Detecting personality for message:", message.content);
        const personality = await detectPersonality(message.content);
        console.log(`Detected personality: ${personality}`);

        // Generate AI response
        console.log("Generating AI response...");
        const aiResponse = await generateAIResponse(
          message.content,
          user.characterType,
          personality
        );

        ws.send(JSON.stringify({
          type: "message",
          data: { content: aiResponse, isAi: true, timestamp: new Date() }
        }));
      } catch (error: any) {
        console.error("Message processing failed:", error);

        // Send a more user-friendly error message
        const errorMessage = error?.message?.includes("429")
          ? "I'm getting a lot of messages right now. Can you give me a moment to catch up?"
          : "I'm having trouble responding right now. Could you try again in a moment?";

        ws.send(JSON.stringify({
          type: "error",
          data: { 
            content: errorMessage, 
            isAi: true, 
            timestamp: new Date() 
          }
        }));
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}