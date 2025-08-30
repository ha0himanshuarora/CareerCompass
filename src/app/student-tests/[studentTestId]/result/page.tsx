
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/firebase";
import { StudentTestResult, Test } from "@/lib/types";
import { cn } from "@/lib/utils";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function TestResultPage() {
    const router = useRouter();
    const params = useParams();
    const studentTestId = params.studentTestId as string;
    
    const [result, setResult] = useState<StudentTestResult | null>(null);
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!studentTestId) return;

        const fetchResult = async () => {
            setLoading(true);
            const resultsQuery = query(collection(db, "studentTestResults"), where("studentTestId", "==", studentTestId));
            const querySnapshot = await getDocs(resultsQuery);

            if (!querySnapshot.empty) {
                const resultData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as StudentTestResult;
                setResult(resultData);

                const testDoc = await getDoc(doc(db, "tests", resultData.testId));
                if(testDoc.exists()) {
                    setTest(testDoc.data() as Test);
                }
            }
            setLoading(false);
        };
        fetchResult();

    }, [studentTestId]);

    if (loading || !result || !test) {
        return <AppLayout><div>Loading...</div></AppLayout>;
    }
    
    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                 <Button variant="ghost" onClick={() => router.push('/student-tests')} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tests
                </Button>

                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Test Results</CardTitle>
                        <CardDescription>You scored</CardDescription>
                        <p className="text-6xl font-bold text-primary pt-4">{result.score}/{result.totalQuestions}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full max-w-sm mx-auto space-y-2">
                             <Progress value={percentage} className="h-3" />
                             <p className="text-lg font-semibold">{percentage}%</p>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="mt-8">
                    <h2 className="text-2xl font-bold font-headline mb-4">Review Your Answers</h2>
                    <div className="space-y-4">
                        {test.questions.map((q, i) => {
                            const studentAnswerIndex = result.answers.find(a => a.questionIndex === i)?.selectedOption;
                            const isCorrect = studentAnswerIndex === q.correctOption;

                            return (
                                <Card key={i}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex justify-between items-start">
                                            <span>Question {i+1}</span>
                                            {isCorrect ? <CheckCircle className="text-green-500 size-6" /> : <XCircle className="text-destructive size-6" />}
                                        </CardTitle>
                                        <p className="text-base font-normal pt-2">{q.questionText}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {q.options.map((opt, optIndex) => {
                                            const isStudentAnswer = studentAnswerIndex === optIndex;
                                            const isCorrectAnswer = q.correctOption === optIndex;
                                            return (
                                                <div key={optIndex} className={cn(
                                                    "p-3 border rounded-md",
                                                    isStudentAnswer && !isCorrect && "bg-destructive/10 border-destructive",
                                                    isCorrectAnswer && "bg-green-500/10 border-green-500",
                                                )}>
                                                    <p>{opt}</p>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

            </div>
        </AppLayout>
    )
}
