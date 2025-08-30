
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { StudentTest, Test, Question, StudentTestResult, Application } from "@/lib/types";
import { cn } from "@/lib/utils";
import { collection, doc, getDoc, addDoc, serverTimestamp, updateDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { AlarmClock, ArrowLeft, ArrowRight, Check, Loader2, Target } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form";


export default function TakeTestPage() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const studentTestId = params.studentTestId as string;
    
    const [studentTest, setStudentTest] = useState<StudentTest | null>(null);
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<number, number>>(new Map());

    const handleSubmit = useCallback(async () => {
        if (!test || !studentTest || !userProfile) return;
        setIsSubmitting(true);
        
        let score = 0;
        const resultAnswers = [];
        for (let i = 0; i < test.questions.length; i++) {
            const question = test.questions[i];
            const studentAnswer = answers.get(i);
            if (studentAnswer !== undefined && studentAnswer === question.correctOption) {
                score++;
            }
            resultAnswers.push({ questionIndex: i, selectedOption: studentAnswer ?? -1 });
        }
        
        try {
            const resultData: Omit<StudentTestResult, 'id'> = {
                studentTestId: studentTest.id,
                studentId: userProfile!.uid,
                testId: test.id,
                testType: test.type,
                answers: resultAnswers,
                score,
                totalQuestions: test.questions.length,
                submittedAt: serverTimestamp(),
            };

            await addDoc(collection(db, "studentTestResults"), resultData);
            
            await updateDoc(doc(db, "studentTests", studentTest.id), {
                status: 'completed',
                completedAt: serverTimestamp(),
                score: score,
            });

            // If it's a company test and the student passed, update application status
            if (test.type === 'company' && test.passingScore !== undefined && score >= test.passingScore && studentTest.jobId) {
                const appsQuery = query(
                    collection(db, "applications"),
                    where("studentId", "==", userProfile.uid),
                    where("jobId", "==", studentTest.jobId)
                );
                const appSnapshot = await getDocs(appsQuery);
                if (!appSnapshot.empty) {
                    const appDoc = appSnapshot.docs[0];
                    await updateDoc(appDoc.ref, { status: 'shortlisted' });
                    toast({title: "Congratulations!", description: "You passed the test and have been shortlisted for the next stage."});
                }
            }

            router.push(`/student-tests/${studentTestId}/result`);
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit test results.' });
            setIsSubmitting(false);
        }
    }, [test, studentTest, userProfile, answers, router, studentTestId, toast]);

    // Fetch data
    useEffect(() => {
        if (!studentTestId || !userProfile) return;

        const fetchTestData = async () => {
            setLoading(true);
            const studentTestDoc = await getDoc(doc(db, "studentTests", studentTestId));
            if (!studentTestDoc.exists()) {
                toast({ variant: "destructive", title: "Error", description: "Test not found."});
                router.push("/student-tests");
                return;
            }

            const st = { id: studentTestDoc.id, ...studentTestDoc.data() } as StudentTest;
            
            if (st.status === 'completed') {
                router.push(`/student-tests/${studentTestId}/result`);
                return;
            }
            
            setStudentTest(st);

            const testDoc = await getDoc(doc(db, "tests", st.testId));
            if (testDoc.exists()) {
                const testData = { id: testDoc.id, ...testDoc.data() } as Test;
                setTest(testData);
                
                if (st.status === 'pending') {
                    await updateDoc(studentTestDoc.ref, { status: 'inprogress', startedAt: serverTimestamp() });
                    setTimeLeft(testData.duration * 60);
                } else if (st.startedAt) {
                    const startTime = (st.startedAt as Timestamp).toDate();
                    const now = new Date();
                    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                    setTimeLeft(Math.max(0, (testData.duration * 60) - elapsed));
                }
            }
            setLoading(false);
        }
        fetchTestData();
    }, [studentTestId, userProfile, router, toast]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0 || loading || isSubmitting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading, isSubmitting, handleSubmit]);
    
    const currentQuestion: Question | undefined = useMemo(() => test?.questions[currentQuestionIndex], [test, currentQuestionIndex]);

    const handleOptionSelect = (optionIndex: number) => {
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestionIndex, optionIndex);
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (test && currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }
    
    if(loading || !test || !currentQuestion) {
        return <AppLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div></AppLayout>
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };


    return (
       <AppLayout>
        <div className="max-w-6xl mx-auto">
            <Card className="mb-4">
                <CardContent className="p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold font-headline">{test.title}</h1>
                    <div className="flex items-center gap-6">
                        {test.passingScore && (
                            <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                                <Target className="size-5" />
                                <span>Passing Score: {test.passingScore}/{test.questions.length}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-red-500 font-semibold">
                            <AlarmClock className="size-5" />
                            <span>Time Left: {formatTime(timeLeft)}</span>
                        </div>
                        <span className="text-muted-foreground">Total: {test.questions.length} Questions</span>
                        <Dialog>
                            <DialogTrigger asChild><Button variant="destructive" disabled={isSubmitting}>Finish Exam</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you sure you want to finish the exam?</DialogTitle>
                                    <DialogDescription>Your answers will be submitted and you won't be able to change them.</DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                    <DialogTrigger asChild><Button variant="ghost">Cancel</Button></DialogTrigger>
                                    <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin"/>}
                                        Submit
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6 text-lg">{currentQuestion.questionText}</p>
                        <RadioGroup value={String(answers.get(currentQuestionIndex))} onValueChange={(val) => handleOptionSelect(Number(val))} className="space-y-4">
                            {currentQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-3 space-y-0 p-4 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                    <RadioGroupItem value={String(i)} id={`q${currentQuestionIndex}-opt${i}`} />
                                    <label htmlFor={`q${currentQuestionIndex}-opt${i}`} className="font-normal text-base flex-1 cursor-pointer">{opt}</label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-2 size-4" /> Previous</Button>
                         <Button onClick={handleNext} disabled={currentQuestionIndex === test.questions.length - 1}>Next <ArrowRight className="ml-2 size-4" /></Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Question Navigator</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-5 gap-6">
                        {test.questions.map((_, i) => (
                            <Button 
                                key={i}
                                variant="outline"
                                className={cn(
                                    "h-12 w-12",
                                    answers.has(i) && "bg-blue-200/50 border-blue-500",
                                    currentQuestionIndex === i && "bg-green-200/50 border-green-500 ring-2 ring-green-500"
                                )}
                                onClick={() => setCurrentQuestionIndex(i)}
                            >
                                {i + 1}
                                {answers.has(i) && <Check className="absolute bottom-1 right-1 size-3 text-blue-700"/>}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
       </AppLayout>
    );
}
