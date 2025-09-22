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
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { analyzeResumeWithGemini, findJobMatchesWithGemini, extractTextFromResumeWithGemini, checkGeminiAPIStatus } from "./services/gemini";
import { analyzeResume, checkOpenAIAPIStatus, findJobMatches, extractTextFromResume } from "./services/openai";
import { analysis, resumeText, jobDescription, matches } from './someModule';
const openAIStatus = await checkOpenAIAPIStatus();
analysis = await analyzeResume(resumeText, jobDescription);
matches = await findJobMatches(resumeText);
resumeText = await extractTextFromResume(req.file.buffer, req.file.mimetype);

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User authentication endpoints
  
  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      // Validate request body against the insertUserSchema
      const { insertUserSchema } = await import("@shared/schema");
      const validatedData = insertUserSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      // Create user
      const user = await storage.createUser(validatedData.data);
      
      // Return user data without password
      const { password, ...userData } = user;
      
      res.status(201).json(userData);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      if (error.message.includes("Username already exists") || 
          error.message.includes("Email already exists")) {
        return res.status(409).json({ 
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        message: "An error occurred while creating the user",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Login user
  app.post("/api/login", async (req, res) => {
    try {
      // Basic validation for login
      const loginSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required")
      });
      
      const validatedData = loginSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      // Validate credentials
      const user = await storage.validateUserCredentials(
        validatedData.data.username, 
        validatedData.data.password
      );
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid username or password" 
        });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      
      res.json(userData);
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(500).json({ 
        message: "An error occurred during login",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Get user by ID
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          message: "User not found" 
        });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      
      res.json({
        data: userData
      });
    } catch (error: any) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ 
        message: "An error occurred while retrieving the user",
        error: error.message || "Unknown error"
      });
    }
  });

  // API endpoint to check AI service status
  app.get("/api/status", async (req, res) => {
    try {
      const geminiStatus = await checkGeminiAPIStatus().catch(err => {
        console.error("Error checking Gemini API:", err);
        return { isValid: false, message: "Gemini API error: " + (err.message || "Unknown error") };
      });
      
      return res.status(geminiStatus.isValid ? 200 : 503).json({
        status: geminiStatus.isValid ? "active" : "inactive",
        gemini: {
          status: geminiStatus.isValid ? "active" : "inactive",
          message: geminiStatus.message
        },
        preferredService: geminiStatus.isValid ? "gemini" : "mock",
        message: geminiStatus.isValid 
          ? "Gemini API is operational"
          : "Gemini API is currently unavailable. Using mock services for demonstrations."
      });
    } catch (error: any) {
      console.error("Error checking AI services status:", error);
      return res.status(500).json({ 
        status: "error",
        message: "Failed to check AI services status",
        error: error.message || "Unknown error"
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
      
      // Determine which AI service to use - try Gemini first, then OpenAI, then mock
      let analysis;
      let serviceUsed = "gemini";
      
      try {
        // First try Gemini
        const geminiStatus = await checkGeminiAPIStatus();
        
        if (geminiStatus.isValid) {
          // Gemini is available, use it
          analysis = await analyzeResumeWithGemini(resumeText, jobDescription);
        } else {
          // Gemini not available, try OpenAI as fallback
          console.log("Gemini API unavailable, trying OpenAI API");
          const openAIStatus = await checkOpenAIAPIStatus();
          
          if (openAIStatus.isValid) {
            // OpenAI is available, use it
            analysis = await analyzeResume(resumeText, jobDescription);
            serviceUsed = "openai";
          } else {
            // Neither API is available, use mock service
            console.log("Both Gemini and OpenAI APIs unavailable, using mock service");
            analysis = generateMockResumeAnalysis(resumeText, jobDescription);
            serviceUsed = "mock";
          }
        }
        
        // Return the analysis with the appropriate service information
        return res.status(200).json({
          message: "Resume analysis complete",
          data: analysis,
          service: serviceUsed,
          ...(serviceUsed === "mock" ? {
            notice: "This analysis was generated using a mock service because both OpenAI and Gemini APIs are currently unavailable."
          } : {})
        });
      } catch (aiError: any) {
        console.error(`${serviceUsed.toUpperCase()} error, trying fallback services:`, aiError.message);
        
        // First AI service failed, try alternatives
        try {
          if (serviceUsed === "gemini") {
            // Try OpenAI as a fallback to Gemini
            console.log("Gemini API failed, trying OpenAI API as fallback");
            const openAIStatus = await checkOpenAIAPIStatus();
            
            if (openAIStatus.isValid) {
              analysis = await analyzeResume(resumeText, jobDescription);
              serviceUsed = "openai";
            } else {
              // OpenAI not available either, use mock
              analysis = generateMockResumeAnalysis(resumeText, jobDescription);
              serviceUsed = "mock";
            }
          } else if (serviceUsed === "openai") {
            // This should be rare now that Gemini is first, but handle it just in case
            // Try Gemini as a fallback to OpenAI
            console.log("OpenAI API failed, trying Gemini API as fallback");
            const geminiStatus = await checkGeminiAPIStatus();
            
            if (geminiStatus.isValid) {
              analysis = await analyzeResumeWithGemini(resumeText, jobDescription);
              serviceUsed = "gemini";
            } else {
              // Gemini not available either, use mock
              analysis = generateMockResumeAnalysis(resumeText, jobDescription);
              serviceUsed = "mock";
            }
          } else {
            // If all else failed, fall back to mock
            analysis = generateMockResumeAnalysis(resumeText, jobDescription);
            serviceUsed = "mock";
          }
          
          return res.status(200).json({
            message: "Resume analysis complete",
            data: analysis,
            service: serviceUsed,
            ...(serviceUsed === "mock" ? {
              notice: "This analysis was generated using a mock service because both OpenAI and Gemini APIs are currently unavailable."
            } : {})
          });
        } catch (fallbackError: any) {
          // All fallbacks failed, use mock as last resort
          console.error("All AI services failed, using mock service as last resort:", fallbackError.message);
          analysis = generateMockResumeAnalysis(resumeText, jobDescription);
          
          return res.status(200).json({
            message: "Resume analysis complete (using mock service)",
            data: analysis,
            service: "mock",
            notice: "This analysis was generated using a mock service because all AI services failed."
          });
        }
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
      
      // Determine which AI service to use - try Gemini first, then mock
      let matches;
      let serviceUsed = "gemini";
      
      try {
        const geminiStatus = await checkGeminiAPIStatus();
        
        if (geminiStatus.isValid) {
          // Gemini is available, use it
          matches = await findJobMatchesWithGemini(resumeText);
        } else {
          // Gemini not available, use mock service
          console.log("Gemini API unavailable, using mock service");
          matches = generateMockJobMatches(resumeText);
          serviceUsed = "mock";
        }
        
        // Return the job matches with the appropriate service information
        return res.status(200).json({
          message: "Job matching complete",
          data: matches,
          service: serviceUsed,
          ...(serviceUsed === "mock" ? {
            notice: "These job matches were generated using a mock service because both OpenAI and Gemini APIs are currently unavailable."
          } : {})
        });
      } catch (aiError: any) {
        console.error(`${serviceUsed.toUpperCase()} error, trying fallback services:`, aiError.message);
        
        // First AI service failed, try alternatives
        try {
          if (serviceUsed === "gemini") {
            // Try OpenAI as a fallback to Gemini
            console.log("Gemini API failed, trying OpenAI API as fallback");
            const openAIStatus = await checkOpenAIAPIStatus();
            
            if (openAIStatus.isValid) {
              matches = await findJobMatches(resumeText);
              serviceUsed = "openai";
            } else {
              // OpenAI not available either, use mock
              matches = generateMockJobMatches(resumeText);
              serviceUsed = "mock";
            }
          } else if (serviceUsed === "openai") {
            // This should be rare now that Gemini is first, but handle it just in case
            // Try Gemini as a fallback to OpenAI  
            console.log("OpenAI API failed, trying Gemini API as fallback");
            const geminiStatus = await checkGeminiAPIStatus();
            
            if (geminiStatus.isValid) {
              matches = await findJobMatchesWithGemini(resumeText);
              serviceUsed = "gemini";
            } else {
              // Gemini not available either, use mock
              matches = generateMockJobMatches(resumeText);
              serviceUsed = "mock";
            }
          } else {
            // If all else failed, fall back to mock
            matches = generateMockJobMatches(resumeText);
            serviceUsed = "mock";
          }
          
          return res.status(200).json({
            message: "Job matching complete",
            data: matches,
            service: serviceUsed,
            ...(serviceUsed === "mock" ? {
              notice: "These job matches were generated using a mock service because both OpenAI and Gemini APIs are currently unavailable."
            } : {})
          });
        } catch (fallbackError: any) {
          // All fallbacks failed, use mock as last resort
          console.error("All AI services failed, using mock service as last resort:", fallbackError.message);
          matches = generateMockJobMatches(resumeText);
          
          return res.status(200).json({
            message: "Job matching complete (using mock service)",
            data: matches,
            service: "mock",
            notice: "These job matches were generated using a mock service because all AI services failed."
          });
        }
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
      
      // Extract text from the resume file, trying Gemini first, then OpenAI, then mock
      let resumeText;
      let textExtractionSource = "gemini";
      
      try {
        // First try Gemini for text extraction (although currently falls back to mock)
        const geminiStatus = await checkGeminiAPIStatus();

        if (geminiStatus.isValid) {
          // Gemini is available, but currently it doesn't support document parsing directly
          // We'll keep this structure for future updates when Gemini adds this functionality
          resumeText = await extractTextFromResumeWithGemini(
            req.file.buffer,
            req.file.mimetype
          );
          textExtractionSource = "mock"; // Currently Gemini implementation uses mock
        } else {
          // Gemini not available, try OpenAI
          console.log("Gemini API unavailable for extraction, trying OpenAI API");
          const openAIStatus = await checkOpenAIAPIStatus();
          
          if (openAIStatus.isValid) {
            // OpenAI is available, use it
            resumeText = await extractTextFromResume(
              req.file.buffer,
              req.file.mimetype
            );
            textExtractionSource = "openai";
          } else {
            // Neither API is available, use mock service directly
            console.log("Both Gemini and OpenAI APIs unavailable, using mock service for extraction");
            resumeText = extractMockResumeText(req.file.buffer, req.file.mimetype);
            textExtractionSource = "mock";
          }
        }
      } catch (extractError: any) {
        console.error("Text extraction error, using mock service:", extractError.message);
        
        // Fall back to mock text extraction as last resort
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
      
      // Analyze the resume, trying Gemini first, then OpenAI, then mock
      let analysis;
      let analysisSource = "gemini";
      
      try {
        // First try Gemini
        const geminiStatus = await checkGeminiAPIStatus();
        
        if (geminiStatus.isValid) {
          // Gemini is available, use it
          analysis = await analyzeResumeWithGemini(resumeText);
        } else {
          // Gemini not available, try OpenAI as fallback
          console.log("Gemini API unavailable for analysis, trying OpenAI API");
          const openAIStatus = await checkOpenAIAPIStatus();
          
          if (openAIStatus.isValid) {
            // OpenAI is available, use it
            analysis = await analyzeResume(resumeText);
            analysisSource = "openai";
          } else {
            // Neither API is available, use mock service
            console.log("Both Gemini and OpenAI APIs unavailable, using mock service for analysis");
            analysis = generateMockResumeAnalysis(resumeText);
            analysisSource = "mock";
          }
        }
      } catch (analysisError: any) {
        console.error("Analysis error, trying fallback services:", analysisError.message);
        
        try {
          if (analysisSource === "gemini") {
            // Try OpenAI as a fallback to Gemini
            console.log("Gemini API failed, trying OpenAI API as fallback");
            const openAIStatus = await checkOpenAIAPIStatus();
            
            if (openAIStatus.isValid) {
              analysis = await analyzeResume(resumeText);
              analysisSource = "openai";
            } else {
              // OpenAI not available either, use mock
              analysis = generateMockResumeAnalysis(resumeText);
              analysisSource = "mock";
            }
          } else if (analysisSource === "openai") {
            // This should be rare now that Gemini is first, but handle it just in case
            // Try Gemini as a fallback to OpenAI
            console.log("OpenAI API failed, trying Gemini API as fallback");
            const geminiStatus = await checkGeminiAPIStatus();
            
            if (geminiStatus.isValid) {
              analysis = await analyzeResumeWithGemini(resumeText);
              analysisSource = "gemini";
            } else {
              // Gemini not available either, use mock
              analysis = generateMockResumeAnalysis(resumeText);
              analysisSource = "mock";
            }
          } else {
            // If all else failed, fall back to mock
            analysis = generateMockResumeAnalysis(resumeText);
            analysisSource = "mock";
          }
        } catch (fallbackError: any) {
          // All alternatives failed, use mock as last resort
          console.error("All AI services failed for analysis, using mock as last resort:", fallbackError.message);
          analysis = generateMockResumeAnalysis(resumeText);
          analysisSource = "mock";
        }
      }
      
      // If we saved a resume and got an analysis, update the stored resume
      if (savedResumeId !== null) {
        await storage.updateResumeAnalysis(savedResumeId, analysis);
      }
      
      // Determine if we need to include a notice about mock service usage
      const usedMockService = textExtractionSource === "mock" || analysisSource === "mock";
      const usedServices = {
        extraction: textExtractionSource,
        analysis: analysisSource
      };
      
      return res.status(200).json({
        message: "Resume uploaded and analyzed successfully",
        data: {
          resumeText,
          analysis
        },
        services: usedServices,
        ...(usedMockService ? {
          notice: "Some or all components of this process used a mock service because AI APIs were unavailable."
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
