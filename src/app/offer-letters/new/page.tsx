
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Job, Student, Application, Recruiter, OfferLetter } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
import { ArrowLeft, Loader2, UserCheck, FilePlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const offerLetterSchema = z.object({
  jobId: z.string().min(1),
  studentId: z.string().min(1),
  applicationId: z.string().min(1),
  joiningDate: z.date({ required_error: "A joining date is required." }),
  ctc: z.string().min(1, "CTC is required."),
  stipend: z.string().optional(),
});

type OfferLetterFormValues = z.infer<typeof offerLetterSchema>;

export default function NewOfferLetterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile } = useAuth();
    const { toast } = useToast();

    const [job, setJob] = useState<Job | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const jobId = searchParams.get('jobId');
    const studentId = searchParams.get('studentId');
    const applicationId = searchParams.get('applicationId');

    const form = useForm<OfferLetterFormValues>({
        resolver: zodResolver(offerLetterSchema),
        defaultValues: {
            jobId: jobId || "",
            studentId: studentId || "",
            applicationId: applicationId || "",
            ctc: "",
            stipend: "",
        },
    });
    
    useEffect(() => {
        if (!jobId || !studentId) {
            toast({ variant: "destructive", title: "Missing Information", description: "Job or student details are missing." });
            router.back();
            return;
        }

        const fetchData = async () => {
            const jobDoc = await getDoc(doc(db, "jobs", jobId));
            if (jobDoc.exists()) {
                const jobData = jobDoc.data() as Job;
                setJob(jobData);
                // Pre-fill form with job data
                form.setValue("ctc", jobData.salaryAndBenefits.ctc);
                if (jobData.salaryAndBenefits.stipend) {
                    form.setValue("stipend", jobData.salaryAndBenefits.stipend);
                }
                 if (jobData.jobDetails.joiningDate) {
                    form.setValue("joiningDate", (jobData.jobDetails.joiningDate as Timestamp).toDate());
                }
            }

            const studentDoc = await getDoc(doc(db, "users", studentId));
            if (studentDoc.exists()) {
                setStudent(studentDoc.data() as Student);
            }
        };

        fetchData();
    }, [jobId, studentId, router, toast, form]);


    const onSubmit = async (values: OfferLetterFormValues) => {
        if (!userProfile || !job || !student) {
            toast({ variant: "destructive", title: "Error", description: "User, job, or student data is missing." });
            return;
        }
        setIsLoading(true);

        try {
            const offerLetterData: Omit<OfferLetter, 'id'> = {
                applicationId: values.applicationId,
                jobId: values.jobId,
                studentId: values.studentId,
                recruiterId: userProfile.uid,
                issuedAt: serverTimestamp(),
                content: {
                    studentName: student.name,
                    companyName: (userProfile as Recruiter).companyName,
                    recruiterName: userProfile.name,
                    recruiterEmail: userProfile.email,
                    jobTitle: job.jobDetails.title,
                    joiningDate: values.joiningDate,
                    ctc: values.ctc,
                    stipend: values.stipend,
                },
            };

            // Create the offer letter document
            const docRef = await addDoc(collection(db, "offerLetters"), offerLetterData);
            
            // Update the application with the new status and offer letter ID
            const appRef = doc(db, "applications", values.applicationId);
            await updateDoc(appRef, {
                status: 'offer',
                offerLetterId: docRef.id,
            });

            toast({ title: "Success", description: "Offer letter has been generated and sent to the student." });
            router.push(`/offer-letters/${docRef.id}`);

        } catch (error) {
            console.error("Error generating offer letter: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not generate the offer letter." });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!job || !student) {
        return <AppLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin"/></div></AppLayout>
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl font-headline flex items-center gap-2"><FilePlus /> Generate Offer Letter</CardTitle>
                                <CardDescription>Confirm the details below to generate and issue an offer letter.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted rounded-md space-y-2">
                                     <div className="flex justify-between">
                                        <p className="text-sm font-semibold">Candidate:</p>
                                        <p className="text-sm">{student.name}</p>
                                     </div>
                                     <div className="flex justify-between">
                                        <p className="text-sm font-semibold">Applying for:</p>
                                        <p className="text-sm">{job.jobDetails.title}</p>
                                     </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="joiningDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Joining Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ctc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CTC (Cost to Company)</FormLabel>
                                            <FormControl><Input placeholder="e.g., 12 LPA" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {job.jobDetails.jobType === "Internship" && (
                                     <FormField
                                        control={form.control}
                                        name="stipend"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stipend (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g., 25000 / month" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>
                         <div className="flex justify-end">
                            <Button type="submit" size="lg" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4"/>}
                                Generate and Issue Offer
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </AppLayout>
    )
}
