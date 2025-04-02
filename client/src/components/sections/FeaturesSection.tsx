import { forwardRef } from "react";

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  iconBgColor 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-600">
        {description}
      </p>
    </div>
  );
};

const FeaturesSection = forwardRef<HTMLElement, {}>((_props, ref) => {
  const features = [
    {
      title: "Resume Analysis",
      description: "Upload your resume and our AI will analyze its content, format, and keywords to identify strengths and improvement areas.",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
      ),
      iconBgColor: "bg-primary/10"
    },
    {
      title: "ATS Optimization",
      description: "Get a detailed ATS score and recommendations to help your resume get past Applicant Tracking Systems.",
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      ),
      iconBgColor: "bg-emerald-500/10"
    },
    {
      title: "Job Matching",
      description: "Our algorithm matches your resume with job descriptions to find the perfect opportunities for your skills and experience.",
      icon: (
        <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      ),
      iconBgColor: "bg-violet-500/10"
    },
    {
      title: "Performance Tracking",
      description: "Track your application performance with detailed analytics and insights to refine your job search strategy.",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      ),
      iconBgColor: "bg-primary/10"
    },
    {
      title: "Personalized Feedback",
      description: "Receive tailored suggestions to improve your resume's impact for specific job roles and industries.",
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
        </svg>
      ),
      iconBgColor: "bg-emerald-500/10"
    },
    {
      title: "Application Management",
      description: "Organize and manage all your job applications in one place with status tracking and reminders.",
      icon: (
        <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      ),
      iconBgColor: "bg-violet-500/10"
    }
  ];

  return (
    <section ref={ref} id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Unlock Your Career Potential</h2>
          <p className="text-lg text-neutral-600">
            Our platform analyzes your resume against job descriptions to maximize your chances of landing interviews.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              iconBgColor={feature.iconBgColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;
