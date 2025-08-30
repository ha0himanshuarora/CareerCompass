
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
import { Job, Application, Student } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { KANBAN_COLUMNS } from "@/lib/constants";


interface ViewApplicantsDialogProps {
  job: Job | null;
  onOpenChange: (open: boolean) => void;
}

interface Applicant extends Student {
    applicationId: string;
    status: Application['status'];
}

export function ViewApplicantsDialog({ job, onOpenChange }: ViewApplicantsDialogProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!job) return;

        setLoading(true);
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", job.id));

        const unsubscribe = onSnapshot(applicationsQuery, async (appSnapshot) => {
            if (appSnapshot.empty) {
                setApplicants([]);
                setLoading(false);
                return;
            }

            const applicantDataPromises = appSnapshot.docs.map(async (appDoc) => {
                const application = { id: appDoc.id, ...appDoc.data() } as Application;
                const userDoc = await getDoc(doc(db, "users", application.studentId));
                if (userDoc.exists()) {
                    const student = userDoc.data() as Student;
                    return {
                        ...student,
                        applicationId: application.id,
                        status: application.status
                    };
                }
                return null;
            });
            
            const resolvedApplicants = (await Promise.all(applicantDataPromises)).filter(Boolean) as Applicant[];
            setApplicants(resolvedApplicants);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [job]);
    
    const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
        try {
            const appRef = doc(db, "applications", applicationId);
            await updateDoc(appRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: "The application status has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update application status.",
            });
        }
    };


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
                        <TableRow key={applicant.uid}>
                        <TableCell className="font-medium">{applicant.name}</TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell className="text-center">
                            <Select 
                                value={applicant.status}
                                onValueChange={(newStatus) => handleStatusChange(applicant.applicationId, newStatus as Application['status'])}
                            >
                                <SelectTrigger className="w-32 mx-auto">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {KANBAN_COLUMNS.map(col => (
                                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/candidates/${applicant.uid}`}>View Profile</Link>
                            </Button>
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
