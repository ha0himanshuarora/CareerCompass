"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TpoDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Welcome, TPO {userProfile?.name ?? 'user'}!</h1>
            <p className="text-muted-foreground">Here's an overview of your institute's placement status.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>TPO Dashboard</CardTitle>
                <CardDescription>Content specific to TPOs will be displayed here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>You can manage student data, track company visits, and view placement statistics.</p>
                <Button className="mt-4">View Placement Report</Button>
            </CardContent>
        </Card>
    </div>
  );
}
