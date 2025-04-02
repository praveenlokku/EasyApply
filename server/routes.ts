import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWaitlistSchema, 
  resumeAnalysisRequestSchema, 
  jobMatchingRequestSchema,
  insertResumeSchema,
  insertJobDescriptionSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { analyzeResume, findJobMatches, extractTextFromResume } from "./services/openai";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for adding to waitlist
  app.post("/api/waitlist", async (req, res) => {
    try {
      const validatedData = insertWaitlistSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }

      const waitlistEntry = await storage.addToWaitlist(validatedData.data);
      
      return res.status(201).json({
        message: "Successfully added to waitlist",
        data: waitlistEntry
      });
    } catch (error: any) {
      if (error.message && error.message.includes("unique")) {
        return res.status(409).json({
          message: "This email is already on our waitlist"
        });
      }
      
      console.error("Error adding to waitlist:", error);
      return res.status(500).json({ 
        message: "An error occurred while adding you to the waitlist" 
      });
    }
  });

  // API endpoint for analyzing a resume (text-based)
  app.post("/api/resume/analyze", async (req, res) => {
    try {
      const validatedData = resumeAnalysisRequestSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }

      const { resumeText, jobDescription } = validatedData.data;
      
      // Call the OpenAI service to analyze the resume
      const analysis = await analyzeResume(resumeText, jobDescription);
      
      return res.status(200).json({
        message: "Resume analysis complete",
        data: analysis
      });
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
      
      // Check for OpenAI API quota errors
      if (error.message && error.message.includes("quota")) {
        return res.status(429).json({ 
          message: "OpenAI API quota exceeded. Please try again later or check your API key limits.",
          error: "api_quota_exceeded"
        });
      }
      
      // Check for OpenAI API key errors
      if (error.message && error.message.includes("API key")) {
        return res.status(401).json({
          message: "OpenAI API key is missing or invalid. Please configure it properly.",
          error: "api_key_error"
        });
      }
      
      return res.status(500).json({ 
        message: "An error occurred while analyzing the resume",
        error: error.message || "Unknown error"
      });
    }
  });

  // API endpoint for finding job matches based on resume
  app.post("/api/resume/job-matches", async (req, res) => {
    try {
      const validatedData = jobMatchingRequestSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }

      const { resumeText } = validatedData.data;
      
      // Call the OpenAI service to find job matches
      const matches = await findJobMatches(resumeText);
      
      return res.status(200).json({
        message: "Job matching complete",
        data: matches
      });
    } catch (error: any) {
      console.error("Error finding job matches:", error);
      
      // Check for OpenAI API quota errors
      if (error.message && error.message.includes("quota")) {
        return res.status(429).json({ 
          message: "OpenAI API quota exceeded. Please try again later or check your API key limits.",
          error: "api_quota_exceeded"
        });
      }
      
      // Check for OpenAI API key errors
      if (error.message && error.message.includes("API key")) {
        return res.status(401).json({
          message: "OpenAI API key is missing or invalid. Please configure it properly.",
          error: "api_key_error"
        });
      }
      
      return res.status(500).json({ 
        message: "An error occurred while finding job matches",
        error: error.message || "Unknown error"
      });
    }
  });

  // API endpoint for uploading and analyzing a resume file
  app.post("/api/resume/upload", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No resume file provided" });
      }
      
      // Extract resume text from the uploaded file
      const resumeText = await extractTextFromResume(
        req.file.buffer,
        req.file.mimetype
      );
      
      // Optionally save the resume to storage if a userId is provided
      if (req.body.userId) {
        const resumeData = {
          userId: parseInt(req.body.userId),
          fileName: req.file.originalname,
          contentText: resumeText,
        };
        
        const validatedData = insertResumeSchema.safeParse(resumeData);
        if (validatedData.success) {
          const savedResume = await storage.saveResume(validatedData.data);
          
          // Analyze the resume and update storage with the analysis
          const analysis = await analyzeResume(resumeText);
          await storage.updateResumeAnalysis(savedResume.id, analysis);
        }
      }
      
      // Analyze the resume
      const analysis = await analyzeResume(resumeText);
      
      return res.status(200).json({
        message: "Resume uploaded and analyzed successfully",
        data: {
          resumeText,
          analysis
        }
      });
    } catch (error: any) {
      console.error("Error uploading and analyzing resume:", error);
      
      // Check for OpenAI API quota errors
      if (error.message && error.message.includes("quota")) {
        return res.status(429).json({ 
          message: "OpenAI API quota exceeded. Please try again later or check your API key limits.",
          error: "api_quota_exceeded"
        });
      }
      
      // Check for OpenAI API key errors
      if (error.message && error.message.includes("API key")) {
        return res.status(401).json({
          message: "OpenAI API key is missing or invalid. Please configure it properly.",
          error: "api_key_error"
        });
      }
      
      // Check for no file provided error
      if (error.message && error.message.includes("No resume file provided")) {
        return res.status(400).json({
          message: "Please upload a resume file to analyze."
        });
      }
      
      return res.status(500).json({ 
        message: "An error occurred while processing the resume",
        error: error.message || "Unknown error"
      });
    }
  });

  // API endpoint for saving job descriptions
  app.post("/api/job/save", async (req, res) => {
    try {
      const validatedData = insertJobDescriptionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }

      const jobDescription = await storage.saveJobDescription(validatedData.data);
      
      return res.status(201).json({
        message: "Job description saved successfully",
        data: jobDescription
      });
    } catch (error: any) {
      console.error("Error saving job description:", error);
      return res.status(500).json({ 
        message: "An error occurred while saving the job description" 
      });
    }
  });

  // API endpoint for getting job descriptions by user ID
  app.get("/api/job/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const jobDescriptions = await storage.getJobDescriptionsByUserId(userId);
      
      return res.status(200).json({
        message: "Job descriptions retrieved successfully",
        data: jobDescriptions
      });
    } catch (error: any) {
      console.error("Error retrieving job descriptions:", error);
      return res.status(500).json({ 
        message: "An error occurred while retrieving job descriptions" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
