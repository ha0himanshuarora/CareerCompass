
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Job, Application } from "@/lib/types";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Loader2, Briefcase, Building, Wallet, Calendar, Check, ArrowLeft } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";

export default function JobDetailsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const jobId = params.jobId as string;
    
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (!userProfile) return;
        
        const fetchJobDetails = async () => {
            if (!jobId) return;
            setLoading(true);
            try {
                const jobRef = doc(db, "jobs", jobId);
                const jobSnap = await getDoc(jobRef);
                if (jobSnap.exists()) {
                    setJob({ id: jobSnap.id, ...jobSnap.data() } as Job);
                } else {
                     toast({ variant: "destructive", title: "Error", description: "Job not found." });
                     router.push("/find-jobs");
                }
            } catch (error) {
                console.error("Error fetching job details: ", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch job details." });
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();

        // Fetch student's existing applications
        const applicationsQuery = query(collection(db, "applications"), where("studentId", "==", userProfile.uid));
        const unsubscribeApps = onSnapshot(applicationsQuery, (snapshot) => {
            const appData = snapshot.docs.map(doc => doc.data() as Application);
            setApplications(appData);
        });

        return () => unsubscribeApps();

    }, [userProfile, jobId, router, toast]);

    const hasApplied = useMemo(() => {
        return applications.some(app => app.jobId === jobId);
    }, [applications, jobId]);

    const handleApply = async () => {
        if (!userProfile || !job) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to apply." });
            return;
        }
        setApplying(true);
        try {
            // Add to applications collection
            await addDoc(collection(db, "applications"), {
                jobId: job.id,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                studentId: userProfile.uid,
                recruiterId: job.recruiterId,
                status: 'applied',
                appliedDate: serverTimestamp(),
            });
            
            // Add student's UID to the job's applicants array
            const jobRef = doc(db, "jobs", job.id);
            await updateDoc(jobRef, {
                applicants: arrayUnion(userProfile.uid)
            });

            toast({ title: "Success!", description: `You have successfully applied for ${job.jobTitle}.` });
        } catch (error) {
            console.error("Error applying for job: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not submit your application." });
        } finally {
            setApplying(false);
        }
    };


    if (loading) {
         return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }
    
    if (!job) {
        return (
            <AppLayout>
                 <div className="text-center">
                    <p>Job not found.</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Jobs
                </Button>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-3xl font-headline">{job.jobTitle}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2 text-lg">
                                    <Building className="h-5 w-5" /> {job.companyName}
                                </CardDescription>
                            </div>
                            <Badge variant={job.jobType === "Job" ? "default" : "secondary"} className="text-base">{job.jobType}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                           <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                <Wallet className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-muted-foreground">Salary / Stipend</p>
                                    <p className="font-semibold text-lg">${job.salary.toLocaleString()} / year</p>
                                </div>
                           </div>
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                <Calendar className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-muted-foreground">Apply By</p>
                                    <p className="font-semibold text-lg">{format(new Date(job.deadline), "PPP")}</p>
                                </div>
                           </div>
                       </div>
                       
                       <div>
                           <h3 className="text-xl font-semibold font-headline mb-3">Job Description</h3>
                           <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                       </div>
                       
                        <div>
                           <h3 className="text-xl font-semibold font-headline mb-3">Eligibility Criteria</h3>
                           <p className="text-muted-foreground whitespace-pre-wrap">{job.eligibility}</p>
                       </div>

                        <div>
                           <h3 className="text-xl font-semibold font-headline mb-3">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map(skill => <Badge key={skill} variant="outline" className="text-md">{skill}</Badge>)}
                            </div>
                       </div>
                       
                       <div className="pt-6 text-center">
                            <Button 
                                size="lg"
                                className="w-full max-w-xs" 
                                onClick={handleApply}
                                disabled={applying || hasApplied}
                            >
                                {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {hasApplied ? <><Check className="mr-2 h-4 w-4"/>Applied</> : 'Confirm Application'}
                            </Button>
                       </div>

                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
