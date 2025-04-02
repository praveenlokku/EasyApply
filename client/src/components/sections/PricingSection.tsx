import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon } from "lucide-react";
import { forwardRef } from "react";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlanProps {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const PricingPlan = ({ name, price, description, features, popular = false }: PricingPlanProps) => {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-md overflow-hidden 
        ${popular 
          ? 'border-2 border-primary relative scale-105 z-10' 
          : 'border border-neutral-200 hover:border-primary transition-colors'
        }
      `}
    >
      {popular && (
        <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className={`p-6 ${popular ? 'pt-10' : ''}`}>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-neutral-500">/month</span>
        </div>
        <p className="text-neutral-600 mb-6">
          {description}
        </p>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              {feature.included ? (
                <>
                  <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{feature.text}</span>
                </>
              ) : (
                <>
                  <XIcon className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-400">{feature.text}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-6 pb-6">
        <Button 
          variant={popular ? "default" : "outline"} 
          className="w-full"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

const PricingSection = forwardRef<HTMLElement, {}>((_props, ref) => {
  const plans = [
    {
      name: "Basic",
      price: "$9.99",
      description: "Perfect for job seekers just getting started.",
      features: [
        { text: "Resume analysis and ATS score", included: true },
        { text: "Basic job recommendations", included: true },
        { text: "3 resume uploads per month", included: true },
        { text: "Job application tracking", included: false },
        { text: "Advanced keyword optimization", included: false },
      ]
    },
    {
      name: "Pro",
      price: "$19.99",
      description: "Advanced features for serious job seekers.",
      features: [
        { text: "All Basic features", included: true },
        { text: "Unlimited resume uploads", included: true },
        { text: "Job application tracking", included: true },
        { text: "Advanced keyword optimization", included: true },
        { text: "Priority support", included: false },
      ],
      popular: true
    },
    {
      name: "Premium",
      price: "$34.99",
      description: "Everything you need for career success.",
      features: [
        { text: "All Pro features", included: true },
        { text: "Personalized resume review", included: true },
        { text: "Industry-specific keyword suggestions", included: true },
        { text: "Priority job matching", included: true },
        { text: "Priority support", included: true },
      ]
    }
  ];

  return (
    <section ref={ref} id="pricing" className="py-16 md:py-24 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-neutral-600">
            Choose the plan that works best for your job search needs. No hidden fees.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingPlan 
              key={index}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              popular={plan.popular}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

PricingSection.displayName = "PricingSection";

export default PricingSection;
