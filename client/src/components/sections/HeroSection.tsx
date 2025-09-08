import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { forwardRef } from "react";

const HeroSection = forwardRef<HTMLElement, {}>((_props, ref) => {
  return (
    <section ref={ref} id="home" className="relative pt-24 pb-20 md:pt-32 md:pb-24 bg-gradient-to-r from-blue-500 to-violet-500 text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Get Hired Faster with AI-Powered Resume Analysis
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Stop guessing if your resume will pass the ATS. Our AI analyzes your resume, matches it to job descriptions, and helps you land more interviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="#waitlist">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-neutral-100">
                  Join the Waitlist
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300 hover:border-yellow-300 ring-4 ring-yellow-400/50 ring-opacity-75 shadow-lg shadow-yellow-400/25 animate-pulse">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 shadow-lg">
              <div className="rounded-lg w-full bg-neutral-800/40 h-[300px] flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover rounded-lg opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex items-end justify-center pb-4">
                  <div className="text-center">
                    <p className="text-xs text-white/80">Resume analysis and job matching in one place</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-neutral-800 font-medium">Resume Score</div>
                  <div className="text-emerald-500 font-bold">92%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-white/80 mb-4">Trusted by professionals from</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-80">
            <div className="text-white font-bold text-xl">Google</div>
            <div className="text-white font-bold text-xl">Microsoft</div>
            <div className="text-white font-bold text-xl">Apple</div>
            <div className="text-white font-bold text-xl">Amazon</div>
            <div className="text-white font-bold text-xl">Meta</div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-0">
        <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
        </svg>
      </div>
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
