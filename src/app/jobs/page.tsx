
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CreateJobForm } from "@/components/CreateJobForm";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2, Loader2, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/lib/types";
import { ViewApplicantsDialog } from "@/components/ViewApplicantsDialog";


export default function JobsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToView, setJobToView] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const jobsQuery = query(collection(db, "jobs"), where("recruiterId", "==", userProfile.uid));

    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const job = {
            id: doc.id,
            ...data
        } as Job
        const deadlineDate = new Date(job.deadline);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (job.status === 'open' && deadlineDate < today) {
          updateDoc(doc.ref, { status: 'closed' });
          job.status = 'closed';
        }
        return job;
      });
      setJobs(jobsData as Job[]);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching jobs: ", error);
        setLoading(false);
        toast({variant: "destructive", title: "Error", description: "Could not fetch jobs."})
    });

    return () => unsubscribe();
  }, [userProfile, toast]);

  const handleOpenSheet = (job: Job | null) => {
    setJobToEdit(job);
    setSheetOpen(true);
  }

  const handleCloseSheet = () => {
    setJobToEdit(null);
    setSheetOpen(false);
  }

  const handleUpdateStatus = async (jobId: string, status: 'open' | 'closed') => {
    try {
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { status });
      toast({title: "Success", description: `Job has been ${status}.`});
    } catch (error) {
       toast({variant: "destructive", title: "Error", description: "Could not update job status."})
    }
  }
  
  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "jobs", jobToDelete));
      toast({title: "Success", description: "Job posting deleted successfully."});
      setJobToDelete(null);
    } catch (error) {
       toast({variant: "destructive", title: "Error", description: "Could not delete job posting."})
    } finally {
      setIsDeleting(false);
    }
  }

  const sheetContent = (
    <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
        <SheetTitle>{jobToEdit ? "Edit Job Posting" : "Create a New Job Posting"}</SheetTitle>
        <SheetDescription>
            {jobToEdit ? "Update the details for this job opening." : "Fill out the details below to post a new job or internship opening."}
        </SheetDescription>
        </SheetHeader>
        <CreateJobForm onFormSubmit={handleCloseSheet} initialData={jobToEdit} />
    </SheetContent>
  );

  return (
    <AppLayout>
      <Sheet open={isSheetOpen} onOpenChange={handleCloseSheet}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Job Postings</h1>
            <p className="text-muted-foreground">Manage your company's job and internship openings.</p>
          </div>
          <Button onClick={() => handleOpenSheet(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job Posting
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : jobs.length > 0 ? (
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Applicants</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {jobs.map((job) => (
                    <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.jobTitle}</TableCell>
                        <TableCell>{job.jobType}</TableCell>
                        <TableCell className="text-center">{job.applicants?.length ?? 0}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                              {job.status === 'open' ? 'Open' : 'Closed'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setJobToView(job)}>
                                        <Eye className="mr-2 h-4 w-4" /> View Applicants
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenSheet(job)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    {job.status === 'open' && (
                                       <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, 'closed')}>
                                        <XCircle className="mr-2 h-4 w-4" /> Close Job
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setJobToDelete(job.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
           <Sheet>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
              <SheetTrigger asChild>
                <Button variant="link" className="mt-2" onClick={() => handleOpenSheet(null)}>Create your first job posting</Button>
              </SheetTrigger>
            </div>
           </Sheet>
        )}
        {isSheetOpen && sheetContent}
      </Sheet>
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting and any associated application data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewApplicantsDialog job={jobToView} onOpenChange={(open) => !open && setJobToView(null)} />
    </AppLayout>
  );
}
