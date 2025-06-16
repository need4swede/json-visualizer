import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jsonData = pgTable("json_data", {
  id: text("id").primaryKey(),
  data: json("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJsonDataSchema = createInsertSchema(jsonData).pick({
  id: true,
  data: true,
  expiresAt: true,
}).extend({
  // Enhanced validation rules for security
  id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9]+$/, "ID must contain only alphanumeric characters"),
  data: z.any().refine((val) => {
    // Ensure data is valid JSON-serializable
    try {
      JSON.stringify(val);
      return true;
    } catch {
      return false;
    }
  }, "Data must be valid JSON-serializable content").refine((val) => {
    // Size validation (10MB limit)
    const jsonString = JSON.stringify(val);
    return jsonString.length <= 10 * 1024 * 1024;
  }, "Data size must not exceed 10MB"),
  expiresAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).refine((date) => {
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    return date > now && date <= maxFuture;
  }, "Expiration date must be in the future but not more than 1 year"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJsonData = z.infer<typeof insertJsonDataSchema>;
export type JsonData = typeof jsonData.$inferSelect;
