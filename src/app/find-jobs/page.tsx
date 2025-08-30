
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Job, Collaboration, Application } from "@/lib/types";
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Briefcase, Building, Wallet, Calendar, Check, ArrowRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function FindJobsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile || !userProfile.instituteName) return;

        const fetchCollaboratedJobs = async () => {
            setLoading(true);
            try {
                // Find accepted collaborations for the student's institute
                const collaborationsQuery = query(
                    collection(db, "collaborations"),
                    where("instituteName", "==", userProfile.instituteName),
                    where("status", "==", "accepted")
                );
                const collabSnapshot = await getDocs(collaborationsQuery);
                const collaboratedRecruiterIds = collabSnapshot.docs.map(doc => doc.data().recruiterId);

                if (collaboratedRecruiterIds.length === 0) {
                    setJobs([]);
                    setLoading(false);
                    return;
                }

                // Fetch jobs from collaborated recruiters
                const jobsQuery = query(
                    collection(db, "jobs"),
                    where("recruiterId", "in", collaboratedRecruiterIds),
                    where("status", "==", "open")
                );
                
                const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
                    const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
                    setJobs(jobsData);
                    setLoading(false);
                });

                // Fetch student's existing applications
                 const applicationsQuery = query(collection(db, "applications"), where("studentId", "==", userProfile.uid));
                 const unsubscribeApps = onSnapshot(applicationsQuery, (snapshot) => {
                     const appData = snapshot.docs.map(doc => doc.data() as Application);
                     setApplications(appData);
                 });


                return () => {
                    unsubscribeJobs();
                    unsubscribeApps();
                }

            } catch (error) {
                console.error("Error fetching jobs: ", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch available jobs." });
                setLoading(false);
            }
        };

        fetchCollaboratedJobs();

    }, [userProfile, toast]);

    const appliedJobIds = useMemo(() => {
        return new Set(applications.map(app => app.jobId));
    }, [applications]);

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find Jobs & Internships</h1>
                    <p className="text-muted-foreground">Browse opportunities from companies collaborating with your institute.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{job.jobTitle}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-1">
                                    <Building className="h-4 w-4" /> {job.companyName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{job.jobType}</span>
                               </div>
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>${job.salary.toLocaleString()} / year</span>
                               </div>
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Apply by {format(new Date(job.deadline), "PPP")}</span>
                               </div>
                                <div className="pt-2">
                                    <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                    </div>
                                </div>
                            </CardContent>
                            <CardContent>
                                <Button className="w-full" asChild>
                                    <Link href={`/find-jobs/${job.id}`}>
                                        {appliedJobIds.has(job.id) ? (
                                            <>View Application <ArrowRight className="ml-2 h-4 w-4"/></>
                                        ) : (
                                            <>Apply Now <ArrowRight className="ml-2 h-4 w-4"/></>
                                        )}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p className="text-muted-foreground">No job postings are available from collaborated companies at the moment.</p>
                </div>
            )}
        </AppLayout>
    );
}
