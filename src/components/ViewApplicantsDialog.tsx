
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Job } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


interface ViewApplicantsDialogProps {
  job: Job | null;
  onOpenChange: (open: boolean) => void;
}

interface Applicant {
    id: string;
    name: string;
    email: string;
    // Add other fields from user profile as needed
}

export function ViewApplicantsDialog({ job, onOpenChange }: ViewApplicantsDialogProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!job || !job.applicants || job.applicants.length === 0) {
                setApplicants([]);
                return;
            }
            setLoading(true);
            try {
                const applicantPromises = job.applicants.map(uid => getDoc(doc(db, "users", uid)));
                const applicantDocs = await Promise.all(applicantPromises);
                const applicantData = applicantDocs
                    .filter(doc => doc.exists())
                    .map(doc => ({ id: doc.id, ...doc.data() } as Applicant));
                setApplicants(applicantData);
            } catch (error) {
                console.error("Error fetching applicants:", error);
                // Optionally, show a toast message here
            } finally {
                setLoading(false);
            }
        };

        if (job) {
            fetchApplicants();
        }
    }, [job]);


  if (!job) return null;

  return (
    <Dialog open={!!job} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Applicants for {job.jobTitle}</DialogTitle>
          <DialogDescription>
            Review and manage candidates who have applied for this position.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : applicants.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {applicants.map((applicant) => (
                        <TableRow key={applicant.id}>
                        <TableCell className="font-medium">{applicant.name}</TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="secondary">Applied</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View Profile</Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            ) : (
                 <div className="text-center p-12">
                    <p className="text-muted-foreground">No applicants have applied for this job yet.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

