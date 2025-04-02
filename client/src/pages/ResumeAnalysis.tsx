import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { ResumeAnalysisResult, JobMatch } from "@/lib/utils/resume-parser";

// API status response type
type ApiStatusResponse = {
  status: "active" | "inactive";
  message: string;
};

// Form schemas
const resumeTextSchema = z.object({
  resumeText: z.string().min(50, "Resume text should be at least 50 characters"),
  jobDescription: z.string().optional(),
});

const resumeFileSchema = z.object({
  resume: z
    .any()
    .refine((files) => files && files.length > 0, "Resume file is required"),
});

type ResumeTextFormValues = z.infer<typeof resumeTextSchema>;
type ResumeFileFormValues = z.infer<typeof resumeFileSchema>;

// Mock user ID - in a real app this would come from authentication
const CURRENT_USER_ID = 1;

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("text");
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [aiStatus, setAiStatus] = useState<"active" | "inactive" | "checking" | "error">("checking");
  const [preferredService, setPreferredService] = useState<"openai" | "gemini" | "mock">("openai");
  
  // Query to check AI services status
  const aiStatusQuery = useQuery({
    queryKey: ["/api/status"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching AI status:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });
  
  // Handle API status changes
  useEffect(() => {
    if (aiStatusQuery.isSuccess) {
      setAiStatus(aiStatusQuery.data.status);
      setPreferredService(aiStatusQuery.data.preferredService);
      
      if (aiStatusQuery.data.status === "inactive") {
        toast({
          title: "AI Services Unavailable",
          description: aiStatusQuery.data.message,
          variant: "destructive",
        });
      }
    } else if (aiStatusQuery.isError) {
      setAiStatus("error");
    }
  }, [aiStatusQuery.data, aiStatusQuery.isSuccess, aiStatusQuery.isError, toast]);

// Form for text-based resume analysis
  const textForm = useForm<ResumeTextFormValues>({
    resolver: zodResolver(resumeTextSchema),
    defaultValues: {
      resumeText: "",
      jobDescription: "",
    },
  });

  // Form for file-based resume analysis
  const fileForm = useForm<ResumeFileFormValues>({
    resolver: zodResolver(resumeFileSchema),
    defaultValues: {},
  });

  // Mutation for text-based resume analysis
  const analyzeResumeMutation = useMutation({
    mutationFn: async (data: ResumeTextFormValues) => {
      return apiRequest<{ data: ResumeAnalysisResult }>("/api/resume/analyze", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (response) => {
      setAnalysis(response.data);
      setResumeText(textForm.getValues().resumeText);
      toast({
        title: "Resume analyzed successfully",
        description: "Your resume has been analyzed. Check results below.",
      });
      
      // After analysis, find job matches
      findJobMatches(textForm.getValues().resumeText);
    },
    onError: (error: any) => {
      // Handle API quota exceeded errors
      if (error.response?.data?.error === 'api_quota_exceeded') {
        toast({
          title: "API Quota Exceeded",
          description: "The OpenAI API quota has been exceeded. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle API key errors
      if (error.response?.data?.error === 'api_key_error') {
        toast({
          title: "API Key Error",
          description: "The OpenAI API key is missing or invalid. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error analyzing resume",
        description: error.response?.data?.message || error.message || "There was an error analyzing your resume",
        variant: "destructive",
      });
    },
  });

  // Mutation for finding job matches
  const findJobMatchesMutation = useMutation({
    mutationFn: async (resumeText: string) => {
      return apiRequest<{ data: JobMatch[] }>("/api/resume/job-matches", {
        method: "POST",
        body: JSON.stringify({ resumeText }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (response) => {
      setJobMatches(response.data);
    },
    onError: (error: any) => {
      // Handle API quota exceeded errors
      if (error.response?.data?.error === 'api_quota_exceeded') {
        toast({
          title: "API Quota Exceeded",
          description: "The OpenAI API quota has been exceeded. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle API key errors
      if (error.response?.data?.error === 'api_key_error') {
        toast({
          title: "API Key Error",
          description: "The OpenAI API key is missing or invalid. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error finding job matches",
        description: error.response?.data?.message || error.message || "There was an error finding job matches",
        variant: "destructive",
      });
    },
  });

  // Mutation for file-based resume analysis
  const uploadResumeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Upload mutation executing with FormData");
      // Check that FormData contains the resume file
      if (!data.has("resume")) {
        console.error("FormData missing resume file when mutation called");
      }
      
      return apiRequest<{ data: { resumeText: string, analysis: ResumeAnalysisResult } }>("/api/resume/upload", {
        method: "POST",
        body: data,
        // Do not set Content-Type header with FormData - browser will set it with boundary
      });
    },
    onSuccess: (response) => {
      setResumeText(response.data.resumeText);
      setAnalysis(response.data.analysis);
      toast({
        title: "Resume uploaded and analyzed successfully",
        description: "Your resume has been processed. Check results below.",
      });
      
      // After analysis, find job matches
      findJobMatches(response.data.resumeText);
    },
    onError: (error: any) => {
      // Handle API quota exceeded errors
      if (error.response?.data?.error === 'api_quota_exceeded') {
        toast({
          title: "API Quota Exceeded",
          description: "The OpenAI API quota has been exceeded. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle API key errors
      if (error.response?.data?.error === 'api_key_error') {
        toast({
          title: "API Key Error",
          description: "The OpenAI API key is missing or invalid. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle no file provided error
      if (error.response?.status === 400) {
        toast({
          title: "File Upload Error",
          description: error.response?.data?.message || "Please make sure you've selected a valid resume file.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error uploading resume",
        description: error.response?.data?.message || error.message || "There was an error uploading your resume",
        variant: "destructive",
      });
    },
  });

  // Function to handle text-based form submission
  const onTextSubmit = (data: ResumeTextFormValues) => {
    analyzeResumeMutation.mutate(data);
  };

  // Function to handle file-based form submission
  const onFileSubmit = (data: ResumeFileFormValues) => {
    console.log("onFileSubmit called with data:", data);
    const formData = new FormData();
    
    // Extract file from FileList and append it to FormData
    if (data.resume && data.resume.length > 0) {
      const file = data.resume[0];
      console.log("File to upload:", file.name, file.type, file.size);
      formData.append("resume", file);
      
      // Add user ID if available
      formData.append("userId", CURRENT_USER_ID.toString());
      
      // Debug FormData
      console.log("FormData created, contains resume:", formData.has("resume"));
      console.log("FormData contains userId:", formData.has("userId"));
      
      uploadResumeMutation.mutate(formData);
    } else {
      console.error("No file in form data");
      toast({
        title: "No file selected",
        description: "Please select a resume file to upload",
        variant: "destructive",
      });
    }
  };

  // Function to find job matches
  const findJobMatches = (text: string) => {
    if (text) {
      findJobMatchesMutation.mutate(text);
    }
  };

  // Function to get score color based on score value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Resume Analysis</h1>
          <div className={`border rounded-md p-4 mb-6 ${
            aiStatus === "active" ? "bg-green-50 border-green-200" : 
            aiStatus === "inactive" ? "bg-red-50 border-red-200" : 
            aiStatus === "checking" ? "bg-blue-50 border-blue-200" : 
            "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {aiStatus === "active" && (
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                {aiStatus === "inactive" && (
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                )}
                {aiStatus === "checking" && (
                  <svg className="h-5 w-5 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {aiStatus === "error" && (
                  <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  aiStatus === "active" ? "text-green-800" : 
                  aiStatus === "inactive" ? "text-red-800" : 
                  aiStatus === "checking" ? "text-blue-800" : 
                  "text-yellow-800"
                }`}>
                  AI Services Status: {aiStatus === "checking" ? "Checking..." : aiStatus.charAt(0).toUpperCase() + aiStatus.slice(1)}
                </h3>
                <div className={`mt-1 text-sm ${
                  aiStatus === "active" ? "text-green-700" : 
                  aiStatus === "inactive" ? "text-red-700" : 
                  aiStatus === "checking" ? "text-blue-700" : 
                  "text-yellow-700"
                }`}>
                  {aiStatus === "active" && preferredService === "openai" && (
                    <p>OpenAI API is working properly. You can use all features of the resume analyzer.</p>
                  )}
                  {aiStatus === "active" && preferredService === "gemini" && (
                    <p>Google Gemini API is working properly. Resume analysis will use Gemini's AI capabilities.</p>
                  )}
                  {aiStatus === "active" && preferredService === "mock" && (
                    <p>Using fallback services. Resume analysis will use simulated AI capabilities for demonstration.</p>
                  )}
                  {aiStatus === "inactive" && (
                    <p>All AI services are currently unavailable. Resume analysis will use fallback simulated results for demonstration.</p>
                  )}
                  {aiStatus === "checking" && (
                    <p>Checking AI services status. Features requiring AI might be limited until status is confirmed.</p>
                  )}
                  {aiStatus === "error" && (
                    <p>Could not verify AI services status. Some features may not work properly.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="text" className="text-center">
                <FileText className="mr-2 h-4 w-4" />
                Enter Resume Text
              </TabsTrigger>
              <TabsTrigger value="file" className="text-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume File
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Resume Text</CardTitle>
                  <CardDescription>
                    Paste your resume text below for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...textForm}>
                    <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-6">
                      <FormField
                        control={textForm.control}
                        name="resumeText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resume Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Paste your resume content here..." 
                                className="min-h-[200px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include your full resume text for the most accurate analysis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={textForm.control}
                        name="jobDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Paste a specific job description to compare against..." 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Adding a job description will provide more targeted analysis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={analyzeResumeMutation.isPending}
                      >
                        {analyzeResumeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>Analyze Resume</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="file">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Resume File</CardTitle>
                  <CardDescription>
                    Upload your resume as PDF, DOCX, or TXT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...fileForm}>
                    <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-6">
                      <FormField
                        control={fileForm.control}
                        name="resume"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel>Resume File</FormLabel>
                            <FormControl>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                                <Input
                                  type="file"
                                  accept=".pdf,.docx,.txt"
                                  className="hidden"
                                  id="resume-upload"
                                  onChange={(e) => {
                                    console.log("File selected:", e.target.files);
                                    onChange(e.target.files);
                                  }}
                                  {...field}
                                />
                                <label htmlFor="resume-upload" className="cursor-pointer">
                                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 mb-1">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    PDF, DOCX or TXT (Max 10MB)
                                  </p>
                                  {fileForm.watch("resume") && (
                                    <div className="mt-4 flex items-center justify-center text-sm text-primary">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      {(fileForm.watch("resume") as unknown as FileList)[0]?.name}
                                    </div>
                                  )}
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={uploadResumeMutation.isPending}
                      >
                        {uploadResumeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading & Analyzing...
                          </>
                        ) : (
                          <>Upload & Analyze</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              <div className="lg:col-span-7 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Analysis Results</CardTitle>
                    <CardDescription>
                      Analysis of your resume's strengths and areas for improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Overall Score</h3>
                        <div className={`text-xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                          {analysis.overallScore}/100
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">ATS Compatibility</div>
                          <div className={`text-xl font-bold ${getScoreColor(analysis.atsCompatibility)}`}>
                            {analysis.atsCompatibility}/100
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">Keyword Optimization</div>
                          <div className={`text-xl font-bold ${getScoreColor(analysis.keywordOptimization)}`}>
                            {analysis.keywordOptimization}/100
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">Experience Relevance</div>
                          <div className={`text-xl font-bold ${getScoreColor(analysis.experienceRelevance)}`}>
                            {analysis.experienceRelevance}/100
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Recommendations</h3>
                        <ul className="space-y-2 pl-5 list-disc">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-gray-700">{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Matching Jobs</CardTitle>
                    <CardDescription>
                      Jobs that match your resume profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {findJobMatchesMutation.isPending ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : jobMatches.length > 0 ? (
                      <div className="space-y-4">
                        {jobMatches.map((job) => (
                          <div key={job.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.company}</p>
                              </div>
                              <div className={`text-sm font-bold ${getScoreColor(job.matchScore)}`}>
                                {job.matchScore}% Match
                              </div>
                            </div>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="mr-3">{job.location}</span>
                              <span>{job.salary}</span>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-xs text-gray-500">Posted: {job.postedDate}</span>
                              <Button size="sm">View Details</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">No matching jobs found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your resume to improve matches</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}