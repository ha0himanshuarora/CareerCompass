
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application } from "@/lib/types";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

interface KanbanApplication extends Application {
    id: string;
}

interface Column {
    id: Application['status'];
    title: string;
    applicationIds: string[];
}

interface BoardData {
    columns: Record<Application['status'], Column>;
    applications: Record<string, KanbanApplication>;
}

export function KanbanBoard() {
  const { userProfile } = useAuth();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const applicationsQuery = query(collection(db, "applications"), where("studentId", "==", userProfile.uid));

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
        const applications: Record<string, KanbanApplication> = {};
        const columns = KANBAN_COLUMNS.reduce((acc, col) => {
            acc[col.id as Application['status']] = { ...col, applicationIds: [] };
            return acc;
        }, {} as Record<Application['status'], Column>);

        snapshot.forEach(doc => {
            const app = { id: doc.id, ...doc.data() } as KanbanApplication;
            applications[app.id] = app;
            if (columns[app.status]) {
                columns[app.status].applicationIds.push(app.id);
            }
        });

        setBoard({ applications, columns });
        setLoading(false);
    });

    return () => unsubscribe();

  }, [userProfile]);

  if (loading || !board) {
    return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(columnInfo => {
        const column = board.columns[columnInfo.id as keyof typeof board.columns];
        const applications = column.applicationIds.map(appId => board.applications[appId as keyof typeof board.applications]);

        return (
          <div key={column.id} className="w-80 flex-shrink-0">
            <Card className="bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-base font-headline font-semibold flex items-center gap-2">
                  {column.title}
                  <Badge variant="secondary" className="rounded-full">{applications.length}</Badge>
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-2 space-y-2 min-h-32">
                {applications.map(app => (
                  <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm">{app.companyName}</h4>
                      <p className="text-xs text-muted-foreground">{app.jobTitle}</p>
                      {app.appliedDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(app.appliedDate.toDate(), { addSuffix: true })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
