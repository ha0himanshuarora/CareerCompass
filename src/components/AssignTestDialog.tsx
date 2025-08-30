
"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Test, Job, Application } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

interface AssignTestDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  test: Test;
  jobs: Job[];
}

export function AssignTestDialog({ isOpen, onOpenChange, test, jobs }: AssignTestDialogProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [selectedJobId, setSelectedJobId] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const handleAssign = async () => {
        if (!selectedJobId || !userProfile) {
            toast({ variant: "destructive", title: "Error", description: "Please select a job posting." });
            return;
        }

        setIsAssigning(true);
        try {
            // 1. Find all 'applied' applications for the selected job
            const applicationsQuery = query(
                collection(db, "applications"),
                where("jobId", "==", selectedJobId),
                where("status", "==", "applied")
            );
            const appSnapshot = await getDocs(applicationsQuery);
            const applications = appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            
            if (applications.length === 0) {
                toast({ title: "No Applicants", description: "There are no applicants in the 'Applied' stage for this job." });
                setIsAssigning(false);
                return;
            }

            // 2. Get existing test assignments for these students for this test
            const studentIds = applications.map(app => app.studentId);
            const assignmentsQuery = query(
                collection(db, "studentTests"),
                where("testId", "==", test.id),
                where("studentId", "in", studentIds)
            );
            const assignmentSnapshot = await getDocs(assignmentsQuery);
            const assignedStudentIds = new Set(assignmentSnapshot.docs.map(doc => doc.data().studentId));
            
            // 3. Filter out students who already have this test assigned
            const studentsToAssign = applications.filter(app => !assignedStudentIds.has(app.studentId));

            if (studentsToAssign.length === 0) {
                toast({ title: "Already Assigned", description: "This test has already been assigned to all applicants for this job." });
                setIsAssigning(false);
                return;
            }
            
            // 4. Create new assignments for the remaining students
            const assignmentPromises = studentsToAssign.map(app => {
                return addDoc(collection(db, "studentTests"), {
                    studentId: app.studentId,
                    testId: test.id,
                    jobId: selectedJobId,
                    assignedBy: userProfile.uid,
                    status: 'pending',
                    assignedAt: serverTimestamp(),
                });
            });

            await Promise.all(assignmentPromises);

            toast({ title: "Success!", description: `Test '${test.title}' assigned to ${studentsToAssign.length} new applicant(s).` });
            onOpenChange(false);
            setSelectedJobId("");

        } catch (error) {
            console.error("Error assigning test in bulk:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to assign the test." });
        } finally {
            setIsAssigning(false);
        }
    };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Test: {test.title}</DialogTitle>
          <DialogDescription>
            Select a job posting to assign this test to all of its current applicants in the 'Applied' stage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid items-center gap-1.5">
            <Label htmlFor="job-select">Job Posting</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger id="job-select">
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.filter(job => job.metadata.status === 'Open').map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.jobDetails.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isAssigning || !selectedJobId}>
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
