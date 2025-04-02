/**
 * Utility for resume parsing and analysis
 * In a real implementation, this would connect to a backend service
 * that uses libraries like pdf-parse and mammoth for document parsing
 */

export interface ResumeAnalysisResult {
  overallScore: number;
  atsCompatibility: number;
  keywordOptimization: number;
  experienceRelevance: number;
  recommendations: string[];
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  location: string;
  salary: string;
  postedDate: string;
}

export async function parseResume(file: File): Promise<ResumeAnalysisResult> {
  // This is a mock function for the demo
  // In production, this would send the file to the backend for processing
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return mock analysis
  return {
    overallScore: 85,
    atsCompatibility: 92,
    keywordOptimization: 78,
    experienceRelevance: 85,
    recommendations: [
      "Add more quantifiable achievements to your work experience",
      "Include industry-specific keywords like 'agile development' and 'user experience'",
      "Improve your skills section by adding more technical competencies",
      "Make your education section more prominent"
    ]
  };
}

export async function getJobMatches(resumeData: any): Promise<JobMatch[]> {
  // This is a mock function for the demo
  // In production, this would query job matching API with resume data
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock job matches
  return [
    {
      id: "job1",
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      matchScore: 95,
      location: "San Francisco, CA (Remote)",
      salary: "$130K - $160K",
      postedDate: "2 days ago"
    },
    {
      id: "job2",
      title: "Full Stack Developer",
      company: "GrowthStartup",
      matchScore: 89,
      location: "New York, NY",
      salary: "$110K - $140K",
      postedDate: "5 days ago"
    },
    {
      id: "job3",
      title: "Frontend Engineer",
      company: "InnovateUI",
      matchScore: 82,
      location: "Remote",
      salary: "$100K - $130K",
      postedDate: "1 week ago"
    }
  ];
}
