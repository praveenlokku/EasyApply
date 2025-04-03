/**
 * This file provides implementations for AI services using Google's Gemini API as an alternative to OpenAI.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ResumeAnalysisResult, JobMatch } from "../../client/src/lib/utils/resume-parser";
import { generateMockResumeAnalysis, generateMockJobMatches, extractMockResumeText } from './mockAiService';

// Define interface for extracted resume data to fix type issues
interface ExtractedResumeAnalysis {
  overallScore: number;
  atsCompatibility: number;
  keywordOptimization: number;
  experienceRelevance: number;
  recommendations: string[];
}

// Global flag to track Gemini API availability
let isGeminiAvailable = true;

/**
 * Cleanup and extract valid JSON from Gemini API responses
 * @param content Raw content from Gemini API
 * @returns Cleaned content with only valid JSON
 */
function cleanGeminiResponse(content: string): string {
  // Remove markdown code blocks (both at start and anywhere in the string)
  let cleaned = content.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```javascript\s*/g, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  cleaned = cleaned.replace(/\s*```$/g, '');
  
  // Check if content is already valid JSON
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    // Not valid JSON, try to extract it
    console.log("Initial JSON parsing failed, attempting to extract valid JSON");
  }
  
  // First, look for array patterns since many job matches come as arrays
  const arrayRegex = /(\[[\s\S]*?\])/g;
  let arrayMatch;
  const arrayMatches = [];
  
  while ((arrayMatch = arrayRegex.exec(cleaned)) !== null) {
    arrayMatches.push(arrayMatch[1]);
  }
  
  if (arrayMatches.length > 0) {
    console.log(`Found ${arrayMatches.length} potential JSON arrays in response`);
    
    for (const potentialArray of arrayMatches) {
      try {
        JSON.parse(potentialArray);
        console.log("Found valid JSON array");
        return potentialArray;
      } catch (e) {
        // Continue to the next match
      }
    }
  }
  
  // Look for object patterns
  const jsonRegex = /(\{[\s\S]*?\})/g;
  let match;
  const matches = [];
  
  // Use regex exec instead of matchAll for wider compatibility
  while ((match = jsonRegex.exec(cleaned)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length > 0) {
    console.log(`Found ${matches.length} potential JSON objects in response`);
    
    // Try each match, starting with the longest (most likely to be the full response)
    const sortedMatches = matches
      .sort((a, b) => b.length - a.length);
    
    for (const match of sortedMatches) {
      try {
        JSON.parse(match);
        console.log("Found valid JSON object");
        return match;
      } catch (e) {
        // Continue to next match
      }
    }
  }
  
  // If we get here, we couldn't find a valid JSON object
  // Last resort: try to fix common issues
  
  // 1. Remove any trailing or leading non-JSON text
  const strictJsonMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (strictJsonMatch && strictJsonMatch[1]) {
    cleaned = strictJsonMatch[1];
  }
  
  // 2. Try to fix common JSON formatting issues
  const potentiallyFixedJson = cleaned
    // Fix missing quotes around property names
    .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Fix trailing commas in objects and arrays
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']');
    
  try {
    JSON.parse(potentiallyFixedJson);
    console.log("Successfully fixed JSON formatting issues");
    return potentiallyFixedJson;
  } catch (e) {
    // Continue with original approach
  }
  
  // 3. Check for unescaped quotes in string values and try to fix them
  cleaned = cleaned.replace(/:\s*"([^"]*?)"/g, (match, p1) => {
    // Escape any unescaped quotes in the string value
    const escaped = p1.replace(/(?<!\\)"/g, '\\"');
    return `: "${escaped}"`;
  });
  
  // 4. Last resort - try to wrap the entire object in an array if it looks like a single job object
  if (cleaned.includes('"title"') && cleaned.includes('"company"')) {
    try {
      const wrappedInArray = `[${cleaned}]`;
      JSON.parse(wrappedInArray);
      console.log("Successfully parsed as an array item");
      return wrappedInArray;
    } catch (e) {
      // Continue with original cleaned content
    }
  }
  
  return cleaned;
}

/**
 * Initialize the Gemini API client
 * @returns The Gemini API client or null if initialization fails
 */
function initGeminiClient() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
    return null;
  }
}

/**
 * Check if the Gemini API is available and functioning properly
 */
