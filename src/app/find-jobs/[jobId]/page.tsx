
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Job, Application, Resume, Recruiter, Student } from "@/lib/types";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Loader2, Briefcase, Building, Wallet, Calendar, Check, ArrowLeft, FileText, MapPin, Dot, Info } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sendNotificationToUser } from "@/app/api/send-notification/route";

export default function JobDetailsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const jobId = params.jobId as string;
    
    const [job, setJob] = useState<Job | null>(null);
    const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResume, setSelectedResume] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    
    const student = userProfile as Student;

    useEffect(() => {
        if (!userProfile) return;
        
        setLoading(true);
        const fetchJobDetails = async () => {
            if (!jobId) return;
            try {
                const jobRef = doc(db, "jobs", jobId);
                const jobSnap = await getDoc(jobRef);
                if (jobSnap.exists()) {
                    const jobData = jobSnap.data();
                    const jobWithDate = { 
                        id: jobSnap.id, 
                        ...jobData,
                        jobDetails: {
                            ...jobData.jobDetails,
                            applicationDeadline: (jobData.jobDetails.applicationDeadline as Timestamp)?.toDate(),
                        }
                    } as Job;

                    setJob(jobWithDate);
                    // Fetch recruiter details
                    const recruiterRef = doc(db, "users", jobWithDate.companyId);
                    const recruiterSnap = await getDoc(recruiterRef);
                    if (recruiterSnap.exists()) {
                        setRecruiter(recruiterSnap.data() as Recruiter);
                    }
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
        
        // Fetch student's resumes
        const resumesQuery = query(collection(db, "resumes"), where("studentId", "==", userProfile.uid));
        const unsubscribeResumes = onSnapshot(resumesQuery, (snapshot) => {
            const resumeData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Resume);
            setResumes(resumeData);
        });


        return () => {
            unsubscribeApps();
            unsubscribeResumes();
        }

    }, [userProfile, jobId, router, toast]);

    const hasApplied = useMemo(() => {
        return applications.some(app => app.jobId === jobId);
    }, [applications, jobId]);
    
    const isInternship = useMemo(() => job?.jobDetails.jobType === "Internship", [job]);

    const handleApply = async () => {
        if (!userProfile || !job || !recruiter) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to apply." });
            return;
        }
        if (!selectedResume) {
            toast({ variant: "destructive", title: "Error", description: "Please select a resume to apply with." });
            return;
        }
        setApplying(true);
        try {
            // Add to applications collection
            await addDoc(collection(db, "applications"), {
                jobId: job.id,
                jobTitle: job.jobDetails.title,
                companyName: recruiter.companyName,
                studentId: userProfile.uid,
                recruiterId: job.companyId,
                resumeId: selectedResume,
                status: 'applied',
                appliedDate: serverTimestamp(),
            });
            
            // Add student's UID to the job's applicants array
            const jobRef = doc(db, "jobs", job.id);
            await updateDoc(jobRef, {
                'metadata.applicantCount': job.metadata.applicantCount + 1
            });

            toast({ title: "Success!", description: `You have successfully applied for ${job.jobDetails.title}.` });
            
            // Send notification to recruiter
            await sendNotificationToUser(job.companyId, {
                title: "New Applicant!",
                body: `${userProfile.name} has applied for the ${job.jobDetails.title} position.`
            });

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
    
    if (!job || !recruiter) {
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
                                <CardTitle className="text-3xl font-headline">{job.jobDetails.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-2 text-lg">
                                    <Building className="h-5 w-5" /> {recruiter.companyName}
                                </CardDescription>
                            </div>
                            <Badge variant={job.jobDetails.jobType === "Full-time" ? "default" : "secondary"} className="text-base">{job.jobDetails.jobType}</Badge>
                        </div>
                         <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-4">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {job.jobDetails.location.type} {job.jobDetails.location.type !== "Remote" && `(${job.jobDetails.location.address})`}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" />
                                {job.jobDetails.domain}
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Apply by {job.jobDetails.applicationDeadline ? format(job.jobDetails.applicationDeadline, "PPP") : 'N/A'}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       
                       <div>
                           <h3 className="text-xl font-semibold font-headline mb-3">Job Description</h3>
                           <p className="text-muted-foreground whitespace-pre-wrap">{job.jobDetails.description}</p>
                       </div>
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                               <h3 className="text-xl font-semibold font-headline mb-3">Salary & Benefits</h3>
                               <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        <span className="font-semibold">{isInternship ? 'Stipend:' : 'CTC:'}</span>
                                        <span>{isInternship ? job.salaryAndBenefits.stipend : job.salaryAndBenefits.ctc}</span>
                                    </div>
                                    {isInternship && job.salaryAndBenefits.ppo && (
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>PPO Available (CTC: {job.salaryAndBenefits.ppoCtc})</span>
                                        </div>
                                    )}
                                    {job.salaryAndBenefits.perks && job.salaryAndBenefits.perks.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mt-3">Perks:</h4>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {job.salaryAndBenefits.perks.map(perk => <Badge key={perk} variant="secondary">{perk}</Badge>)}
                                            </div>
                                        </div>
                                    )}
                               </div>
                           </div>

                           <div>
                               <h3 className="text-xl font-semibold font-headline mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.eligibilityCriteria.skillRequirements.map(skill => <Badge key={skill} variant="outline" className="text-md">{skill}</Badge>)}
                                </div>
                           </div>
                        </div>


                        <div>
                           <h3 className="text-xl font-semibold font-headline mb-3">Eligibility Criteria</h3>
                           <ul className="list-disc pl-5 text-muted-foreground space-y-2 text-sm">
                                {Object.entries(job.eligibilityCriteria).map(([key, value]) => {
                                    if (!value || Array.isArray(value) && value.length === 0) return null;
                                    
                                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    let displayValue;
                                    
                                    if (typeof value === 'boolean') {
                                        displayValue = value ? 'Yes' : 'No';
                                    } else if (Array.isArray(value)) {
                                        displayValue = value.join(', ');
                                    } else {
                                        displayValue = String(value);
                                    }

                                    // Skip uninteresting fields
                                    if (key === 'skillRequirements') return null;

                                    return (
                                        <li key={key}>
                                            <span className="font-semibold text-foreground">{label}:</span> {displayValue}
                                        </li>
                                    );
                                })}
                           </ul>
                       </div>
                       
                        <div className="pt-6 border-t">
                             {student?.isPlaced ? (
                                <Alert variant="default" className="max-w-xs mx-auto">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>You Are Placed!</AlertTitle>
                                    <AlertDescription>
                                        Congratulations! Since you have already accepted an offer, you cannot apply for new jobs.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="max-w-xs mx-auto space-y-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="resume-select" className="flex items-center gap-2 font-semibold">
                                            <FileText className="h-4 w-4" />
                                            Select Resume to Apply
                                        </Label>
                                        <Select onValueChange={setSelectedResume} value={selectedResume} disabled={hasApplied}>
                                            <SelectTrigger id="resume-select" className="w-full">
                                                <SelectValue placeholder="Choose a resume..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resumes.length > 0 ? (
                                                    resumes.map(resume => (
                                                        <SelectItem key={resume.id} value={resume.id}>{resume.title}</SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-resume" disabled>No resumes found. Create one first.</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full"
                                        onClick={handleApply}
                                        disabled={applying || hasApplied || resumes.length === 0}
                                    >
                                        {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {hasApplied ? <><Check className="mr-2 h-4 w-4"/>Applied</> : 'Confirm Application'}
                                    </Button>
                                </div>
                            )}
                       </div>

                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
