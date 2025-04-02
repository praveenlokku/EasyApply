import { 
  users, type User, type InsertUser, 
  waitlist, type InsertWaitlist, type Waitlist,
  resumes, type Resume, type InsertResume,
  jobDescriptions, type JobDescription, type InsertJobDescription
} from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Waitlist methods
  addToWaitlist(data: InsertWaitlist): Promise<Waitlist>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  
  // Resume methods
  saveResume(resume: InsertResume): Promise<Resume>;
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  updateResumeAnalysis(id: number, analysis: any): Promise<Resume>;
  
  // Job description methods
  saveJobDescription(job: InsertJobDescription): Promise<JobDescription>;
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  getJobDescriptionsByUserId(userId: number): Promise<JobDescription[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private waitlistEntries: Map<number, Waitlist>;
  private resumes: Map<number, Resume>;
  private jobDescriptions: Map<number, JobDescription>;
  
  currentUserId: number;
  currentWaitlistId: number;
  currentResumeId: number;
  currentJobDescriptionId: number;

  constructor() {
    this.users = new Map();
    this.waitlistEntries = new Map();
    this.resumes = new Map();
    this.jobDescriptions = new Map();
    
    this.currentUserId = 1;
    this.currentWaitlistId = 1;
    this.currentResumeId = 1;
    this.currentJobDescriptionId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Waitlist methods
  async addToWaitlist(data: InsertWaitlist): Promise<Waitlist> {
    // Check if email already exists
    const existingEntry = Array.from(this.waitlistEntries.values()).find(
      (entry) => entry.email === data.email
    );

    if (existingEntry) {
      throw new Error("Email already exists in waitlist (unique constraint)");
    }

    const id = this.currentWaitlistId++;
    const createdAt = new Date();
    
    const waitlistEntry: Waitlist = { 
      ...data, 
      id, 
      createdAt 
    };
    
    this.waitlistEntries.set(id, waitlistEntry);
    return waitlistEntry;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    return Array.from(this.waitlistEntries.values());
  }
  
  // Resume methods
  async saveResume(resume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Ensure userId is properly set (not undefined)
    const userId = resume.userId || null;
    
    const newResume: Resume = {
      id,
      userId,
      fileName: resume.fileName,
      contentText: resume.contentText,
      analysis: null,
      createdAt,
      updatedAt
    };
    
    this.resumes.set(id, newResume);
    return newResume;
  }
  
  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }
  
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId
    );
  }
  
  async updateResumeAnalysis(id: number, analysis: any): Promise<Resume> {
    const resume = this.resumes.get(id);
    
    if (!resume) {
      throw new Error("Resume not found");
    }
    
    const updatedResume: Resume = {
      ...resume,
      analysis,
      updatedAt: new Date()
    };
    
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }
  
  // Job description methods
  async saveJobDescription(job: InsertJobDescription): Promise<JobDescription> {
    const id = this.currentJobDescriptionId++;
    const createdAt = new Date();
    
    // Ensure all fields are properly set (not undefined)
    const userId = job.userId || null;
    const location = job.location || null;
    const salary = job.salary || null;
    const postedDate = job.postedDate || null;
    const url = job.url || null;
    
    const newJob: JobDescription = {
      id,
      userId,
      title: job.title,
      company: job.company,
      description: job.description,
      location,
      salary,
      postedDate,
      url,
      createdAt
    };
    
    this.jobDescriptions.set(id, newJob);
    return newJob;
  }
  
  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    return this.jobDescriptions.get(id);
  }
  
  async getJobDescriptionsByUserId(userId: number): Promise<JobDescription[]> {
    return Array.from(this.jobDescriptions.values()).filter(
      (job) => job.userId === userId
    );
  }
}

export const storage = new MemStorage();
