import OpenAI from "openai";
import { ResumeAnalysisResult, JobMatch } from "../../client/src/lib/utils/resume-parser";
import { 
  generateMockResumeAnalysis, 
  generateMockJobMatches, 
  extractMockResumeText 
} from "./mockAiService";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Global flag to track API availability
let isOpenAIAvailable = true;

// Helper function to check if API key is valid and has quota
export async function checkOpenAIAPIStatus(): Promise<{isValid: boolean, message: string}> {
  try {
    // Making a minimal API call to check status
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using less expensive model for the check
      messages: [
        { role: "user", content: "Hello" }
      ],
      max_tokens: 5
    });
    
    // Update the global availability flag
    isOpenAIAvailable = true;
    
    return { 
      isValid: true, 
      message: "OpenAI API is working properly" 
    };
  } catch (error: any) {
    console.error("OpenAI API status check failed:", error.message);
    
    // Update the global availability flag
    isOpenAIAvailable = false;
    
    if (error.message.includes("quota") || error.code === "insufficient_quota") {
      return {
        isValid: false,
        message: "OpenAI API quota exceeded. Please add a new API key or upgrade your plan."
      };
    }
    
    if (error.message.includes("API key")) {
      return {
        isValid: false,
        message: "Invalid OpenAI API key. Please check your API key configuration."
      };
    }
    
    return {
      isValid: false,
      message: `OpenAI API error: ${error.message}`
    };
  }
}

/**
 * Analyze a resume against job requirements
 * @param resumeText The text content of the resume
 * @param jobDescription Optional job description to compare against
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  // Check OpenAI availability first to avoid unnecessary API calls
  try {
    // First check if OpenAI is available based on our global flag
    if (!isOpenAIAvailable) {
      console.log("OpenAI API unavailable based on previous check, using mock resume analysis service");
      return generateMockResumeAnalysis(resumeText, jobDescription);
    }
    
    // Double-check by making a quick API status call if we're unsure
    const apiStatus = await checkOpenAIAPIStatus();
    if (!apiStatus.isValid) {
      console.log("OpenAI API status check failed: " + apiStatus.message);
      return generateMockResumeAnalysis(resumeText, jobDescription);
    }
  } catch (error) {
    console.log("Error checking OpenAI API status, falling back to mock service:", error);
    return generateMockResumeAnalysis(resumeText, jobDescription);
  }
  
  try {
    const systemPrompt = jobDescription
      ? `You are an expert resume analyst and ATS (Applicant Tracking System) specialist. 
        Analyze the provided resume against the job description. 
        Focus on keyword matches, relevance of experience, and ATS compatibility.`
      : `You are an expert resume analyst and ATS (Applicant Tracking System) specialist. 
        Analyze the provided resume for overall quality, keyword optimization, and ATS compatibility.`;

    const userPrompt = jobDescription
      ? `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nProvide a comprehensive analysis of the resume's compatibility with the job description. Include an overall match score (0-100), ATS compatibility score (0-100), keyword optimization score (0-100), experience relevance score (0-100), and specific recommendations for improvement.`
      : `Resume:\n${resumeText}\n\nProvide a comprehensive analysis of this resume. Include an overall score (0-100), ATS compatibility score (0-100), keyword optimization score (0-100), experience relevance score (0-100), and specific recommendations for improvement.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the JSON response
    const content = response.choices[0].message.content || '{}';
    const analysisResult = JSON.parse(content);

    // Update the availability flag since we just had a successful call
    isOpenAIAvailable = true;

    // Ensure the response has the required structure
    return {
      overallScore: analysisResult.overallScore || analysisResult.overall_score || 0,
      atsCompatibility: analysisResult.atsCompatibility || analysisResult.ats_compatibility || 0,
      keywordOptimization: analysisResult.keywordOptimization || analysisResult.keyword_optimization || 0,
      experienceRelevance: analysisResult.experienceRelevance || analysisResult.experience_relevance || 0,
      recommendations: analysisResult.recommendations || [],
    };
  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    
    // Set the global flag to false for any OpenAI API errors
    isOpenAIAvailable = false;
    
    // Check if it's a quota or API key error
    if (error.message && (error.message.includes("quota") || error.message.includes("API key") || 
        error.status === 429 || error.code === "insufficient_quota")) {
      console.log("Falling back to mock resume analysis service due to API error");
      return generateMockResumeAnalysis(resumeText, jobDescription);
    }
    
    // For all other errors, also fall back to mock service
    console.log("Falling back to mock resume analysis service due to unexpected error:", error.message);
    return generateMockResumeAnalysis(resumeText, jobDescription);
  }
}

/**
 * Generate job matches based on a resume
 * @param resumeText The text content of the resume
 */
