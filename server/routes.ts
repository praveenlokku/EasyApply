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
import { analyzeResume, findJobMatches, extractTextFromResume, checkOpenAIAPIStatus } from "./services/openai";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to check OpenAI API status
  app.get("/api/openai/status", async (req, res) => {
    try {
      const apiStatus = await checkOpenAIAPIStatus();
      
      return res.status(apiStatus.isValid ? 200 : 403).json({
        status: apiStatus.isValid ? "active" : "inactive",
        message: apiStatus.message
      });
    } catch (error: any) {
      console.error("Error checking OpenAI API status:", error);
      return res.status(500).json({ 
        status: "error",
        message: "Failed to check OpenAI API status"
      });
    }
  });
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
      
      // Import the mock service directly
      const { generateMockResumeAnalysis } = await import('./services/mockAiService');
      
      try {
        // Call the OpenAI service to analyze the resume
        // The analyzeResume function will handle falling back to mock service if needed
        const analysis = await analyzeResume(resumeText, jobDescription);
        
        return res.status(200).json({
          message: "Resume analysis complete",
          data: analysis
        });
      } catch (openaiError: any) {
        console.error("OpenAI error, using mock service:", openaiError.message);
        
        // If OpenAI fails for any reason, use the mock service
        const mockAnalysis = generateMockResumeAnalysis(resumeText, jobDescription);
        
        return res.status(200).json({
          message: "Resume analysis complete (using mock service)",
          data: mockAnalysis,
          notice: "This analysis was generated using a mock service because the OpenAI API is currently unavailable."
        });
      }
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
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
      
      // Import the mock service directly
      const { generateMockJobMatches } = await import('./services/mockAiService');
      
      try {
        // Call the OpenAI service to find job matches
        // The findJobMatches function will handle falling back to mock service if needed
        const matches = await findJobMatches(resumeText);
        
        return res.status(200).json({
          message: "Job matching complete",
          data: matches
        });
      } catch (openaiError: any) {
        console.error("OpenAI error, using mock service:", openaiError.message);
        
        // If OpenAI fails for any reason, use the mock service
        const mockMatches = generateMockJobMatches(resumeText);
        
        return res.status(200).json({
          message: "Job matching complete (using mock service)",
          data: mockMatches,
          notice: "These job matches were generated using a mock service because the OpenAI API is currently unavailable."
        });
      }
    } catch (error: any) {
      console.error("Error finding job matches:", error);
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
        console.error("Resume upload failed: No file received in request");
        return res.status(400).json({ 
          message: "No resume file provided. Please make sure you've selected a file."
        });
      }
      
      // Import mock services directly
      const { extractMockResumeText, generateMockResumeAnalysis } = await import('./services/mockAiService');
      
      let resumeText;
      let textExtractionSource = "openai";
      
      try {
        // Try to extract text using OpenAI
        resumeText = await extractTextFromResume(
          req.file.buffer,
          req.file.mimetype
        );
      } catch (extractError: any) {
        console.error("OpenAI text extraction error, using mock service:", extractError.message);
        
        // Fall back to mock text extraction
        resumeText = extractMockResumeText(req.file.buffer, req.file.mimetype);
        textExtractionSource = "mock";
      }
      
      // Optionally save the resume to storage if a userId is provided
      let savedResumeId = null;
      if (req.body.userId) {
        const resumeData = {
          userId: parseInt(req.body.userId),
          fileName: req.file.originalname,
          contentText: resumeText,
        };
        
        const validatedData = insertResumeSchema.safeParse(resumeData);
        if (validatedData.success) {
          const savedResume = await storage.saveResume(validatedData.data);
          savedResumeId = savedResume.id;
        }
      }
      
      // Analyze the resume (with fallback to mock)
      let analysis;
      let analysisSource = "openai";
      
      try {
        // Try analyzing with OpenAI
        analysis = await analyzeResume(resumeText);
      } catch (analysisError: any) {
        console.error("OpenAI analysis error, using mock service:", analysisError.message);
        
        // Fall back to mock analysis
        analysis = generateMockResumeAnalysis(resumeText);
        analysisSource = "mock";
      }
      
      // If we saved a resume and got an analysis, update the stored resume
      if (savedResumeId !== null) {
        await storage.updateResumeAnalysis(savedResumeId, analysis);
      }
      
      return res.status(200).json({
        message: "Resume uploaded and analyzed successfully",
        data: {
          resumeText,
          analysis
        },
        ...(textExtractionSource === "mock" || analysisSource === "mock" ? {
          notice: "Some or all components of this analysis were generated using a mock service because the OpenAI API is currently unavailable."
        } : {})
      });
    } catch (error: any) {
      console.error("Error uploading and analyzing resume:", error);
      
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
