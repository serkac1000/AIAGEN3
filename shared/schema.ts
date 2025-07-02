import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const aiaProjects = pgTable("aia_projects", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  userId: text("user_id").notNull(),
  apiKey: text("api_key").notNull(),
  cseId: text("cse_id").notNull(),
  searchPrompt: text("search_prompt").notNull(),
  requirements: text("requirements"),
  extensions: jsonb("extensions").$type<string[]>().default([]),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAiaProjectSchema = createInsertSchema(aiaProjects).omit({
  id: true,
  createdAt: true,
}).extend({
  projectName: z.string().min(1, "Project name is required").regex(/^[a-zA-Z0-9_]+$/, "Project name must be alphanumeric with underscores only"),
  userId: z.string().min(1, "User ID is required"),
  apiKey: z.string().min(1, "API key is required"),
  cseId: z.string().min(1, "CSE ID is required"),
  searchPrompt: z.string().min(1, "Search prompt is required"),
  requirements: z.string().optional(),
  extensions: z.array(z.string()).default([]),
});

export const generateAiaRequestSchema = insertAiaProjectSchema.extend({
  saveConfig: z.boolean().default(false),
  validateStrict: z.boolean().default(true),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAiaProject = z.infer<typeof insertAiaProjectSchema>;
export type AiaProject = typeof aiaProjects.$inferSelect;
export type GenerateAiaRequest = z.infer<typeof generateAiaRequestSchema>;
