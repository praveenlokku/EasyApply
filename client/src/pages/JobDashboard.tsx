import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertJobDescriptionSchema, type JobDescription } from "@shared/schema";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, PlusCircle, Calendar, MapPin, DollarSign, ExternalLink, Clock } from "lucide-react";

// Form schema for job description
const jobFormSchema = z.object({
  title: z.string().min(2, { message: "Job title is required" }),
  company: z.string().min(2, { message: "Company name is required" }),
  description: z.string().min(10, { message: "Job description must be at least 10 characters" }),
  location: z.string().optional(),
  salary: z.string().optional(),
  postedDate: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

// Mock user ID - in a real app this would come from authentication
const CURRENT_USER_ID = 1;

export default function JobDashboard() {
  const { toast } = useToast();
  const [activeJob, setActiveJob] = useState<JobDescription | null>(null);
  const [openJobDialog, setOpenJobDialog] = useState(false);

  // Form for job description
  const jobForm = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      location: "",
      salary: "",
      postedDate: new Date().toISOString().split('T')[0],
      url: "",
    },
  });

  // Fetch saved job descriptions
  const { data: jobDescriptions, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/job/user', CURRENT_USER_ID],
    queryFn: async () => {
      const response = await apiRequest<{ data: JobDescription[] }>(`/api/job/user/${CURRENT_USER_ID}`);
      return response.data;
    }
  });

  // Mutation for saving job description
  const saveJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      // Add user ID to the data
      const jobData = {
        ...data,
        userId: CURRENT_USER_ID
      };
      
      return apiRequest<{ data: JobDescription }>("/api/job/save", {
        method: "POST",
        body: JSON.stringify(jobData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Job saved successfully",
        description: "The job has been added to your dashboard.",
      });
      
      // Close dialog and reset form
      setOpenJobDialog(false);
      jobForm.reset();
      
      // Invalidate job descriptions query
      queryClient.invalidateQueries({ queryKey: ['/api/job/user', CURRENT_USER_ID] });
    },
    onError: (error) => {
      toast({
        title: "Error saving job",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to handle job form submission
  const onJobSubmit = (data: JobFormValues) => {
    saveJobMutation.mutate(data);
  };

  // Function to view job details
  const viewJobDetails = (job: JobDescription) => {
    setActiveJob(job);
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Job Dashboard</h1>
              <p className="text-gray-600">
                Manage your job applications and saved positions
              </p>
            </div>
            <Dialog open={openJobDialog} onOpenChange={setOpenJobDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Job</DialogTitle>
                  <DialogDescription>
                    Enter the details of the job you want to save or apply to.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...jobForm}>
                  <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={jobForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Frontend Developer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Acme Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={jobForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter the job description..." 
                              className="min-h-[150px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={jobForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. New York, NY (Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary Range</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. $80,000 - $100,000 (Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={jobForm.control}
                        name="postedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Posted Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/jobs/123 (Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenJobDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveJobMutation.isPending}>
                        {saveJobMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>Save Job</>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Saved Jobs
                  </CardTitle>
                  <CardDescription>
                    Jobs you've saved for later application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingJobs ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : jobDescriptions && jobDescriptions.length > 0 ? (
                    <div className="space-y-3">
                      {jobDescriptions.map((job: JobDescription) => (
                        <div 
                          key={job.id} 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${activeJob?.id === job.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                          onClick={() => viewJobDetails(job)}
                        >
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            {job.location && (
                              <span className="flex items-center mr-3">
                                <MapPin className="h-3 w-3 mr-1" />
                                {job.location}
                              </span>
                            )}
                            {job.postedDate && (
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(job.postedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You haven't saved any jobs yet.</p>
                      <Button onClick={() => setOpenJobDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Your First Job
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7">
              {activeJob ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{activeJob.title}</CardTitle>
                        <CardDescription className="text-lg">{activeJob.company}</CardDescription>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {activeJob.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{activeJob.location}</span>
                        </div>
                      )}
                      {activeJob.salary && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{activeJob.salary}</span>
                        </div>
                      )}
                      {activeJob.postedDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Posted: {formatDate(activeJob.postedDate)}</span>
                        </div>
                      )}
                      {activeJob.createdAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Saved: {formatDate(activeJob.createdAt.toString())}</span>
                        </div>
                      )}
                    </div>

                    {activeJob.url && (
                      <div>
                        <a 
                          href={activeJob.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View original job posting
                        </a>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-3">Job Description</h3>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{activeJob.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <Button variant="outline">
                        Add Notes
                      </Button>
                      <div>
                        <Button className="ml-2">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12 border rounded-lg border-dashed text-center">
                  <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Job Details</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Select a job from the list to view its details or add a new job to get started.
                  </p>
                  <Button onClick={() => setOpenJobDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Job
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}