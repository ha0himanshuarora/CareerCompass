
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Student, StudentTestResult, TPO } from "@/lib/types";
import { collection, query, where, getDocs, doc, getDoc, limit, collectionGroup } from "firebase/firestore";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardEntry {
    rank: number;
    studentId: string;
    name: string;
    branch: string;
    totalScore: number;
}

export default function LeaderboardPage() {
    const { userProfile } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.role !== 'student' || !userProfile.instituteName) {
            setLoading(false);
            return;
        }

        const fetchLeaderboardData = async () => {
            setLoading(true);
            try {
                // 1. Get all students from the same institute
                const studentsQuery = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    where("instituteName", "==", userProfile.instituteName)
                );
                const studentSnapshot = await getDocs(studentsQuery);
                const studentIds = studentSnapshot.docs.map(d => d.id);
                const studentsMap = new Map<string, Student>();
                studentSnapshot.forEach(doc => studentsMap.set(doc.id, doc.data() as Student));
                
                if (studentIds.length === 0) {
                    setLeaderboard([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch all mock test results for these students
                const resultsQuery = query(
                    collection(db, "studentTestResults"),
                    where("studentId", "in", studentIds),
                    where("testType", "==", "mock")
                );
                const resultsSnapshot = await getDocs(resultsQuery);
                const testResults = resultsSnapshot.docs.map(d => d.data() as StudentTestResult);

                // 3. Aggregate scores for each student
                const scoreMap = new Map<string, number>();
                testResults.forEach(result => {
                    const currentScore = scoreMap.get(result.studentId) || 0;
                    scoreMap.set(result.studentId, currentScore + result.score);
                });

                // 4. Create leaderboard entries
                const unsortedLeaderboard: Omit<LeaderboardEntry, 'rank'>[] = [];
                scoreMap.forEach((totalScore, studentId) => {
                    const studentData = studentsMap.get(studentId);
                    if (studentData) {
                        unsortedLeaderboard.push({
                            studentId: studentId,
                            name: studentData.name,
                            branch: studentData.branch,
                            totalScore: totalScore,
                        });
                    }
                });

                // 5. Sort and rank
                const sortedLeaderboard = unsortedLeaderboard
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((entry, index) => ({
                        ...entry,
                        rank: index + 1,
                    }));

                setLeaderboard(sortedLeaderboard);

            } catch (error) {
                console.error("Error fetching leaderboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchLeaderboardData();

    }, [userProfile]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
        return <span className="w-5 text-center">{rank}</span>;
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }
    
    if (userProfile?.role !== 'student') {
        return (
             <AppLayout>
                <div className="text-center">
                    <p>Leaderboard is only available for students.</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Trophy className="size-8 text-primary" /> Campus Leaderboard
                    </h1>
                    <p className="text-muted-foreground">Based on cumulative scores from all mock tests.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{userProfile.instituteName}</CardTitle>
                    <CardDescription>Top performers in mock tests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {leaderboard.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Rank</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-right">Total Score</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {leaderboard.map((entry) => (
                                    <TableRow key={entry.studentId} className={entry.studentId === userProfile.uid ? 'bg-primary/10' : ''}>
                                        <TableCell className="font-bold text-lg">
                                            <div className="flex items-center justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{entry.name}</TableCell>
                                        <TableCell>{entry.branch}</TableCell>
                                        <TableCell className="text-right font-semibold">{entry.totalScore}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center border-2 border-dashed rounded-lg p-12">
                            <p className="text-muted-foreground">No one has taken any mock tests yet. Be the first!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </AppLayout>
    );
}
