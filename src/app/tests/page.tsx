
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, FileText, Clock, Edit, Trash2, Send } from "lucide-react";
import { CreateTestForm } from "@/components/CreateTestForm";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Test, TPO, Student, Job } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AssignTestDialog } from "@/components/AssignTestDialog";


export default function ManageTestsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [tests, setTests] = useState<Test[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [testToEdit, setTestToEdit] = useState<Test | null>(null);
    const [testToAssign, setTestToAssign] = useState<Test | null>(null);
    const [testToDelete, setTestToDelete] = useState<Test | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [assigningTestId, setAssigningTestId] = useState<string | null>(null);

    useEffect(() => {
        if (!userProfile) return;

        setLoading(true);
        const testsQuery = query(collection(db, "tests"), where("createdBy", "==", userProfile.uid));
        const jobsQuery = query(collection(db, "jobs"), where("companyId", "==", userProfile.uid));

        const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
            const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
            setTests(testsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tests: ", error);
            setLoading(false);
        });
        
        const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
        });

        return () => {
            unsubscribeTests();
            unsubscribeJobs();
        };
    }, [userProfile]);
    
    const handleOpenCreateDialog = (test: Test | null) => {
        setTestToEdit(test);
        setCreateDialogOpen(true);
    }

    const handleOpenAssignDialog = (test: Test) => {
        setTestToAssign(test);
        setAssignDialogOpen(true);
    }
    
    const handleCloseCreateDialog = () => {
        setTestToEdit(null);
        setCreateDialogOpen(false);
    }
    
    const handleDeleteTest = async () => {
        if (!testToDelete) return;
        setIsDeleting(true);
        try {
            // NOTE: This is a simple delete. In a real-world app, you'd need to handle orphaned studentTests, results etc.
            await deleteDoc(doc(db, "tests", testToDelete.id));
            toast({ title: "Success", description: "Test deleted successfully."});
            setTestToDelete(null);
        } catch (error) {
            console.error("Error deleting test:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete test." });
        } finally {
            setIsDeleting(false);
        }
    }
    
    const handleAssignToStudents = async (testId: string) => {
        if (userProfile?.role !== 'tpo' || !userProfile.instituteName) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        setAssigningTestId(testId);
        try {
            const studentsQuery = query(
                collection(db, "users"),
                where("role", "==", "student"),
                where("instituteName", "==", userProfile.instituteName)
            );
            const studentSnapshot = await getDocs(studentsQuery);
            const students = studentSnapshot.docs.map(doc => doc.data() as Student);
            
            const assignmentsQuery = query(collection(db, "studentTests"), where("testId", "==", testId));
            const assignmentSnapshot = await getDocs(assignmentsQuery);
            const assignedStudentIds = new Set(assignmentSnapshot.docs.map(doc => doc.data().studentId));
            
            const studentsToAssign = students.filter(s => !assignedStudentIds.has(s.uid));

            if (studentsToAssign.length === 0) {
                 toast({ title: "No new students", description: "This test has already been assigned to all students in your institute." });
                 setAssigningTestId(null);
                 return;
            }

            const assignmentPromises = studentsToAssign.map(student => {
                return addDoc(collection(db, "studentTests"), {
                    studentId: student.uid,
                    testId: testId,
                    assignedBy: userProfile.uid,
                    status: 'pending',
                    assignedAt: serverTimestamp(),
                });
            });

            await Promise.all(assignmentPromises);
            
            toast({ title: "Success!", description: `Test assigned to ${studentsToAssign.length} new student(s).` });

        } catch (error) {
            console.error("Error assigning test:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to assign the test." });
        } finally {
            setAssigningTestId(null);
        }
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage Tests</h1>
                    <p className="text-muted-foreground">
                        {userProfile?.role === 'tpo'
                            ? "Create and manage mock tests for your students."
                            : "Create and manage tests for your job applications."
                        }
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                         <Button onClick={() => handleOpenCreateDialog(null)}>
                            <Plus className="-ml-1 mr-2 h-4 w-4" />
                            Create New Test
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{testToEdit ? 'Edit Test' : 'Create a New Test'}</DialogTitle>
                        </DialogHeader>
                        <CreateTestForm onFormSubmit={handleCloseCreateDialog} initialData={testToEdit}/>
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : tests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map(test => (
                        <Card key={test.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{test.title}</CardTitle>
                                <CardDescription>
                                    {test.type === 'mock'
                                        ? `Mock Test for ${(userProfile as TPO)?.instituteName}`
                                        : `Company Test for ${test.companyName}`
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>{test.questions.length} Questions</span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{test.duration} minutes</span>
                                </div>
                            </CardContent>
                            <CardContent className="flex items-center gap-2">
                                {userProfile?.role === 'tpo' && test.type === 'mock' ? (
                                    <>
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenCreateDialog(test)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                        <Button size="sm" className="w-full" onClick={() => handleAssignToStudents(test.id)} disabled={assigningTestId === test.id}>
                                           {assigningTestId === test.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            Assign
                                        </Button>
                                    </>
                                ) : (
                                     <>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenCreateDialog(test)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                        <Button size="sm" className="w-full" onClick={() => handleOpenAssignDialog(test)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Assign
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setTestToDelete(test)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center border-2 border-dashed rounded-lg p-12">
                    <h3 className="text-lg font-semibold">No tests created yet</h3>
                    <p className="text-muted-foreground mt-2">Click "Create New Test" to get started.</p>
                </div>
            )}

             <AlertDialog open={!!testToDelete} onOpenChange={(open) => !open && setTestToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the test. Any existing student assignments for this test will also be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTest} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Test
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {testToAssign && (
                <AssignTestDialog 
                    isOpen={isAssignDialogOpen} 
                    onOpenChange={setAssignDialogOpen}
                    test={testToAssign}
                    jobs={jobs}
                />
            )}

        </AppLayout>
    );
}
