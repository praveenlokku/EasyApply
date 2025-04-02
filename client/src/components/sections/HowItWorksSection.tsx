import { useState, forwardRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const HowItWorksSection = forwardRef<HTMLElement, {}>((_props, ref) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { text: "Uploading resume...", completed: false },
    { text: "Parsing content...", completed: false },
    { text: "Analyzing experience...", completed: false },
    { text: "Generating recommendations...", completed: false }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    // Reset states
    setUploadProgress(true);
    setUploadComplete(false);
    setProcessingSteps(prev => prev.map(step => ({ ...step, completed: false })));
    
    // Simulate processing steps with delays
    let currentStep = 0;
    const totalSteps = processingSteps.length;
    
    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          if (newSteps[currentStep]) {
            newSteps[currentStep].completed = true;
          }
          return newSteps;
        });
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Show complete status after processing
        setTimeout(() => {
          setUploadProgress(false);
          setUploadComplete(true);
        }, 800);
      }
    }, 1000);
  };

  const triggerFileInput = () => {
    document.getElementById('resume-upload')?.click();
  };

  return (
    <section ref={ref} id="how-it-works" className="py-16 md:py-24 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-neutral-600">
            Our AI-powered platform makes resume optimization and job matching simple and effective.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <div className="flex-1 bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">Upload Your Resume</h3>
              <p className="text-neutral-600 mb-4">
                Upload your resume in PDF or DOCX format. Our system supports all common resume formats.
              </p>
              
              <div className="mt-4">
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                  <input 
                    type="file" 
                    id="resume-upload" 
                    className="hidden" 
                    accept=".pdf,.docx" 
                    onChange={handleFileUpload} 
                  />
                  <Button 
                    onClick={triggerFileInput}
                    className="inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Upload Resume
                  </Button>
                  <p className="text-sm text-neutral-500 mt-2">Drag and drop or click to upload</p>
                </div>
                
                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="mt-4">
                    <div className="space-y-3">
                      {processingSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className={`${step.completed ? 'text-primary font-medium' : 'text-neutral-600'}`}>
                            {step.text}
                          </span>
                          {step.completed && (
                            <span className="text-primary">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upload Complete */}
                {uploadComplete && (
                  <div className="mt-4">
                    <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-lg flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Resume successfully analyzed! View your results.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <div className="flex-1 bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">Get Your Resume Score</h3>
              <p className="text-neutral-600 mb-4">
                Our AI analyzes your resume against industry standards and provides a comprehensive score.
              </p>
              
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-neutral-200">
                  <h4 className="font-medium">Resume Analysis</h4>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-neutral-600">Overall Score</span>
                    <span className="text-xl font-bold text-primary">85%</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-neutral-600">ATS Compatibility</span>
                        <span className="text-sm font-medium text-primary">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-neutral-600">Keywords Optimization</span>
                        <span className="text-sm font-medium text-primary">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-neutral-600">Experience Relevance</span>
                        <span className="text-sm font-medium text-primary">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <div className="flex-1 bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">Match With Jobs</h3>
              <p className="text-neutral-600 mb-4">
                Based on your resume, we match you with the most relevant job opportunities that fit your profile.
              </p>
              
              <div className="space-y-4">
                {/* Job Match 1 */}
                <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">Senior Software Engineer</h4>
                      <p className="text-neutral-600">TechCorp Inc.</p>
                    </div>
                    <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
                      95% Match
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-neutral-500">
                    San Francisco, CA (Remote) • $130K - $160K • Posted 2 days ago
                  </div>
                </div>
                
                {/* Job Match 2 */}
                <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">Full Stack Developer</h4>
                      <p className="text-neutral-600">GrowthStartup</p>
                    </div>
                    <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
                      89% Match
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-neutral-500">
                    New York, NY • $110K - $140K • Posted 5 days ago
                  </div>
                </div>
                
                {/* Job Match 3 */}
                <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">Frontend Engineer</h4>
                      <p className="text-neutral-600">InnovateUI</p>
                    </div>
                    <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
                      82% Match
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-neutral-500">
                    Remote • $100K - $130K • Posted 1 week ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = "HowItWorksSection";

export default HowItWorksSection;
