
"use client"

import React from "react";
import { Application } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { KANBAN_COLUMNS } from "@/lib/constants";

interface PlacementHistoryProps {
    applications: Application[];
}

// All possible stages in order, excluding 'rejected' which is a terminal state, not a stage to progress through.
const STAGES = KANBAN_COLUMNS.filter(c => c.id !== 'rejected').map(c => c.id);

export function PlacementHistory({ applications }: PlacementHistoryProps) {
    if (applications.length === 0) {
        return (
            <div className="text-center p-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {applications.map(app => {
                const currentStageIndex = STAGES.indexOf(app.status);
                const isRejected = app.status === 'rejected';
                
                return (
                    <Card key={app.id}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>{app.companyName}</CardTitle>
                                    <CardDescription>
                                        Applied for {app.jobTitle} on {app.appliedDate ? format(app.appliedDate.toDate(), "PPP") : "N/A"}
                                    </CardDescription>
                                </div>
                                {isRejected && <Badge variant="destructive" className="text-base">Rejected</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 overflow-x-auto pb-4">
                                {STAGES.map((stage, index) => {
                                    // If rejected, nothing past the 'applied' stage should seem completed unless it was.
                                    // A real-world scenario would need to store the stage at which rejection happened.
                                    // For this implementation, we'll assume rejection can happen at any stage, but visualize it simply.
                                    const isCompleted = !isRejected && index < currentStageIndex;
                                    const isCurrent = !isRejected && index === currentStageIndex;

                                    let variant: "default" | "secondary" | "outline" | "destructive" = "outline";
                                    if (isCompleted || isCurrent) {
                                      variant = "default";
                                    }
                                    
                                    return (
                                        <React.Fragment key={stage}>
                                            <Badge 
                                                variant={variant}
                                                className={cn(
                                                    "capitalize px-4 py-2 text-sm transition-all duration-300",
                                                    !isCompleted && !isCurrent && "opacity-40"
                                                )}
                                            >
                                                {stage}
                                            </Badge>
                                            {index < STAGES.length - 1 && (
                                                <div className={cn(
                                                    "h-0.5 w-8 flex-shrink-0 transition-all duration-300",
                                                    isCompleted ? "bg-primary" : "bg-border"
                                                )} />
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
