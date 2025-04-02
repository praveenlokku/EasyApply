import OpenAI from "openai";
import { ResumeAnalysisResult, JobMatch } from "../../client/src/lib/utils/resume-parser";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze a resume against job requirements
 * @param resumeText The text content of the resume
 * @param jobDescription Optional job description to compare against
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
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
    throw new Error(`Failed to analyze resume: ${error.message || "Unknown error"}`);
  }
}

/**
 * Generate job matches based on a resume
 * @param resumeText The text content of the resume
 */
export async function findJobMatches(resumeText: string): Promise<JobMatch[]> {
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
    throw new Error(`Failed to find job matches: ${error.message || "Unknown error"}`);
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
    
    // Extract the text content from the response
    const extractedText = response.choices[0].message.content || '';
    
    if (!extractedText) {
      throw new Error("Failed to extract text from document");
    }
    
    return extractedText;
  } catch (error: any) {
    console.error("Error extracting text from resume:", error);
    
    // If there's an error with OpenAI, try a simple fallback or rethrow the error
    if (error.message && error.message.includes("API key")) {
      throw error; // Rethrow API key errors for proper handling
    }
    
    const errorMessage = error.message || "Unknown error";
    throw new Error(`Failed to extract text from resume: ${errorMessage}`);
  }
}