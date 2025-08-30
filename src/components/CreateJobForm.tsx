
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
import { collection, addDoc, serverTimestamp, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from "react";
import { Job } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";

const formSchema = z.object({
  jobDetails: z.object({
    title: z.string().min(5, "Job title must be at least 5 characters."),
    jobType: z.enum(["Full-time", "Internship", "PPO", "Part-time", "Contract"]),
    description: z.string().min(50, "Description must be at least 50 characters."),
    location: z.object({
      type: z.enum(["Onsite", "Remote", "Hybrid"]),
      address: z.string().optional(),
    }),
    domain: z.string().min(1, "Domain is required."),
    roleCategory: z.string().min(1, "Role category is required."),
    workMode: z.enum(["Day Shift", "Night Shift", "Rotational"]),
    duration: z.string().optional(),
    startDate: z.date(),
    applicationDeadline: z.date(),
    joiningDate: z.date().optional(),
  }),
  eligibilityCriteria: z.object({
    cgpa: z.coerce.number().min(0).max(10),
    backlogsAllowed: z.boolean(),
    allowedBacklogCount: z.coerce.number().optional(),
    departmentsAllowed: z.string().min(1, "At least one department is required"),
    yearOfPassing: z.coerce.number().min(1990),
    genderPreference: z.enum(["Any", "Male", "Female"]).optional(),
    skillRequirements: z.string().min(1, "At least one skill is required"),
  }),
  salaryAndBenefits: z.object({
      ctc: z.string().min(1, "CTC is required."),
      stipend: z.string().optional(),
      ppo: z.boolean().default(false),
      ppoCtc: z.string().optional(),
      perks: z.string().optional(),
  }),
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
      jobDetails: {
        title: "",
        jobType: "Full-time",
        description: "",
        location: { type: "Onsite", address: "" },
        domain: "",
        roleCategory: "",
        workMode: "Day Shift",
      },
      eligibilityCriteria: {
        cgpa: 7.0,
        backlogsAllowed: false,
        departmentsAllowed: "",
        yearOfPassing: new Date().getFullYear() + 1,
        skillRequirements: "",
      },
      salaryAndBenefits: {
          ctc: "",
          ppo: false,
      }
    },
  });

  useEffect(() => {
    if (initialData) {
        const data = initialData as any; // Cast to any to handle Firestore Timestamps
        form.reset({
           ...data,
           jobDetails: {
               ...data.jobDetails,
               startDate: data.jobDetails.startDate instanceof Timestamp ? data.jobDetails.startDate.toDate() : new Date(data.jobDetails.startDate),
               applicationDeadline: data.jobDetails.applicationDeadline instanceof Timestamp ? data.jobDetails.applicationDeadline.toDate() : new Date(data.jobDetails.applicationDeadline),
               joiningDate: data.jobDetails.joiningDate ? (data.jobDetails.joiningDate instanceof Timestamp ? data.jobDetails.joiningDate.toDate() : new Date(data.jobDetails.joiningDate)) : undefined,
           },
           eligibilityCriteria: {
               ...data.eligibilityCriteria,
               departmentsAllowed: Array.isArray(data.eligibilityCriteria.departmentsAllowed) ? data.eligibilityCriteria.departmentsAllowed.join(', ') : "",
               skillRequirements: Array.isArray(data.eligibilityCriteria.skillRequirements) ? data.eligibilityCriteria.skillRequirements.join(', ') : "",
           },
           salaryAndBenefits: {
               ...data.salaryAndBenefits,
               perks: Array.isArray(data.salaryAndBenefits.perks) ? data.salaryAndBenefits.perks.join(', ') : ""
           }
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
        const jobDataToSave = {
            ...values,
            eligibilityCriteria: {
                ...values.eligibilityCriteria,
                departmentsAllowed: values.eligibilityCriteria.departmentsAllowed.split(',').map(d => d.trim()).filter(Boolean),
                skillRequirements: values.eligibilityCriteria.skillRequirements.split(',').map(s => s.trim()).filter(Boolean),
            },
            salaryAndBenefits: {
                ...values.salaryAndBenefits,
                perks: values.salaryAndBenefits.perks?.split(',').map(p => p.trim()).filter(Boolean) || []
            },
        };

      if(initialData) {
        // Update existing job
        const jobRef = doc(db, "jobs", initialData.id);
        await updateDoc(jobRef, {
            ...jobDataToSave,
            // Keep existing metadata and other top-level fields
            companyId: initialData.companyId,
            tpoApproved: initialData.tpoApproved,
            metadata: {
                ...initialData.metadata,
                lastUpdated: serverTimestamp(),
            }
        });
        toast({ title: "Success!", description: "The job posting has been updated." });

      } else {
        // Create new job
        await addDoc(collection(db, "jobs"), {
            ...jobDataToSave,
            companyId: userProfile.uid,
            tpoApproved: false, // Default value
            // Default empty structures for other parts of the schema
            applicationProcess: {},
            offerDetails: {},
            tpoOverrides: {},
            metadata: {
                postedBy: userProfile.uid,
                postedOn: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                status: 'Open', // Default status
                applicantCount: 0,
                shortlistedCount: 0,
                hiredCount: 0,
            }
        });
        toast({ title: "Success!", description: "Your job posting has been created." });
      }

      onFormSubmit();
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast({ variant: "destructive", title: "An error occurred", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isInternship = form.watch("jobDetails.jobType") === "Internship";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6 pr-2">
        
        <Card>
            <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Provide the main details about the job opening.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="jobDetails.title" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="jobDetails.jobType" render={({ field }) => (
                    <FormItem><FormLabel>Job Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a job type" /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Internship">Internship</SelectItem><SelectItem value="PPO">PPO</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="jobDetails.description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the role..." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="jobDetails.location.type" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Location Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4">
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Onsite" /></FormControl><FormLabel className="font-normal">Onsite</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Remote" /></FormControl><FormLabel className="font-normal">Remote</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Hybrid" /></FormControl><FormLabel className="font-normal">Hybrid</FormLabel></FormItem>
                    </RadioGroup></FormControl><FormMessage /></FormItem>
                )} />
                {form.watch("jobDetails.location.type") !== 'Remote' && (
                    <FormField control={form.control} name="jobDetails.location.address" render={({ field }) => (<FormItem><FormLabel>Address / Office Location</FormLabel><FormControl><Input placeholder="e.g. 123 Tech Park, Bangalore" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="jobDetails.domain" render={({ field }) => (<FormItem><FormLabel>Domain</FormLabel><FormControl><Input placeholder="e.g. IT, Finance" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="jobDetails.roleCategory" render={({ field }) => (<FormItem><FormLabel>Role Category</FormLabel><FormControl><Input placeholder="e.g. Development" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 {isInternship && <FormField control={form.control} name="jobDetails.duration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 6 months" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="jobDetails.startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="jobDetails.applicationDeadline" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Application Deadline</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Eligibility Criteria</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="eligibilityCriteria.cgpa" render={({ field }) => (<FormItem><FormLabel>Min CGPA</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="eligibilityCriteria.yearOfPassing" render={({ field }) => (<FormItem><FormLabel>Year of Passing</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="eligibilityCriteria.backlogsAllowed" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Allow Backlogs?</FormLabel></div></FormItem>)} />
                {form.watch("eligibilityCriteria.backlogsAllowed") && (
                    <FormField control={form.control} name="eligibilityCriteria.allowedBacklogCount" render={({ field }) => (<FormItem><FormLabel>Allowed Backlog Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                 <FormField control={form.control} name="eligibilityCriteria.departmentsAllowed" render={({ field }) => (<FormItem><FormLabel>Departments Allowed</FormLabel><FormControl><Input placeholder="e.g. Computer Science, Information Technology" {...field} /></FormControl><FormDescription>Comma-separated list of departments.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="eligibilityCriteria.skillRequirements" render={({ field }) => (<FormItem><FormLabel>Skill Requirements</FormLabel><FormControl><Textarea placeholder="e.g. Python, Java, SQL" {...field} /></FormControl><FormDescription>Comma-separated list of required skills.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Salary and Benefits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="salaryAndBenefits.ctc" render={({ field }) => (<FormItem><FormLabel>CTC (Cost to Company)</FormLabel><FormControl><Input placeholder="e.g., 12 LPA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                {isInternship && <FormField control={form.control} name="salaryAndBenefits.stipend" render={({ field }) => (<FormItem><FormLabel>Stipend (for Internship)</FormLabel><FormControl><Input placeholder="e.g., 25000 / month" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                {isInternship && <FormField control={form.control} name="salaryAndBenefits.ppo" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Pre-Placement Offer (PPO) available?</FormLabel></div></FormItem>)} />}
                {form.watch("salaryAndBenefits.ppo") && <FormField control={form.control} name="salaryAndBenefits.ppoCtc" render={({ field }) => (<FormItem><FormLabel>PPO CTC</FormLabel><FormControl><Input placeholder="e.g., 15 LPA" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                <FormField control={form.control} name="salaryAndBenefits.perks" render={({ field }) => (<FormItem><FormLabel>Perks (Optional)</FormLabel><FormControl><Input placeholder="e.g., Medical, Laptop, Travel Allowance" {...field} /></FormControl><FormDescription>Comma-separated list of perks.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {initialData ? "Updating..." : "Submitting..."}</>
          ) : (
            initialData ? "Update Job" : "Create Job"
          )}
        </Button>
      </form>
    </Form>
  );
}
