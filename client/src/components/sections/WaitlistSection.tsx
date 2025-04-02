import { useState, forwardRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWaitlistSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import useWaitlist from "@/lib/hooks/use-waitlist";

// Extend the schema with form-specific validation
const waitlistFormSchema = insertWaitlistSchema.extend({
  terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

const WaitlistSection = forwardRef<HTMLElement, {}>((_props, ref) => {
  const { toast } = useToast();
  const { submitWaitlistEntry, isPending, isSuccess } = useWaitlist();

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      name: "",
      email: "",
      profession: "",
      terms: false
    }
  });

  const onSubmit = (data: WaitlistFormValues) => {
    // Remove terms from the data before sending to the API
    const { terms, ...apiData } = data;
    submitWaitlistEntry(apiData);
  };

  return (
    <section ref={ref} id="waitlist" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto">
          <div className="md:flex">
            <div className="md:flex-1 p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Waitlist</h2>
              <p className="text-neutral-600 mb-6">
                Be one of the first to experience our AI-powered resume optimization and job matching platform.
              </p>
              
              {!isSuccess ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Your name"
                      className="mt-1"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="profession">Current Profession</Label>
                    <select
                      id="profession"
                      {...form.register("profession")}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors mt-1"
                    >
                      <option value="" disabled selected>Select your profession</option>
                      <option value="software">Software Development</option>
                      <option value="design">Design</option>
                      <option value="marketing">Marketing</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>
                    {form.formState.errors.profession && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.profession.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-start">
                      <Checkbox
                        id="terms"
                        checked={form.watch("terms")}
                        onCheckedChange={(checked) => {
                          form.setValue("terms", checked as boolean);
                        }}
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="ml-2 text-sm text-neutral-600">
                        I agree to receive updates about ResumeMatch and accept the 
                        <a href="#" className="text-primary hover:underline"> Terms of Service</a> and 
                        <a href="#" className="text-primary hover:underline"> Privacy Policy</a>.
                      </Label>
                    </div>
                    {form.formState.errors.terms && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.terms.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Submitting..." : "Join Waitlist"}
                  </Button>
                </form>
              ) : (
                <div className="bg-emerald-500/10 text-emerald-500 p-6 rounded-lg flex flex-col items-center text-center">
                  <CheckCircle className="w-12 h-12 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
                  <p>
                    Thanks for joining our waitlist. We'll notify you when we launch. In the meantime, check your email for some resume tips.
                  </p>
                </div>
              )}
            </div>
            
            <div className="md:flex-1 p-8 md:p-0 bg-primary hidden md:block">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white">
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">Get Ready to Transform Your Job Search</h3>
                  <p>
                    Our AI-powered platform will help you land interviews faster and find your perfect job match.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
});

WaitlistSection.displayName = "WaitlistSection";

export default WaitlistSection;
