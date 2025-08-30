"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";

const initialData = {
  columns: {
    'applied': { id: 'applied', title: 'Applied', applicationIds: ['app-1', 'app-2'] },
    'test': { id: 'test', title: 'Test', applicationIds: ['app-3'] },
    'shortlisted': { id: 'shortlisted', title: 'Shortlisted', applicationIds: [] },
    'interview': { id: 'interview', title: 'Interview', applicationIds: ['app-4'] },
    'offer': { id: 'offer', title: 'Offer', applicationIds: ['app-5'] },
    'joined': { id: 'joined', title: 'Joined', applicationIds: [] },
  },
  applications: {
    'app-1': { id: 'app-1', company: 'FutureTech', role: 'Software Engineer', date: '2024-07-22' },
    'app-2': { id: 'app-2', company: 'Creative Solutions', role: 'UI/UX Designer', date: '2024-07-21' },
    'app-3': { id: 'app-3', company: 'Innovate Inc.', role: 'Frontend Developer', date: '2024-07-20' },
    'app-4': { id: 'app-4', company: 'DataDriven Co.', role: 'Data Analyst Intern', date: '2024-07-18' },
    'app-5': { id: 'app-5', company: 'Global Synergy', role: 'Project Manager', date: '2024-07-15' },
  },
  columnOrder: ['applied', 'test', 'shortlisted', 'interview', 'offer', 'joined'],
};

export function KanbanBoard() {
  const data = initialData;

  // Drag and drop functionality is not implemented in this version
  // This is a static representation of the board

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {data.columnOrder.map(columnId => {
        const column = data.columns[columnId as keyof typeof data.columns];
        const applications = column.applicationIds.map(appId => data.applications[appId as keyof typeof data.applications]);

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
                      <h4 className="font-semibold text-sm">{app.company}</h4>
                      <p className="text-xs text-muted-foreground">{app.role}</p>
                      <p className="text-xs text-muted-foreground mt-2">{`Applied: ${app.date}`}</p>
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
