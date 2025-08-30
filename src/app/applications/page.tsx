import { AppLayout } from "@/components/AppLayout";
import { KanbanBoard } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Job Application Tracker</h1>
            <p className="text-muted-foreground">Manage your job applications from start to finish.</p>
          </div>
          <Button>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Application
          </Button>
        </div>
        <div className="flex-1 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