export async function findJobMatches(resumeText: string): Promise<JobMatch[]> {
  // Check OpenAI availability first to avoid unnecessary API calls
  try {
    // First check if OpenAI is available based on our global flag
    if (!isOpenAIAvailable) {
      console.log("OpenAI API unavailable based on previous check, using mock job matches service");
      return generateMockJobMatches(resumeText);
    }
    
    // Double-check by making a quick API status call if we're unsure
    const apiStatus = await checkOpenAIAPIStatus();
    if (!apiStatus.isValid) {
      console.log("OpenAI API status check failed: " + apiStatus.message);
      return generateMockJobMatches(resumeText);
    }
  } catch (error) {
    console.log("Error checking OpenAI API status, falling back to mock service:", error);
    return generateMockJobMatches(resumeText);
  }
  
  try {
    const systemPrompt = `You are an AI job matching specialist. Based on the resume provided, 
      generate relevant job matches that would be a good fit for this candidate.`;

    const userPrompt = `Resume:\n${resumeText}\n\nGenerate 5 realistic job matches for this candidate based on their skills, 
      experience, and background. For each job, include a job title, company name, match score (0-100), 
      location, salary range, and posted date. Format the response as a JSON array of objects with the 
      following properties: id, title, company, matchScore, location, salary, postedDate.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the JSON response
    const content = response.choices[0].message.content || '{}';
    const jobMatches = JSON.parse(content);

    // Update the availability flag since we just had a successful call
    isOpenAIAvailable = true;

    // Ensure we have the expected structure
    if (!Array.isArray(jobMatches.jobs)) {
      throw new Error("Unexpected response format from API");
    }

    // Map the response to our JobMatch type
    return jobMatches.jobs.map((job: any, index: number) => ({
      id: job.id || `job-${index + 1}`,
      title: job.title,
      company: job.company,
      matchScore: job.matchScore || job.match_score || 0,
      location: job.location,
      salary: job.salary,
      postedDate: job.postedDate || job.posted_date,
    }));
  } catch (error: any) {
    console.error("Error finding job matches:", error);
    
    // Set the global flag to false for any OpenAI API errors
    isOpenAIAvailable = false;
    
    // Check if it's a quota or API key error
    if (error.message && (error.message.includes("quota") || error.message.includes("API key") || 
        error.status === 429 || error.code === "insufficient_quota")) {
      console.log("Falling back to mock job matches service due to API error");
      return generateMockJobMatches(resumeText);
    }
    
    // For all other errors, also fall back to mock service
    console.log("Falling back to mock job matches service due to unexpected error:", error.message);
    return generateMockJobMatches(resumeText);
  }
}

/**
 * Extract text from a resume file buffer using OpenAI's multimodal capabilities
 * @param fileBuffer The buffer containing the resume file
 * @param fileType The MIME type of the file (e.g., 'application/pdf')
 */
export async function extractTextFromResume(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  // Check OpenAI availability first to avoid unnecessary API calls
  try {
    // First check if OpenAI is available based on our global flag
    if (!isOpenAIAvailable) {
      console.log("OpenAI API unavailable based on previous check, using mock text extraction service");
      return extractMockResumeText(fileBuffer, fileType);
    }
    
    // Double-check by making a quick API status call if we're unsure
    const apiStatus = await checkOpenAIAPIStatus();
    if (!apiStatus.isValid) {
      console.log("OpenAI API status check failed: " + apiStatus.message);
      return extractMockResumeText(fileBuffer, fileType);
    }
    
    // Check if the API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }
  } catch (error: any) {
    console.log("Error checking OpenAI API status, falling back to mock service:", error);
    
    // If the API key is missing completely, we need to throw this error
    if (error.message && error.message.includes("API key is missing")) {
      throw error;
    }
    
    return extractMockResumeText(fileBuffer, fileType);
  }
  
  try {
    console.log(`Extracting text from ${fileType} file...`);
    
    // Check if the API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    
    // Use OpenAI's vision model to analyze the document
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert resume parser. Extract and organize all relevant information from the uploaded resume document. Format the text to preserve structure and key details."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text and information from this resume. Preserve the structure and formatting where relevant. Include all contact information, work experience, skills, education, and any other sections present."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${fileType};base64,${base64File}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });
    
    // Update the availability flag since we just had a successful call
    isOpenAIAvailable = true;
    
    // Extract the text content from the response
    const extractedText = response.choices[0].message.content || '';
    
    if (!extractedText) {
      throw new Error("Failed to extract text from document");
    }
    
    return extractedText;
  } catch (error: any) {
    console.error("Error extracting text from resume:", error);
    
    // Set the global flag to false for any OpenAI API errors
    isOpenAIAvailable = false;
    
    // Always rethrow if the API key is completely missing
    if (error.message && error.message.includes("API key is missing")) {
      throw error;
    }
    
    // Check if it's a quota or API key error
    if (error.message && (error.message.includes("quota") || error.message.includes("API key") || 
        error.status === 429 || error.code === "insufficient_quota")) {
      console.log("Falling back to mock resume text extraction service due to API error");
      return extractMockResumeText(fileBuffer, fileType);
    }
    
    // For all other errors, also fall back to mock service
    console.log("Falling back to mock resume text extraction service due to unexpected error:", error.message);
    return extractMockResumeText(fileBuffer, fileType);
  }
}