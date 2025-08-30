
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
import { Job, Application, Student, Test } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2, ChevronsUpDown } from "lucide-react";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { useAuth } from "@/hooks/use-auth";


interface ViewApplicantsDialogProps {
  job: Job | null;
  onOpenChange: (open: boolean) => void;
}

interface Applicant extends Student {
    applicationId: string;
    status: Application['status'];
}

export function ViewApplicantsDialog({ job, onOpenChange }: ViewApplicantsDialogProps) {
    const { userProfile } = useAuth();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [recruiterTests, setRecruiterTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!job || !userProfile) return;

        setLoading(true);
        // Fetch applicants
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", job.id));
        const unsubscribeApps = onSnapshot(applicationsQuery, async (appSnapshot) => {
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
        
        // Fetch recruiter's tests
        const testsQuery = query(collection(db, "tests"), where("createdBy", "==", userProfile.uid), where("type", "==", "company"));
        const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
            const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
            setRecruiterTests(testsData);
        });
        
        return () => {
            unsubscribeApps();
            unsubscribeTests();
        };
    }, [job, userProfile]);
    
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
    
    const handleAssignTest = async (studentId: string, testId: string) => {
        if (!userProfile || !job) return;
        try {
            // Check if test is already assigned
             const q = query(
                collection(db, "studentTests"), 
                where("studentId", "==", studentId), 
                where("testId", "==", testId)
            );
            const existingAssignments = await getDocs(q);

            if (!existingAssignments.empty) {
                 toast({ variant: "default", title: "Already Assigned", description: "This student has already been assigned this test." });
                 return;
            }

            await addDoc(collection(db, "studentTests"), {
                studentId,
                testId,
                jobId: job.id, // Link the test assignment to the job
                assignedBy: userProfile.uid,
                status: 'pending',
                assignedAt: serverTimestamp(),
            });
            toast({ title: "Test Assigned", description: "The test has been assigned to the student." });
        } catch (error) {
             console.error("Error assigning test:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to assign the test." });
        }
    }


  if (!job) return null;

  return (
    <Dialog open={!!job} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Applicants for {job.jobDetails.title}</DialogTitle>
          <DialogDescription>
            Review, manage status, and assign tests to candidates.
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
                        <TableHead>Status</TableHead>
                        <TableHead>Assign Test</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {applicants.map((applicant) => (
                        <TableRow key={applicant.uid}>
                            <TableCell className="font-medium">{applicant.name}</TableCell>
                            <TableCell>{applicant.email}</TableCell>
                            <TableCell>
                                <Select 
                                    value={applicant.status}
                                    onValueChange={(newStatus) => handleStatusChange(applicant.applicationId, newStatus as Application['status'])}
                                >
                                    <SelectTrigger className="w-36">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {KANBAN_COLUMNS.map(col => (
                                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-36 justify-between">
                                            Select Test <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-0">
                                        <Command>
                                            <CommandList>
                                                <CommandEmpty>No tests found.</CommandEmpty>
                                                <CommandGroup>
                                                    {recruiterTests.map((test) => (
                                                        <CommandItem
                                                            key={test.id}
                                                            onSelect={() => handleAssignTest(applicant.uid, test.id)}
                                                        >
                                                            {test.title}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/candidates/${applicant.uid}?applicationId=${applicant.applicationId}`}>View Profile</Link>
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
