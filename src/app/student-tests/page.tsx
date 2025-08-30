
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { StudentTest, Test, TPO, Recruiter } from "@/lib/types";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Clock, FileQuestion, Loader2, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PopulatedStudentTest extends StudentTest {
  testDetails: Test;
  creatorName: string;
}

export default function StudentTestsPage() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<PopulatedStudentTest[]>([]);

    useEffect(() => {
        if (!userProfile) return;

        setLoading(true);
        const studentTestsQuery = query(collection(db, "studentTests"), where("studentId", "==", userProfile.uid));

        const unsubscribe = onSnapshot(studentTestsQuery, async (snapshot) => {
            const populatedTestsPromises = snapshot.docs.map(async (studentTestDoc) => {
                const studentTestData = studentTestDoc.data() as StudentTest;
                const testDoc = await getDoc(doc(db, "tests", studentTestData.testId));
                if (!testDoc.exists()) return null;

                const testData = { id: testDoc.id, ...testDoc.data() } as Test;
                const creatorDoc = await getDoc(doc(db, "users", testData.createdBy));
                if (!creatorDoc.exists()) return null;
                
                const creatorData = creatorDoc.data() as TPO | Recruiter;

                const creatorName = testData.type === 'mock' 
                    ? (creatorData as TPO).instituteName 
                    : (creatorData as Recruiter).companyName;

                return {
                    ...studentTestData,
                    id: studentTestDoc.id,
                    testDetails: testData,
                    creatorName,
                };
            });

            const populatedTests = (await Promise.all(populatedTestsPromises)).filter(Boolean) as PopulatedStudentTest[];
            setTests(populatedTests);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const mockTests = tests.filter(t => t.testDetails.type === 'mock');
    const companyTests = tests.filter(t => t.testDetails.type === 'company');

    const renderTestList = (testList: PopulatedStudentTest[]) => {
        if (testList.length === 0) {
            return (
                 <div className="text-center border-2 border-dashed rounded-lg p-12 mt-4">
                    <p className="text-muted-foreground">No tests available in this category.</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {testList.map(item => (
                     <Card key={item.id}>
                        <CardHeader>
                            <CardTitle>{item.testDetails.title}</CardTitle>
                            <CardDescription>By {item.creatorName}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <FileQuestion className="h-4 w-4" />
                                <span>{item.testDetails.questions.length} Questions</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{item.testDetails.duration} minutes</span>
                            </div>
                            {item.testDetails.type === 'company' && item.testDetails.passingScore && (
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Target className="h-4 w-4" />
                                    <span>Passing Score: {item.testDetails.passingScore}/{item.testDetails.questions.length}</span>
                                </div>
                            )}
                            <Button asChild className="w-full mt-4">
                                <Link href={item.status === 'completed' ? `/student-tests/${item.id}/result` : `/student-tests/${item.id}`}>
                                    {item.status === 'completed' ? 'View Result' : 'Start Test'}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }


    return (
        <AppLayout>
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Tests</h1>
                    <p className="text-muted-foreground">Take assigned tests and review your performance.</p>
                </div>
                {userProfile?.role === 'student' && (
                    <Button asChild variant="outline">
                        <Link href="/leaderboard">
                            <Trophy className="mr-2 h-4 w-4" />
                            View Leaderboard
                        </Link>
                    </Button>
                )}
            </div>

            {loading ? (
                 <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="company">
                    <TabsList>
                        <TabsTrigger value="company">Company Tests</TabsTrigger>
                        <TabsTrigger value="mock">Mock Tests</TabsTrigger>
                    </TabsList>
                    <TabsContent value="company">{renderTestList(companyTests)}</TabsContent>
                    <TabsContent value="mock">{renderTestList(mockTests)}</TabsContent>
                </Tabs>
            )}

        </AppLayout>
    );
}
