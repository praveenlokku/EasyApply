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
import { analyzeResumeWithGemini, findJobMatchesWithGemini, extractTextFromResumeWithGemini, checkGeminiAPIStatus } from "./services/gemini";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to check all AI services status
  app.get("/api/status", async (req, res) => {
    try {
      // Check both APIs in parallel
      const [openAIStatus, geminiStatus] = await Promise.all([
        checkOpenAIAPIStatus().catch(err => {
          console.error("Error checking OpenAI API:", err);
          return { isValid: false, message: "OpenAI API error: " + (err.message || "Unknown error") };
        }),
        checkGeminiAPIStatus().catch(err => {
          console.error("Error checking Gemini API:", err);
          return { isValid: false, message: "Gemini API error: " + (err.message || "Unknown error") };
        })
      ]);
      
      // Check if at least one service is available
      const anyServiceAvailable = openAIStatus.isValid || geminiStatus.isValid;
      
      return res.status(anyServiceAvailable ? 200 : 503).json({
        status: anyServiceAvailable ? "active" : "inactive",
        openai: {
          status: openAIStatus.isValid ? "active" : "inactive",
          message: openAIStatus.message
        },
        gemini: {
          status: geminiStatus.isValid ? "active" : "inactive",
          message: geminiStatus.message
        },
        preferredService: openAIStatus.isValid ? "openai" : (geminiStatus.isValid ? "gemini" : "mock"),
        message: anyServiceAvailable 
          ? `AI services operational: ${openAIStatus.isValid ? 'OpenAI' : ''}${(openAIStatus.isValid && geminiStatus.isValid) ? ' and ' : ''}${geminiStatus.isValid ? 'Gemini' : ''}`
          : "All AI services are currently unavailable. Using mock services for demonstrations."
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
  
  // API endpoint to check Gemini API status
  app.get("/api/gemini/status", async (req, res) => {
    try {
      const apiStatus = await checkGeminiAPIStatus();
      
      return res.status(apiStatus.isValid ? 200 : 403).json({
        status: apiStatus.isValid ? "active" : "inactive",
        message: apiStatus.message
      });
    } catch (error: any) {
      console.error("Error checking Gemini API status:", error);
      return res.status(500).json({ 
        status: "error",
        message: "Failed to check Gemini API status"
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
          if (serviceUsed === "openai") {
            // Try Gemini as a fallback to OpenAI
            console.log("Trying Gemini API as fallback");
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
            // If we already tried Gemini, fall back to mock
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
      
      // Determine which AI service to use - try OpenAI first, then Gemini, then mock
      let matches;
      let serviceUsed = "openai";
      
      try {
        // First try OpenAI
        const openAIStatus = await checkOpenAIAPIStatus();
        
        if (openAIStatus.isValid) {
          // OpenAI is available, use it
          matches = await findJobMatches(resumeText);
        } else {
          // OpenAI not available, try Gemini
          console.log("OpenAI API unavailable, trying Gemini API");
          const geminiStatus = await checkGeminiAPIStatus();
          
          if (geminiStatus.isValid) {
            // Gemini is available, use it
            matches = await findJobMatchesWithGemini(resumeText);
            serviceUsed = "gemini";
          } else {
            // Neither API is available, use mock service
            console.log("Both OpenAI and Gemini APIs unavailable, using mock service");
            matches = generateMockJobMatches(resumeText);
            serviceUsed = "mock";
          }
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
          if (serviceUsed === "openai") {
            // Try Gemini as a fallback to OpenAI
            console.log("Trying Gemini API as fallback");
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
            // If we already tried Gemini, fall back to mock
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
      
      // Extract text from the resume file, trying OpenAI first, then Gemini, then mock
      let resumeText;
      let textExtractionSource = "openai";
      
      try {
        // First try OpenAI for text extraction
        const openAIStatus = await checkOpenAIAPIStatus();
        
        if (openAIStatus.isValid) {
          // OpenAI is available, use it
          resumeText = await extractTextFromResume(
            req.file.buffer,
            req.file.mimetype
          );
        } else {
          // OpenAI not available, try Gemini (though currently it falls back to mock directly)
          console.log("OpenAI API unavailable for extraction, trying Gemini API");
          
          // Note: Gemini implementation currently falls back to mock as it doesn't support document parsing
          // But we'll keep the structure for future updates when Gemini adds this functionality
          resumeText = await extractTextFromResumeWithGemini(
            req.file.buffer,
            req.file.mimetype
          );
          textExtractionSource = "mock"; // Currently Gemini implementation uses mock
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
      
      // Analyze the resume, trying OpenAI first, then Gemini, then mock
      let analysis;
      let analysisSource = "openai";
      
      try {
        // First try OpenAI
        const openAIStatus = await checkOpenAIAPIStatus();
        
        if (openAIStatus.isValid) {
          // OpenAI is available, use it
          analysis = await analyzeResume(resumeText);
        } else {
          // OpenAI not available, try Gemini
          console.log("OpenAI API unavailable for analysis, trying Gemini API");
          const geminiStatus = await checkGeminiAPIStatus();
          
          if (geminiStatus.isValid) {
            // Gemini is available, use it
            analysis = await analyzeResumeWithGemini(resumeText);
            analysisSource = "gemini";
          } else {
            // Neither API is available, use mock service
            console.log("Both OpenAI and Gemini APIs unavailable, using mock service for analysis");
            analysis = generateMockResumeAnalysis(resumeText);
            analysisSource = "mock";
          }
        }
      } catch (analysisError: any) {
        console.error("Analysis error, trying fallback services:", analysisError.message);
        
        try {
          if (analysisSource === "openai") {
            // Try Gemini as a fallback
            console.log("Trying Gemini API as analysis fallback");
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
            // If we already tried Gemini or otherwise, fall back to mock
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
