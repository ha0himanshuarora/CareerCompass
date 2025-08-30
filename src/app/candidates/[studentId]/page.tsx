
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { Student, Resume, Application } from "@/lib/types";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft, Briefcase, Calendar, GraduationCap, Loader2, Mail, School, FileText, MapPin, Phone, Linkedin, Github, Award, Wand2, User as UserIcon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { SkillAnalytics } from "@/components/SkillAnalytics";
import { ResumePreview } from "@/components/ResumePreview";

export default function CandidateProfilePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const studentId = params.studentId as string;
    const applicationId = searchParams.get('applicationId');

    const [student, setStudent] = useState<Student | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingResumes, setLoadingResumes] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        const fetchStudent = async () => {
            setLoading(true);
            try {
                const studentDoc = await getDoc(doc(db, "users", studentId));
                if (studentDoc.exists()) {
                    setStudent(studentDoc.data() as Student);
                } else {
                    console.error("No such student!");
                }
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStudent();

    }, [studentId]);

    useEffect(() => {
        if (!studentId) return;
        
        setLoadingResumes(true);

        const fetchResumes = async () => {
            let unsubscribeResumes;
            try {
                if (applicationId) {
                    // Fetch the specific resume used for the application
                    const appDoc = await getDoc(doc(db, "applications", applicationId));
                    if (appDoc.exists()) {
                        const appData = appDoc.data() as Application;
                        if (appData.resumeId) {
                            const resumeDoc = await getDoc(doc(db, "resumes", appData.resumeId));
                            if(resumeDoc.exists()) {
                                setResumes([{ id: resumeDoc.id, ...resumeDoc.data() } as Resume]);
                            }
                        } else {
                             setResumes([]);
                        }
                    }
                } else {
                    // Fetch all resumes for the student
                    const resumesQuery = query(collection(db, "resumes"), where("studentId", "==", studentId));
                    unsubscribeResumes = onSnapshot(resumesQuery, (snapshot) => {
                        const resumeData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Resume);
                        setResumes(resumeData);
                    });
                }
            } catch (error) {
                console.error("Error fetching resumes:", error);
            } finally {
                setLoadingResumes(false);
            }
            return unsubscribeResumes;
        }

        const unsubscribePromise = fetchResumes();

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) {
                    unsubscribe();
                }
            });
        }
    }, [studentId, applicationId]);


    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }
    
    if (!student) {
         return (
            <AppLayout>
                <div className="text-center">
                    <p>Candidate not found.</p>
                </div>
            </AppLayout>
        )
    }


    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                
                <div className="grid gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">{student.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">{student.email}</CardDescription>
                            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-4">
                                {student.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{student.phone}</span></div>}
                                {student.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{student.address}</span></div>}
                                {student.links?.linkedin && <a href={student.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Linkedin className="h-4 w-4 text-muted-foreground" /> <span>LinkedIn</span></a>}
                                {student.links?.github && <a href={student.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Github className="h-4 w-4 text-muted-foreground" /> <span>GitHub</span></a>}
                                <div className="flex items-center gap-2"><School className="h-4 w-4 text-muted-foreground" /><span>{student.instituteName}</span></div>
                                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{student.branch}</span></div>
                                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Graduates in {student.graduationYear}</span></div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Career Objective</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">
                                {student.careerObjective || "No career objective provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {student.skills && <SkillAnalytics skills={student.skills} />}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {applicationId ? "Submitted Resume" : "Resumes"}
                            </CardTitle>
                            <CardDescription>
                                {applicationId ? "This is the resume the candidate submitted for the job." : "Review the candidate's submitted resumes."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loadingResumes ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                             ) : resumes.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" defaultValue={applicationId && resumes.length > 0 ? resumes[0].id : undefined}>
                                    {resumes.map(resume => (
                                        <AccordionItem key={resume.id} value={resume.id}>
                                            <AccordionTrigger className="text-lg font-semibold">{resume.title}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="bg-muted p-4 sm:p-8 rounded-lg mt-4">
                                                    <div className="mx-auto w-full max-w-[210mm] shadow-lg">
                                                        <ResumePreview resume={resume} />
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                             ) : (
                                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                                    <p className="text-muted-foreground">{applicationId ? "No resume was submitted for this application." : "This candidate has not created any resumes yet."}</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
