import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Waitlist Schema
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profession: text("profession").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).pick({
  name: true,
  email: true,
  profession: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

// Resume Analysis Schema
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  contentText: text("content_text").notNull(),
  analysis: json("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  fileName: true,
  contentText: true,
});

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

// Job Description Schema
export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  salary: text("salary"),
  postedDate: text("posted_date"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).pick({
  userId: true,
  title: true,
  company: true,
  description: true,
  location: true,
  salary: true,
  postedDate: true,
  url: true,
});

export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptions.$inferSelect;

// Resume Analysis Request Schema (for API requests)
export const resumeAnalysisRequestSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required"),
  jobDescription: z.string().optional(),
});

export type ResumeAnalysisRequest = z.infer<typeof resumeAnalysisRequestSchema>;

// Job Matching Request Schema (for API requests)
export const jobMatchingRequestSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required"),
});

export type JobMatchingRequest = z.infer<typeof jobMatchingRequestSchema>;

// Resume File Upload Schema (for client-side validation)
export const resumeFileSchema = z.object({
  resume: z.any()
    .refine(val => val && val.length > 0, {
      message: "Please select a resume file"
    })
});

export type ResumeFileUpload = z.infer<typeof resumeFileSchema>;
