// Types for resume parsing and analysis
export interface ResumeAnalysisResult {
  overallScore: number; // 0-100 score
  atsCompatibility: number; // 0-100 score
  keywordOptimization: number; // 0-100 score 
  experienceRelevance: number; // 0-100 score
  recommendations: string[];
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  matchScore: number; // 0-100 score
  location: string;
  salary: string;
  postedDate: string;
}

export interface ResumeExtraction {
  resumeText: string;
  metadata?: {
    fileName?: string;
    fileType?: string;
    extractionMethod?: string;
  };
}

// Utility functions for resume parsing and formatting can be added here
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function getScoreDescription(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}