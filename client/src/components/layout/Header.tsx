import { useState, useEffect } from "react";
import { Link } from "wouter";
import useMobile from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export default function Header() {
  const isMobile = useMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`fixed w-full bg-white z-50 transition-shadow duration-200 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.5 2h-15A2.5 2.5 0 002 4.5v15A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0019.5 2zm-4.7 15.5h-2.2v-3.9c0-.9-.3-1.5-1.2-1.5-.7 0-1.1.4-1.3.9-.1.1-.1.3-.1.6v4H7.8V9.4h2.2v1c.6-.7 1.4-1.2 2.5-1.2 1.8 0 3.2 1.2 3.2 3.7v5.6z"/>
          </svg>
          <Link href="/">
            <span className="text-xl font-bold text-neutral-800 cursor-pointer">ResumeMatch</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#home">
            <a className="text-neutral-600 hover:text-primary font-medium">Home</a>
          </Link>
          <Link href="#features">
            <a className="text-neutral-600 hover:text-primary font-medium">Features</a>
          </Link>
          <Link href="#how-it-works">
            <a className="text-neutral-600 hover:text-primary font-medium">How It Works</a>
          </Link>
          <Link href="#pricing">
            <a className="text-neutral-600 hover:text-primary font-medium">Pricing</a>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link href="#waitlist">
            <Button className="hidden md:block">
              Join Waitlist
            </Button>
          </Link>
          <button 
            className="md:hidden text-neutral-600" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={isMobileMenuOpen 
                  ? "M6 18L18 6M6 6l12 12" 
                  : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden bg-white border-t border-neutral-100 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="#home">
            <a className="block px-3 py-2 text-neutral-600 font-medium rounded-md hover:bg-neutral-100">Home</a>
          </Link>
          <Link href="#features">
            <a className="block px-3 py-2 text-neutral-600 font-medium rounded-md hover:bg-neutral-100">Features</a>
          </Link>
          <Link href="#how-it-works">
            <a className="block px-3 py-2 text-neutral-600 font-medium rounded-md hover:bg-neutral-100">How It Works</a>
          </Link>
          <Link href="#pricing">
            <a className="block px-3 py-2 text-neutral-600 font-medium rounded-md hover:bg-neutral-100">Pricing</a>
          </Link>
          <Link href="#waitlist">
            <a className="block px-3 py-2 text-primary font-medium rounded-md hover:bg-neutral-100">Join Waitlist</a>
          </Link>
        </div>
      </div>
    </header>
  );
}
