import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertWaitlist } from "@shared/schema";

const useWaitlist = () => {
  const { toast } = useToast();

  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async (data: InsertWaitlist) => {
      const response = await apiRequest('POST', '/api/waitlist', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've been added to our waitlist. We'll notify you when we launch!",
      });
    },
    onError: (err: any) => {
      let errorMessage = "There was a problem adding you to the waitlist. Please try again.";
      
      if (err.message && err.message.includes("409")) {
        errorMessage = "This email is already on our waitlist.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const submitWaitlistEntry = (data: InsertWaitlist) => {
    mutate(data);
  };

  return {
    submitWaitlistEntry,
    isPending,
    isSuccess,
    error
  };
};

export default useWaitlist;
