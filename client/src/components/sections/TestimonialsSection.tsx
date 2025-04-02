import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface TestimonialProps {
  content: string;
  author: {
    name: string;
    position: string;
    imgSrc: string;
  };
}

const StarRating = () => (
  <div className="flex items-center gap-1 text-amber-500 mb-4">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
      </svg>
    ))}
  </div>
);

const Testimonial = ({ content, author }: TestimonialProps) => (
  <Card>
    <CardContent className="p-6">
      <StarRating />
      <p className="text-neutral-700 mb-6">
        {content}
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-300 overflow-hidden">
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-500">
            {author.name.charAt(0)}
          </div>
        </div>
        <div>
          <div className="font-medium">{author.name}</div>
          <div className="text-sm text-neutral-500">{author.position}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function TestimonialsSection() {
  const testimonials = [
    {
      content: "After struggling with my job search for months, ResumeMatch helped me optimize my resume and find the perfect position. I received 3 interview requests within a week!",
      author: {
        name: "Sarah J.",
        position: "Software Engineer at TechCorp",
        imgSrc: ""
      }
    },
    {
      content: "The detailed resume analysis pointed out issues I never would have noticed. After implementing the suggestions, my callback rate increased by 40%. Worth every penny!",
      author: {
        name: "Michael R.",
        position: "Marketing Manager at BrandCo",
        imgSrc: ""
      }
    },
    {
      content: "As a recent graduate, I had no idea how to make my resume stand out. ResumeMatch guided me through the whole process and I landed my dream job within a month!",
      author: {
        name: "Emily K.",
        position: "Data Analyst at AnalyticsPro",
        imgSrc: ""
      }
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-neutral-600">
            Hear from professionals who have successfully used ResumeMatch to advance their careers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial 
              key={index}
              content={testimonial.content}
              author={testimonial.author}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