export async function checkGeminiAPIStatus(): Promise<{isValid: boolean, message: string}> {
  try {
    // Try to initialize the client
    const genAI = initGeminiClient();
    if (!genAI) {
      isGeminiAvailable = false;
      return {
        isValid: false,
        message: 'Gemini API key is missing. Please set the GEMINI_API_KEY environment variable.'
      };
    }

    // Try a simple generation to confirm the API is working
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = "Respond with the word 'online' if you can read this.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Check if we got a valid response
    if (text && text.toLowerCase().includes('online')) {
      isGeminiAvailable = true;
      return {
        isValid: true,
        message: 'Gemini API is operational'
      };
    } else {
      isGeminiAvailable = false;
      return {
        isValid: false,
        message: 'Gemini API returned an unexpected response'
      };
    }
  } catch (error: any) {
    isGeminiAvailable = false;
    console.error('Gemini API status check failed:', error);
    return {
      isValid: false,
      message: `Gemini API error: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Analyze a resume against job requirements using Gemini
 * @param resumeText The text content of the resume
 * @param jobDescription Optional job description to compare against
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  // Check Gemini availability first to avoid unnecessary API calls
  try {
    // First check if Gemini is available based on our global flag
    if (!isGeminiAvailable) {
      console.log("Gemini API unavailable based on previous check, using mock resume analysis service");
      return generateMockResumeAnalysis(resumeText, jobDescription);
    }
    
    // Double-check by making a quick API status call if we're unsure
    const apiStatus = await checkGeminiAPIStatus();
    if (!apiStatus.isValid) {
      console.log("Gemini API status check failed: " + apiStatus.message);
      return generateMockResumeAnalysis(resumeText, jobDescription);
    }
  } catch (error) {
    console.log("Error checking Gemini API status, falling back to mock service:", error);
    return generateMockResumeAnalysis(resumeText, jobDescription);
  }
  
  try {
    // Initialize Gemini client
    const genAI = initGeminiClient();
    if (!genAI) {
      throw new Error("Failed to initialize Gemini API client");
    }
    
    // Set up the model with safety settings
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const systemPrompt = jobDescription
      ? `You are an expert resume analyst with deep expertise in Applicant Tracking Systems (ATS) and recruiting. Your analysis must be specific to the actual content in the resume, not generic advice. Focus on concrete, actionable feedback based on the exact skills, experiences, and formatting in the provided document.`
      : `You are an expert resume analyst with deep expertise in Applicant Tracking Systems (ATS) and recruiting. Your analysis must be specific to the actual content in the resume, not generic advice. Focus on concrete, actionable feedback based on the exact skills, experiences, and formatting in the provided document.`;

    const userPrompt = jobDescription
      ? `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nProvide a detailed, content-specific analysis of how well this exact resume matches this specific job description. Your analysis must address:

1. Overall match score (0-100): Calculate based on actual skill overlap, experience relevance, and qualification match
2. ATS compatibility score (0-100): Evaluate based on formatting, keyword usage, and parse-ability
3. Keyword optimization score (0-100): Assess how well the resume incorporates key terms from the job description
4. Experience relevance score (0-100): Determine how relevant the candidate's specific experience is to this role

Most importantly, provide 5-7 specific, actionable recommendations for improvement that directly address gaps between this resume and job description. Each recommendation should reference specific content from the resume or job posting.

Format your response as a JSON object with these properties: overallScore, atsCompatibility, keywordOptimization, experienceRelevance, recommendations (as an array of strings).

Ensure each recommendation is specific, actionable, and directly related to the resume content - avoid generic advice.`
      : `Resume:\n${resumeText}\n\nProvide a detailed, content-specific analysis of this exact resume. Your analysis must address:

1. Overall quality score (0-100): Calculate based on content strength, organization, and impact
2. ATS compatibility score (0-100): Evaluate based on formatting, keyword usage, and parse-ability 
3. Keyword optimization score (0-100): Assess how effectively industry/role-relevant keywords are incorporated
4. Experience relevance score (0-100): Determine how well the experience is presented for their apparent target roles

Most importantly, provide 5-7 specific, actionable recommendations for improvement that address actual issues in this resume. Each recommendation should reference specific content or sections from the resume.

Format your response as a JSON object with these properties: overallScore, atsCompatibility, keywordOptimization, experienceRelevance, recommendations (as an array of strings).

Ensure each recommendation is specific, actionable, and directly related to the resume content - avoid generic advice.`;

    // Generate content with Gemini
    const result = await model.generateContent([
      systemPrompt,
      userPrompt
    ]);
    
    const response = await result.response;
    let content = response.text();
    
    // Clean and extract valid JSON from the response
    content = cleanGeminiResponse(content);
    
    try {
      // Try to manually extract the key parts first for more reliability
      // This is a more direct approach that works even if the JSON formatting is unusual
      const extractedData: ExtractedResumeAnalysis = {
        overallScore: 0,
        atsCompatibility: 0,
        keywordOptimization: 0,
        experienceRelevance: 0,
        recommendations: []
      };
      
      // Extract scores
      const overallScoreMatch = content.match(/"overallScore"\s*:\s*(\d+)/);
      if (overallScoreMatch && overallScoreMatch[1]) {
        extractedData.overallScore = parseInt(overallScoreMatch[1], 10);
      }
      
      const atsMatch = content.match(/"atsCompatibility"\s*:\s*(\d+)/);
      if (atsMatch && atsMatch[1]) {
        extractedData.atsCompatibility = parseInt(atsMatch[1], 10);
      }
      
      const keywordMatch = content.match(/"keywordOptimization"\s*:\s*(\d+)/);
      if (keywordMatch && keywordMatch[1]) {
        extractedData.keywordOptimization = parseInt(keywordMatch[1], 10);
      }
      
      const expMatch = content.match(/"experienceRelevance"\s*:\s*(\d+)/);
      if (expMatch && expMatch[1]) {
        extractedData.experienceRelevance = parseInt(expMatch[1], 10);
      }
      
      // Extract recommendations using regex - this handles text with special characters
      const recommendationsSection = content.match(/"recommendations"\s*:\s*\[([\s\S]*?)\]/);
      if (recommendationsSection && recommendationsSection[1]) {
        const recText = recommendationsSection[1];
        const recommendations = recText.split(/",\s*"/).map(rec => {
          // Clean up the recommendation string
          return rec.replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '"');
        });
        
        extractedData.recommendations = recommendations;
      }
      
      console.log("Successfully extracted resume analysis data using regex approach");
      
      // Update the availability flag since we just had a successful extraction
      isGeminiAvailable = true;
      
      return extractedData;
    } catch (extractError) {
      console.error("Failed to extract Gemini response fields:", extractError);
      
      try {
        // Fallback to JSON.parse if extraction failed
        console.log("Trying JSON.parse as fallback...");
        const analysisResult = JSON.parse(content);
        
        // Update the availability flag since we just had a successful call
        isGeminiAvailable = true;
        
        // Ensure the response has the required structure
        return {
          overallScore: analysisResult.overallScore || analysisResult.overall_score || 0,
          atsCompatibility: analysisResult.atsCompatibility || analysisResult.ats_compatibility || 0,
          keywordOptimization: analysisResult.keywordOptimization || analysisResult.keyword_optimization || 0,
          experienceRelevance: analysisResult.experienceRelevance || analysisResult.experience_relevance || 0,
          recommendations: analysisResult.recommendations || [],
        };
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        console.log("Raw Gemini response:", content);
        throw new Error("Gemini response could not be parsed as JSON");
      }
    }
  } catch (error: any) {
    console.error("Error analyzing resume with Gemini:", error);
    
    // Set the global flag to false for any Gemini API errors
    isGeminiAvailable = false;
    
    // Fall back to mock service for any errors
    console.log("Falling back to mock resume analysis service due to Gemini API error");
    return generateMockResumeAnalysis(resumeText, jobDescription);
  }
}

/**
 * Generate job matches based on a resume using Gemini
 * @param resumeText The text content of the resume
 */
export async function findJobMatchesWithGemini(resumeText: string): Promise<JobMatch[]> {
  // Check Gemini availability first to avoid unnecessary API calls
  try {
    // First check if Gemini is available based on our global flag
    if (!isGeminiAvailable) {
      console.log("Gemini API unavailable based on previous check, using mock job matches service");
      return generateMockJobMatches(resumeText);
    }
    
    // Double-check by making a quick API status call if we're unsure
    const apiStatus = await checkGeminiAPIStatus();
    if (!apiStatus.isValid) {
      console.log("Gemini API status check failed: " + apiStatus.message);
      return generateMockJobMatches(resumeText);
    }
  } catch (error) {
    console.log("Error checking Gemini API status, falling back to mock service:", error);
    return generateMockJobMatches(resumeText);
  }
  
  try {
    // Initialize Gemini client
    const genAI = initGeminiClient();
    if (!genAI) {
      throw new Error("Failed to initialize Gemini API client");
    }
    
    // Set up the model with safety settings
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const systemPrompt = `You are an AI job matching specialist with expertise in career services and talent acquisition. Your task is to analyze the resume provided in detail and generate highly relevant job matches based specifically on the candidate's actual skills, experience, education, and career trajectory. Focus exclusively on the resume content and avoid generic job suggestions.`;

    const userPrompt = `Resume:\n${resumeText}\n\nAnalyze this resume in detail and generate 5 highly targeted and realistic job matches based ONLY on the specific skills, experience, and qualifications mentioned in this resume. Do not suggest generic jobs - each match must directly relate to the candidate's actual background.

For each job, provide:
1. A specific job title that matches their exact experience level (not more senior or more junior)
2. A realistic company name in an industry relevant to their background
3. A match score (0-100) based on how well their skills align with the position
4. A location that makes sense given their work history
5. A realistic salary range based on their experience level and industry
6. A recent posted date (within the last 30 days)

Format the response as a JSON object with a 'jobs' array containing objects with these properties: id, title, company, matchScore, location, salary, postedDate.

Be as specific as possible with each job title and company to ensure they are genuinely matched to the candidate's actual skills and experience.`;

    // Generate content with Gemini
    const result = await model.generateContent([
      systemPrompt,
      userPrompt
    ]);
    
    const response = await result.response;
    let content = response.text();
    
    // Clean and extract valid JSON from the response
    content = cleanGeminiResponse(content);
    
    try {
      // Parse the JSON response
      const jobMatches = JSON.parse(content);
      
      // Update the availability flag since we just had a successful call
      isGeminiAvailable = true;
      
      // Check if we have the expected structure with a jobs array
      if (Array.isArray(jobMatches.jobs)) {
        // Case 1: Standard format with jobs array
        return jobMatches.jobs.map((job: any, index: number) => ({
          id: job.id || `job-${index + 1}`,
          title: job.title,
          company: job.company,
          matchScore: job.matchScore || job.match_score || 0,
          location: job.location,
          salary: job.salary,
          postedDate: job.postedDate || job.posted_date,
        }));
      } 
      // Case 2: The response itself is an array of jobs
      else if (Array.isArray(jobMatches)) {
        return jobMatches.map((job: any, index: number) => ({
          id: job.id || `job-${index + 1}`,
          title: job.title,
          company: job.company,
          matchScore: job.matchScore || job.match_score || 0,
          location: job.location,
          salary: job.salary,
          postedDate: job.postedDate || job.posted_date,
        }));
      }
      // Case 3: A single job object response
      else if (jobMatches.title && jobMatches.company) {
        return [{
          id: jobMatches.id || 'job-1',
          title: jobMatches.title,
          company: jobMatches.company,
          matchScore: jobMatches.matchScore || jobMatches.match_score || 0,
          location: jobMatches.location,
          salary: jobMatches.salary,
          postedDate: jobMatches.postedDate || jobMatches.posted_date,
        }];
      }
      
      // No valid format found
      console.log("Unexpected Gemini API response format:", content);
      throw new Error("Unexpected response format from Gemini API");
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.log("Raw Gemini response:", content);
      throw new Error("Gemini response could not be parsed as JSON");
    }
  } catch (error: any) {
    console.error("Error finding job matches with Gemini:", error);
    
    // Set the global flag to false for any Gemini API errors
    isGeminiAvailable = false;
    
    // Fall back to mock service for any errors
    console.log("Falling back to mock job matches service due to Gemini API error");
    return generateMockJobMatches(resumeText);
  }
}

/**
 * Extract text from a resume file using Gemini's capabilities
 * Note: Gemini currently doesn't support direct image/document analysis in the same way as OpenAI,
 * so this is a placeholder for future implementation. Currently falls back to mock service.
 */
export async function extractTextFromResumeWithGemini(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  // Since Gemini doesn't have direct document parsing in the current API,
  // we'll fall back to the mock service
  console.log("Gemini API doesn't currently support document parsing, using mock service");
  return extractMockResumeText(fileBuffer, fileType);
}