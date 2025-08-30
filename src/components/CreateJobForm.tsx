
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from "react";
import { Job, Recruiter } from "@/lib/types";

const formSchema = z.object({
  jobTitle: z.string().min(5, "Job title must be at least 5 characters."),
  jobType: z.enum(["Job", "Internship"], { required_error: "You need to select a job type." }),
  description: z.string().min(50, "Description must be at least 50 characters."),
  salary: z.coerce.number().positive("Salary must be a positive number."),
  deadline: z.date({ required_error: "An application deadline is required." }),
  eligibility: z.string().min(20, "Eligibility criteria must be at least 20 characters."),
  skills: z.string().min(1, "At least one skill is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateJobFormProps {
    onFormSubmit: () => void;
    initialData?: Job | null;
}

export function CreateJobForm({ onFormSubmit, initialData }: CreateJobFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      jobType: "Job",
      description: "",
      eligibility: "",
      skills: "",
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            ...initialData,
            deadline: new Date(initialData.deadline),
            skills: initialData.skills.join(', '),
        });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userProfile) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to post a job." });
      return;
    }

    setIsLoading(true);
    try {
      const skillsArray = values.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

      if (skillsArray.length === 0) {
        form.setError("skills", { type: "manual", message: "At least one skill is required." });
        setIsLoading(false);
        return;
      }
      
      const jobData = {
        ...values,
        skills: skillsArray,
        deadline: values.deadline.toISOString(),
      };

      if(initialData) {
        // Update existing job
        const jobRef = doc(db, "jobs", initialData.id);
        await updateDoc(jobRef, {
            ...jobData,
            status: initialData.status, // Preserve existing status
        });
        toast({ title: "Success!", description: "The job posting has been updated." });

      } else {
        // Create new job
        await addDoc(collection(db, "jobs"), {
            ...jobData,
            recruiterId: userProfile.uid,
            companyName: (userProfile as Recruiter).companyName,
            status: 'open',
            createdAt: serverTimestamp(),
            applicants: [],
        });
        toast({ title: "Success!", description: "Your job posting has been created." });
      }

      onFormSubmit();
    } catch (error: any) {
      toast({ variant: "destructive", title: "An error occurred", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6 pr-2">
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Senior Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="jobType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Type of Opening</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Job" />
                    </FormControl>
                    <FormLabel className="font-normal">Job</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Internship" />
                    </FormControl>
                    <FormLabel className="font-normal">Internship</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the responsibilities and daily tasks for this role." className="min-h-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary / Stipend (per year)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 120000" {...field} />
              </FormControl>
               <FormDescription>
                Enter the annual salary for a job, or the total stipend for an internship.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Application Deadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="eligibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eligibility & Academic Requirements</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., B.Tech in CS/IT, minimum 7.0 CGPA, no active backlogs." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Python, Java, MongoDB"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add the key skills applicants should possess, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {initialData ? "Updating..." : "Submitting..."}
            </>
          ) : (
            initialData ? "Update Job" : "Create Job"
          )}
        </Button>
      </form>
    </Form>
  );
}
