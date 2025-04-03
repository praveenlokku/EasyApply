import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check login status when component mounts or when localStorage changes
    const checkLoginStatus = () => {
      const userId = localStorage.getItem("userId");
      setIsLoggedIn(!!userId);
    };

    checkLoginStatus();

    // Add event listener for storage changes
    window.addEventListener("storage", checkLoginStatus);
    
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/resume-analysis", label: "Resume Analysis" },
    { href: "/job-dashboard", label: "Job Dashboard" },
  ];

  const renderNavLinks = () => (
    <>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Button variant="ghost">{link.label}</Button>
        </Link>
      ))}
      
      {isLoggedIn ? (
        <>
          <Link href="/profile">
            <Button variant="ghost">Profile</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="text-xl font-bold">Job Match AI</div>
          </Link>
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-4 pt-10">
              {renderNavLinks()}
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex gap-3 items-center">
            {renderNavLinks()}
          </div>
        )}
      </div>
    </nav>
  );
}