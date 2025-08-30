
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Job, Collaboration, Application, Recruiter } from "@/lib/types";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, Timestamp } from "firebase/firestore";
import { Loader2, Briefcase, Building, Wallet, Calendar, ArrowRight, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JobWithCompany extends Job {
    companyName: string;
}

interface Filters {
    jobType: string;
    domain: string;
    salary: string;
}

const JOB_TYPES = ["All Types", "Full-time", "Internship", "PPO", "Part-time", "Contract"];
const DOMAINS = ["All Domains", "IT", "Core", "Consulting", "Finance", "Marketing"];

export default function FindJobsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [allJobs, setAllJobs] = useState<JobWithCompany[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({
        jobType: "All Types",
        domain: "All Domains",
        salary: "",
    });
    const [sort, setSort] = useState("postedOn-desc");

    useEffect(() => {
        if (!userProfile || !userProfile.instituteName) return;

        setLoading(true);
        const fetchCollaboratedJobs = async () => {
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
                    setAllJobs([]);
                    setLoading(false);
                    return;
                }

                // Fetch jobs from collaborated recruiters
                const jobsQuery = query(
                    collection(db, "jobs"),
                    where("companyId", "in", collaboratedRecruiterIds),
                    where("metadata.status", "==", "Open")
                );
                
                const unsubscribeJobs = onSnapshot(jobsQuery, async (snapshot) => {
                    const jobsDataPromises = snapshot.docs.map(async (jobDoc) => {
                        const jobData = jobDoc.data();
                         // Manually convert Timestamps to Dates
                        const job = { 
                            id: jobDoc.id,
                             ...jobData,
                             jobDetails: {
                                ...jobData.jobDetails,
                                applicationDeadline: (jobData.jobDetails.applicationDeadline as Timestamp)?.toDate(),
                                startDate: (jobData.jobDetails.startDate as Timestamp)?.toDate(),
                                joiningDate: (jobData.jobDetails.joiningDate as Timestamp)?.toDate(),
                             },
                             metadata: {
                                ...jobData.metadata,
                                 postedOn: (jobData.metadata.postedOn as Timestamp)?.toDate(),
                             }
                        } as Job;

                        const recruiterDoc = await getDoc(doc(db, "users", job.companyId));
                        const recruiterData = recruiterDoc.data() as Recruiter | undefined;
                        return {
                            ...job,
                            companyName: recruiterData?.companyName ?? "Unknown Company"
                        };
                    });

                    const jobsData = await Promise.all(jobsDataPromises);
                    setAllJobs(jobsData);
                    setLoading(false);
                });

                // Fetch student's existing applications
                 const applicationsQuery = query(collection(db, "applications"), where("studentId", "==", userProfile.uid));
                 const unsubscribeApps = onSnapshot(applicationsQuery, (snapshot) => {
                     const appData = snapshot.docs.map(doc => doc.data() as Application);
                     setApplications(appData);
                 });

                return () => {
                    if (unsubscribeJobs) unsubscribeJobs();
                    if (unsubscribeApps) unsubscribeApps();
                }

            } catch (error) {
                console.error("Error fetching jobs: ", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch available jobs." });
                setLoading(false);
            }
        };

        const unsubPromise = fetchCollaboratedJobs();
        return () => {
            unsubPromise.then(unsub => {
                if (unsub) unsub();
            });
        };
    }, [userProfile, toast]);

    const appliedJobIds = useMemo(() => new Set(applications.map(app => app.jobId)), [applications]);
    
    const filteredAndSortedJobs = useMemo(() => {
        let jobs = [...allJobs];

        // Filtering
        jobs = jobs.filter(job => {
            const { jobType, domain, salary } = filters;
            if (jobType !== "All Types" && job.jobDetails.jobType !== jobType) return false;
            if (domain !== "All Domains" && job.jobDetails.domain !== domain) return false;
            if (salary && job.salaryAndBenefits.ctc && !job.salaryAndBenefits.ctc.toLowerCase().includes(salary.toLowerCase())) return false;
            return true;
        });

        // Sorting
        jobs.sort((a, b) => {
            const [key, order] = sort.split('-');
            let valA, valB;
            if (key === 'postedOn') {
                valA = a.metadata.postedOn?.getTime() || 0;
                valB = b.metadata.postedOn?.getTime() || 0;
            } else if (key === 'deadline') {
                valA = a.jobDetails.applicationDeadline?.getTime() || 0;
                valB = b.jobDetails.applicationDeadline?.getTime() || 0;
            } else { // salary
                 valA = parseInt(a.salaryAndBenefits.ctc?.replace(/[^0-9]/g, '')) || 0;
                 valB = parseInt(b.salaryAndBenefits.ctc?.replace(/[^0-9]/g, '')) || 0;
            }

            if (order === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
        
        return jobs;
    }, [allJobs, filters, sort]);

    const handleFilterChange = (filterName: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
        setFilters({ jobType: "All Types", domain: "All Domains", salary: "" });
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find Jobs & Internships</h1>
                    <p className="text-muted-foreground">Browse opportunities from companies collaborating with your institute.</p>
                </div>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5" />
                        Filter & Sort
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="grid gap-1.5"><Label htmlFor="job-type">Job Type</Label>
                        <Select value={filters.jobType} onValueChange={(v) => handleFilterChange("jobType", v)}>
                            <SelectTrigger id="job-type"><SelectValue /></SelectTrigger>
                            <SelectContent>{JOB_TYPES.map(jt => <SelectItem key={jt} value={jt}>{jt}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-1.5"><Label htmlFor="domain">Domain</Label>
                        <Select value={filters.domain} onValueChange={(v) => handleFilterChange("domain", v)}>
                            <SelectTrigger id="domain"><SelectValue /></SelectTrigger>
                            <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-1.5"><Label htmlFor="salary">Salary contains...</Label>
                        <Input id="salary" placeholder="e.g., 12 LPA or 25k" value={filters.salary} onChange={(e) => handleFilterChange("salary", e.target.value)} />
                    </div>
                     <div className="grid gap-1.5"><Label htmlFor="sort">Sort By</Label>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger id="sort"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="postedOn-desc">Date Posted (Newest)</SelectItem>
                                <SelectItem value="deadline-asc">Deadline (Soonest)</SelectItem>
                                <SelectItem value="salary-desc">Salary (High to Low)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="ghost" onClick={clearFilters} className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : filteredAndSortedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedJobs.map(job => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{job.jobDetails.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-1">
                                    <Building className="h-4 w-4" /> {job.companyName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{job.jobDetails.jobType}</span>
                               </div>
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>{job.jobDetails.jobType === "Internship" ? job.salaryAndBenefits.stipend : job.salaryAndBenefits.ctc}</span>
                               </div>
                               <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Apply by {job.jobDetails.applicationDeadline ? format(job.jobDetails.applicationDeadline, "PPP") : 'N/A'}</span>
                               </div>
                                <div className="pt-2">
                                    <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {job.eligibilityCriteria.skillRequirements.slice(0, 4).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                        {job.eligibilityCriteria.skillRequirements.length > 4 && <Badge variant="secondary">...</Badge>}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href={`/find-jobs/${job.id}`}>
                                        {appliedJobIds.has(job.id) ? (
                                            <>View Application <ArrowRight className="ml-2 h-4 w-4"/></>
                                        ) : (
                                            <>View Details <ArrowRight className="ml-2 h-4 w-4"/></>
                                        )}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p className="text-muted-foreground">No job postings match your current filters. Try clearing them to see more opportunities.</p>
                </div>
            )}
        </AppLayout>
    );
}
