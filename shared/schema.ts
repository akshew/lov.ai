import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characterType = z.enum(["AI-GF", "AI-BF"]);
export type CharacterType = z.infer<typeof characterType>;

export const personalityType = z.enum(["romantic", "funny", "supportive"]);
export type PersonalityType = z.infer<typeof personalityType>;

export const themeType = z.enum(["dark", "light"]);
export type ThemeType = z.infer<typeof themeType>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  characterType: text("character_type").notNull(),
  personality: text("personality"),  // Made optional
  theme: text("theme").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isAi: boolean("is_ai").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertMessageSchema = createInsertSchema(messages);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export interface ChatMessage {
  content: string;
  isAi: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: "message" | "error";
  data: ChatMessage;
}