
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, MessageSquare, Target, Plus, MoreHorizontal, Loader2, Eye, Edit, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getCountFromServer, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Job, Interview, Application } from "@/lib/types";
import { ViewApplicantsDialog } from "../ViewApplicantsDialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { CreateJobForm } from "../CreateJobForm";


interface SummaryCard {
  title: string;
  value: number;
  icon: React.ElementType;
  change: string;
}


export function RecruiterDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToView, setJobToView] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);


  useEffect(() => {
    if (!userProfile) return;

    const recruiterId = userProfile.uid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobsQuery = query(collection(db, "jobs"), where("recruiterId", "==", recruiterId));
    const applicationsQuery = query(collection(db, "applications"), where("recruiterId", "==", recruiterId));
    const interviewsQuery = query(collection(db, "interviews"), 
      where("recruiterId", "==", recruiterId),
      where("interviewDate", ">=", Timestamp.fromDate(today)),
      where("interviewDate", "<", Timestamp.fromDate(tomorrow))
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        const job: Job = { 
            id: docSnapshot.id,
            ...data
        } as Job;
        
        const deadlineDate = new Date(job.deadline);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (job.status === 'open' && deadlineDate < today) {
          updateDoc(docSnapshot.ref, { status: 'closed' });
          job.status = 'closed';
        }

        return job;
      });
      
      setRecentJobs(jobsData.slice(0, 4));
      
      const activeJobs = jobsData.filter(j => j.status === 'open').length;
      updateSummaryCard("Active Jobs", activeJobs);

      setLoading(false);
    });

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
      const allApplications = snapshot.docs.map(doc => doc.data() as Application);
      const offersMade = allApplications.filter(app => app.status === 'offer').length;

      updateSummaryCard("Total Applicants", allApplications.length);
      updateSummaryCard("Offers Made", offersMade);
    });

    const unsubscribeInterviews = onSnapshot(interviewsQuery, (snapshot) => {
       const interviewsData: Interview[] = snapshot.docs.map(doc => {
         const data = doc.data();
         return {
          id: doc.id,
          candidateName: data.candidateName,
          jobTitle: data.jobTitle,
          interviewDate: data.interviewDate,
          type: data.type,
         }
       });
       setUpcomingInterviews(interviewsData);
       updateSummaryCard("Interviews Scheduled", snapshot.size, snapshot.size > 0 ? `${snapshot.size} today` : "None today");
    });
    
    setSummaryCards([
        { title: "Active Jobs", value: 0, icon: Briefcase, change: "" },
        { title: "Total Applicants", value: 0, icon: Users, change: "" },
        { title: "Interviews Scheduled", value: 0, icon: MessageSquare, change: "None today" },
        { title: "Offers Made", value: 0, icon: Target, change: "" },
    ]);


    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
      unsubscribeInterviews();
    };
  }, [userProfile]);

  const updateSummaryCard = (title: string, value: number, change: string = "") => {
    setSummaryCards(prevCards => 
      prevCards.map(card => 
        card.title === title ? { ...card, value, change } : card
      )
    );
  };

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

  if (loading) {
     return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
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
    <Sheet open={isSheetOpen} onOpenChange={handleCloseSheet}>
      <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.name ?? 'Recruiter'}!</h1>
                  <p className="text-muted-foreground">Here's a summary of your recruitment activities.</p>
              </div>
              <Button asChild>
                  <Link href="/jobs"><Plus className="mr-2 h-4 w-4" /> Post a New Job</Link>
              </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card, index) => (
                  <Card key={index} className="shadow-lg rounded-xl">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                          <card.icon className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{card.value}</div>
                          <p className="text-xs text-muted-foreground">{card.change}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-lg rounded-xl">
                  <CardHeader>
                      <CardTitle>Recent Job Postings</CardTitle>
                      <CardDescription>An overview of your current and past job listings.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Job Title</TableHead>
                                  <TableHead className="text-center">Applicants</TableHead>
                                  <TableHead className="text-center">Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {recentJobs.length > 0 ? recentJobs.map((job) => (
                                  <TableRow key={job.id}>
                                      <TableCell className="font-medium">{job.jobTitle}</TableCell>
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
                              )) : (
                                  <TableRow><TableCell colSpan={4} className="text-center">No recent jobs found.</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
              <Card className="shadow-lg rounded-xl">
                  <CardHeader>
                      <CardTitle>Today's Interviews</CardTitle>
                      <CardDescription>Candidates scheduled for interviews today.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          {upcomingInterviews.length > 0 ? upcomingInterviews.map((interview) => (
                              <div key={interview.id} className="flex items-center justify-between">
                                  <div>
                                      <p className="font-semibold">{interview.candidateName}</p>
                                      <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-medium">{(interview.interviewDate as unknown as Timestamp).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      <Badge variant="outline" className="mt-1">{interview.type}</Badge>
                                  </div>
                              </div>
                          )) : (
                              <p className="text-sm text-center text-muted-foreground">No interviews scheduled for today.</p>
                          )}
                      </div>
                  </CardContent>
              </Card>
          </div>
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

        {isSheetOpen && sheetContent}
      </div>
    </Sheet>
  );
}

    