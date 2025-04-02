/**
 * This file provides mock implementations for AI services when the OpenAI API is unavailable.
 * These implementations return realistic sample data for demonstration purposes.
 */

import { ResumeAnalysisResult, JobMatch } from "../../client/src/lib/utils/resume-parser";

/**
 * Generate a mock resume analysis result
 */
export function generateMockResumeAnalysis(
  resumeText: string, 
  jobDescription?: string
): ResumeAnalysisResult {
  // Basic metrics based on text length to provide some variance
  const textLength = resumeText.length;
  const baseScore = Math.min(75, Math.max(40, Math.floor(textLength / 100)));
  
  // Add some randomness within a range
  const randomVariance = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Generate scores with some variance
  const overallScore = baseScore + randomVariance(-5, 10);
  const atsScore = baseScore + randomVariance(-10, 15);
  const keywordScore = baseScore + randomVariance(-8, 12);
  const experienceScore = baseScore + randomVariance(-7, 13);
  
  // Sample recommendations
  const recommendations = [
    "Use more industry-specific keywords to improve ATS compatibility",
    "Quantify your achievements with specific metrics and results",
    "Ensure your resume has a clean, consistent formatting structure",
    "Tailor your skills section to match the job requirements more closely",
    "Include a concise professional summary at the top of your resume"
  ];
  
  // If job description is provided, add more specific recommendations
  if (jobDescription && jobDescription.length > 0) {
    recommendations.push(
      "Align your work experience more closely with the job requirements",
      "Highlight transferable skills that match this specific position"
    );
  }
  
  // Return the mock analysis
  return {
    overallScore,
    atsCompatibility: atsScore,
    keywordOptimization: keywordScore,
    experienceRelevance: experienceScore,
    recommendations: recommendations.slice(0, 5) // Take up to 5 recommendations
  };
}

/**
 * Generate mock job matches based on resume content
 */
export function generateMockJobMatches(resumeText: string): JobMatch[] {
  // Extract potential keywords from the resume text
  const keywords = extractPotentialKeywords(resumeText);
  
  // Sample job titles and companies
  const jobTitles = [
    "Software Engineer", "Frontend Developer", "Full Stack Developer",
    "UI/UX Designer", "Product Manager", "Data Scientist",
    "DevOps Engineer", "Machine Learning Engineer", "Project Manager"
  ];
  
  const companies = [
    "TechCorp", "Innovate Solutions", "Digital Dynamics",
    "CodeWave", "DataSphere", "Nexus Technologies",
    "Quantum Computing", "Cyber Systems", "Cloud Solutions"
  ];
  
  const locations = [
    "San Francisco, CA", "New York, NY", "Austin, TX",
    "Seattle, WA", "Boston, MA", "Chicago, IL",
    "Remote", "Los Angeles, CA", "Denver, CO"
  ];
  
  const salaryRanges = [
    "$80,000 - $100,000", "$90,000 - $120,000", "$100,000 - $130,000",
    "$110,000 - $140,000", "$120,000 - $150,000", "$130,000 - $160,000"
  ];
  
  // Generate random dates within the last 30 days
  const getRandomRecentDate = () => {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    now.setDate(now.getDate() - daysAgo);
    return now.toISOString().split('T')[0];
  };
  
  // Generate 5 job matches
  return Array(5).fill(null).map((_, index) => {
    // Generate a match score between 65 and 95
    const matchScore = Math.floor(Math.random() * 31) + 65;
    
    return {
      id: `mock-job-${index + 1}`,
      title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      matchScore,
      location: locations[Math.floor(Math.random() * locations.length)],
      salary: salaryRanges[Math.floor(Math.random() * salaryRanges.length)],
      postedDate: getRandomRecentDate()
    };
  });
}

/**
 * Extract text from a resume file using a simplified approach
 * This is a very basic implementation - in a real scenario with no OpenAI,
 * you would use dedicated libraries for extracting text from PDFs and DOCXs
 */
export function extractMockResumeText(fileBuffer: Buffer, fileType: string): string {
  // In a real implementation, we would use libraries like pdf-parse or mammoth
  // For this mock, we'll just return a placeholder text with some metadata
  
  const fileSize = fileBuffer.length;
  const mockText = `
Resume extracted from ${fileType} file (${fileSize} bytes).

JOHN DOE
Software Engineer
john.doe@example.com | (123) 456-7890 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications using React, Node.js, and TypeScript. Passionate about creating intuitive user interfaces and optimizing application performance.

SKILLS
• Programming: JavaScript, TypeScript, Python, HTML, CSS
• Frameworks: React, Node.js, Express, Next.js
• Tools: Git, Docker, AWS, CI/CD pipelines
• Soft Skills: Communication, Problem-solving, Team collaboration

WORK EXPERIENCE
Senior Software Engineer
TechCorp Inc. | Jan 2021 - Present
• Developed and maintained multiple client-facing applications using React and TypeScript
• Implemented responsive designs and optimized application performance
• Collaborated with cross-functional teams to deliver features on schedule

Software Engineer
Web Solutions LLC | Mar 2018 - Dec 2020
• Built RESTful APIs using Node.js and Express
• Integrated third-party services and payment gateways
• Mentored junior developers and conducted code reviews

EDUCATION
Bachelor of Science in Computer Science
University of Technology | Graduated 2018
`;

  return mockText;
}

/**
 * Helper function to extract potential keywords from resume text
 */
function extractPotentialKeywords(text: string): string[] {
  // This is a simplified implementation
  // In a real scenario, we would use NLP techniques to extract relevant keywords
  
  const commonTechKeywords = [
    "javascript", "typescript", "react", "node", "python", "java", "c#", "c++",
    "html", "css", "aws", "azure", "gcp", "docker", "kubernetes", "git",
    "rest", "graphql", "sql", "nosql", "mongodb", "postgresql", "mysql"
  ];
  
  // Convert text to lowercase and filter for common keywords
  const textLower = text.toLowerCase();
  
  return commonTechKeywords.filter(keyword => textLower.includes(keyword));
}