"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RecruiterDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Welcome, Recruiter {userProfile?.name ?? 'user'}!</h1>
            <p className="text-muted-foreground">Here is an overview of your recruitment activities.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recruiter Dashboard</CardTitle>
                <CardDescription>Content specific to recruiters will be displayed here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>You can manage job postings, view applicants, and schedule interviews.</p>
                <Button className="mt-4">Post a New Job</Button>
            </CardContent>
        </Card>
    </div>
  );
}
