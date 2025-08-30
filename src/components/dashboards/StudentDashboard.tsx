"use client";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, FileText, MessageSquare, Target, MoreHorizontal } from "lucide-react";

const summaryCards = [
    { title: "Applications Tracked", value: "24", icon: Briefcase, change: "+5 this week", changeColor: "text-green-500" },
    { title: "Interviews Scheduled", value: "3", icon: MessageSquare, change: "+1 this week", changeColor: "text-green-500" },
    { title: "Offers Received", value: "1", icon: Target, change: "New!", changeColor: "text-blue-500" },
    { title: "Resumes Created", value: "4", icon: FileText, change: "+2 this month", changeColor: "text-green-500" },
];

const upcomingActivities = [
    { activity: "Technical Test - Innovate Inc.", date: "2024-07-25", type: "Test" },
    { activity: "HR Interview - DataDriven Co.", date: "2024-07-28", type: "Interview" },
    { activity: "Application Deadline - FutureTech", date: "2024-07-30", type: "Deadline" },
];

const recentApplications = [
    { company: "Innovate Inc.", role: "Frontend Developer", status: "Test", date: "Applied 2d ago" },
    { company: "DataDriven Co.", role: "Data Analyst Intern", status: "Interview", date: "Applied 1w ago" },
    { company: "FutureTech", role: "Software Engineer", status: "Applied", date: "Applied 5h ago" },
];

export function StudentDashboard() {
    const { userProfile } = useAuth();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Welcome back, {userProfile?.name ?? 'user'}!</h1>
                    <p className="text-muted-foreground">Here's a snapshot of your placement journey.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline">Schedule</Button>
                    <Button>Analytics</Button>
                    <Button variant="outline">Candidates</Button>
                    <Button variant="outline">KPI</Button>
                    <Button variant="outline">Leads</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card, index) => (
                    <Card key={index} className="shadow-lg rounded-xl">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <card.icon className="h-5 w-5" />
                                <CardTitle className="text-base font-medium">{card.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-end justify-between">
                            <div className="text-4xl font-bold">{card.value}</div>
                            <p className={`text-sm font-semibold ${card.changeColor}`}>{card.change}</p>
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
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingActivities.map((activity, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{activity.activity}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="mt-1">{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{activity.date}</TableCell>
                                    </TableRow>
                                ))}
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
                            {recentApplications.map((app, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-muted rounded-md">
                                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{app.company}</p>
                                            <p className="text-sm text-muted-foreground">{app.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                            <Badge variant={app.status === 'Interview' ? 'default' : 'secondary'}>{app.status}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{app.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
