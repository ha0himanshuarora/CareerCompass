
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Job, Student, Application } from "@/lib/types";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface ApplicantDetails extends Student {
    lastAppliedJobTitle: string;
    lastAppliedDate: any;
    applicationId: string;
}

export default function CandidatesPage() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<ApplicantDetails[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    const fetchAllApplicants = async () => {
        setLoading(true);
        try {
            // 1. Get all applications for the recruiter
            const appsQuery = query(collection(db, "applications"), where("recruiterId", "==", userProfile.uid));
            const appsSnapshot = await getDocs(appsQuery);
            const applications = appsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Application);
            
            if (applications.length === 0) {
                setApplicants([]);
                setLoading(false);
                return;
            }

            // 2. Get unique student IDs
            const studentIds = [...new Set(applications.map(app => app.studentId))];
            
            if (studentIds.length === 0) {
                setApplicants([]);
                setLoading(false);
                return;
            }

            // 3. Fetch student details
            const studentsQuery = query(collection(db, "users"), where("uid", "in", studentIds));
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentsData = studentsSnapshot.docs.map(doc => doc.data() as Student);
            
            const studentsMap = new Map<string, Student>();
            studentsData.forEach(s => studentsMap.set(s.uid, s));

            // 4. Combine data
            const applicantDetails = applications.reduce((acc, app) => {
                const existing = acc.get(app.studentId);
                if (!existing || app.appliedDate > existing.lastAppliedDate) {
                    const studentInfo = studentsMap.get(app.studentId);
                    if (studentInfo) {
                         acc.set(app.studentId, {
                            ...studentInfo,
                            lastAppliedJobTitle: app.jobTitle,
                            lastAppliedDate: app.appliedDate,
                            applicationId: app.id,
                        });
                    }
                }
                return acc;
            }, new Map<string, ApplicantDetails>());

            setApplicants(Array.from(applicantDetails.values()));

        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    }
    
    fetchAllApplicants();

  }, [userProfile]);


  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Candidates</h1>
          <p className="text-muted-foreground">Browse and manage applicants for all your job postings.</p>
        </div>
      </div>
      
        {loading ? (
            <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : applicants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Applied For</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((applicant) => (
                <TableRow key={applicant.uid}>
                  <TableCell className="font-medium">{applicant.name}</TableCell>
                  <TableCell>{applicant.email}</TableCell>
                  <TableCell>{applicant.lastAppliedJobTitle}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                       <Link href={`/candidates/${applicant.uid}?applicationId=${applicant.applicationId}`}>
                          View Profile <ArrowRight className="ml-2 h-4 w-4" />
                       </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No candidates have applied to your jobs yet.</p>
            </div>
        )}
    </AppLayout>
  );
}
