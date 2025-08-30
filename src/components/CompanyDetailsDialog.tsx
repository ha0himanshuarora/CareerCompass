
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Job, Recruiter } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface CompanyDetailsDialogProps {
  recruiter: Recruiter | null;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsDialog({ recruiter, onOpenChange }: CompanyDetailsDialogProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!recruiter) return;

        setLoading(true);
        const jobsQuery = query(collection(db, "jobs"), where("recruiterId", "==", recruiter.uid));

        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => doc.data() as Job);
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [recruiter]);


  if (!recruiter) return null;

  return (
    <Dialog open={!!recruiter} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Company Details: {recruiter.companyName}</DialogTitle>
          <DialogDescription>
            Review job postings from this company.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : jobs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {jobs.map(job => (
                        <AccordionItem key={job.id} value={job.id}>
                            <AccordionTrigger>{job.jobTitle}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 text-sm text-muted-foreground">
                                    <p>{job.description}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <p><strong className="text-foreground">Type:</strong> {job.jobType}</p>
                                        <p><strong className="text-foreground">Salary/Stipend:</strong> ${job.salary.toLocaleString()}</p>
                                        <p><strong className="text-foreground">Deadline:</strong> {format(new Date(job.deadline), 'PPP')}</p>
                                        <p><strong className="text-foreground">Status:</strong> {job.status}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-2">Eligibility</h4>
                                        <p>{job.eligibility}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.map(skill => <span key={skill} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">{skill}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                 <div className="text-center p-12">
                    <p className="text-muted-foreground">This company has not posted any jobs yet.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
