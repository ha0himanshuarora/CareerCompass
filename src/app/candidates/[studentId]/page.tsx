
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { Student } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Briefcase, Calendar, GraduationCap, Loader2, Mail, School, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function CandidateProfilePage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.studentId as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;

        const fetchStudent = async () => {
            setLoading(true);
            try {
                const studentDoc = await getDoc(doc(db, "users", studentId));
                if (studentDoc.exists()) {
                    setStudent(studentDoc.data() as Student);
                } else {
                    // Handle case where student not found
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
                        <CardHeader className="flex flex-col md:flex-row items-start gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${student.uid}`} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-3xl font-headline">{student.name}</CardTitle>
                                <CardDescription className="text-lg text-muted-foreground">{student.email}</CardDescription>
                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                                     <div className="flex items-center gap-2">
                                        <School className="h-4 w-4 text-muted-foreground" />
                                        <span>{student.instituteName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        <span>{student.branch}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Graduates in {student.graduationYear}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Resumes
                            </CardTitle>
                            <CardDescription>
                                Candidate's uploaded resumes will appear here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border-2 border-dashed rounded-lg p-12 text-center">
                                <p className="text-muted-foreground">Resume management not implemented yet.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

