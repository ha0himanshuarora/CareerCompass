
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Student } from "@/lib/types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function TPOStudentsPage() {
    const { userProfile } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile || !userProfile.instituteName) return;

        setLoading(true);
        const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("instituteName", "==", userProfile.instituteName));
        
        const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => doc.data() as Student);
            setStudents(studentsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching students: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Student Management</h1>
                    <p className="text-muted-foreground">View and manage all students from your institute.</p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                </Button>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Graduation Year</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? students.map((student) => (
                            <TableRow key={student.uid}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.branch}</TableCell>
                                <TableCell>{student.graduationYear}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View Details</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No students found for your institute.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </AppLayout>
    );
}
