
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, FileText, MessageSquare, Target, MoreHorizontal, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Application, Interview } from "@/lib/types";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface SummaryCardData {
    applicationsTracked: number;
    interviewsScheduled: number;
    offersReceived: number;
    resumesCreated: number;
}

export function StudentDashboard() {
    const { userProfile } = useAuth();
    const [summary, setSummary] = useState<SummaryCardData>({
        applicationsTracked: 0,
        interviewsScheduled: 0,
        offersReceived: 0,
        resumesCreated: 0,
    });
    const [recentApplications, setRecentApplications] = useState<Application[]>([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!userProfile) return;

        setLoading(true);
        const studentId = userProfile.uid;
        
        // Listener for all applications to calculate summary
        const appsQuery = query(collection(db, "applications"), where("studentId", "==", studentId));
        const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
            const offers = snapshot.docs.filter(doc => doc.data().status === 'offer').length;
            setSummary(prev => ({ ...prev, applicationsTracked: snapshot.size, offersReceived: offers }));
        });

        // Listener for recent applications
        const recentAppsQuery = query(collection(db, "applications"), where("studentId", "==", studentId), orderBy("appliedDate", "desc"), limit(5));
        const unsubscribeRecentApps = onSnapshot(recentAppsQuery, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            setRecentApplications(apps);
        });

        // Listener for upcoming interviews
        const interviewsQuery = query(collection(db, "interviews"), where("studentId", "==", studentId), where("interviewDate", ">=", new Date()), orderBy("interviewDate", "asc"));
        const unsubscribeInterviews = onSnapshot(interviewsQuery, (snapshot) => {
            const interviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
            setUpcomingInterviews(interviews);
            setSummary(prev => ({...prev, interviewsScheduled: interviews.length}));
        });
        
        setLoading(false);

        return () => {
            unsubscribeApps();
            unsubscribeRecentApps();
            unsubscribeInterviews();
        };

    }, [userProfile]);

    const summaryCards = [
        { title: "Applications Tracked", value: summary.applicationsTracked, icon: Briefcase },
        { title: "Interviews Scheduled", value: summary.interviewsScheduled, icon: MessageSquare },
        { title: "Offers Received", value: summary.offersReceived, icon: Target },
        { title: "Resumes Created", value: summary.resumesCreated, icon: FileText },
    ];
    
    if (loading) {
         return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome back, {userProfile?.name ?? 'user'}!</h1>
                <p className="text-muted-foreground">Here's a snapshot of your placement journey.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card, index) => (
                    <Card key={index} className="shadow-lg rounded-xl">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle>Upcoming Activities</CardTitle>
                        <CardDescription>Don't miss these important dates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Activity</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingInterviews.length > 0 ? upcomingInterviews.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="font-medium">{activity.jobTitle}</TableCell>
                                        <TableCell>{activity.companyName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{format((activity.interviewDate as unknown as Timestamp).toDate(), "PPP")}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No upcoming interviews or deadlines.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="shadow-lg rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Applications</CardTitle>
                            <CardDescription>Your latest application updates.</CardDescription>
                        </div>
                         <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                            {recentApplications.length > 0 ? recentApplications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-muted rounded-md">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{app.companyName}</p>
                                            <p className="text-sm text-muted-foreground">{app.jobTitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={app.status === 'Interview' ? 'default' : 'secondary'}>{app.status}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format((app.appliedDate as unknown as Timestamp)?.toDate(), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-center text-muted-foreground">No recent applications.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
