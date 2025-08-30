
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { Job } from "@/lib/types";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export default function TPOJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const jobsQuery = query(collection(db, "jobs"));
        
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Job Posting Management</h1>
                    <p className="text-muted-foreground">Review, approve, or reject job postings from companies.</p>
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-center">Applicants</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.length > 0 ? jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.jobTitle}</TableCell>
                                <TableCell>{job.companyName}</TableCell>
                                <TableCell className="text-center">{job.applicants?.length ?? 0}</TableCell>
                                <TableCell className="text-center">
                                     <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                                        {job.status === 'open' ? 'Open' : 'Closed'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No jobs have been posted yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </AppLayout>
    );
}
