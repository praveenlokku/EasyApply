import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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

// Form schemas
const resumeTextSchema = z.object({
  resumeText: z.string().min(50, "Resume text should be at least 50 characters"),
  jobDescription: z.string().optional(),
});

const resumeFileSchema = z.object({
  resume: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Resume file is required"),
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
    onError: (error) => {
      toast({
        title: "Error analyzing resume",
        description: error.message || "There was an error analyzing your resume",
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
    onError: (error) => {
      toast({
        title: "Error finding job matches",
        description: error.message || "There was an error finding job matches",
        variant: "destructive",
      });
    },
  });

  // Mutation for file-based resume analysis
  const uploadResumeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest<{ data: { resumeText: string, analysis: ResumeAnalysisResult } }>("/api/resume/upload", {
        method: "POST",
        body: data,
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
    onError: (error) => {
      toast({
        title: "Error uploading resume",
        description: error.message || "There was an error uploading your resume",
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
    const formData = new FormData();
    formData.append("resume", data.resume as unknown as File);
    
    // Add user ID if available
    formData.append("userId", CURRENT_USER_ID.toString());
    
    uploadResumeMutation.mutate(formData);
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
          <h1 className="text-3xl font-bold mb-6">Resume Analysis</h1>
          
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