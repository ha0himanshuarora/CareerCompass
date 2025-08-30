import { AppLayout } from "@/components/AppLayout";
import { PlacementTimeline } from "@/components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Briefcase, PencilRuler, MessageSquare, CheckCircle } from "lucide-react";

const timelineEvents = [
  {
    title: "Profile & Resume Building",
    date: "July 1, 2024",
    description: "Completed initial profile setup and created a baseline resume.",
    icon: FileText,
    status: 'completed'
  },
  {
    title: "Started Applying for Jobs",
    date: "July 15, 2024",
    description: "Began actively searching and applying for relevant job opportunities.",
    icon: Briefcase,
    status: 'completed'
  },
  {
    title: "Online Assessment for Innovate Inc.",
    date: "July 25, 2024",
    description: "Scheduled to take the online technical test.",
    icon: PencilRuler,
    status: 'current'
  },
  {
    title: "Interview with DataDriven Co.",
    date: "July 28, 2024",
    description: "Upcoming HR and technical interview rounds.",
    icon: MessageSquare,
    status: 'upcoming'
  },
  {
    title: "Final Placement Offers",
    date: "August 2024",
    description: "Expected timeframe for final offers and decisions.",
    icon: CheckCircle,
    status: 'upcoming'
  },
];


export default function TimelinePage() {
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Placement Journey</h1>
          <p className="text-muted-foreground">A visual timeline of your milestones and deadlines.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Journey Timeline</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="max-w-2xl mx-auto">
             <PlacementTimeline events={timelineEvents} />
            </div>
        </CardContent>
      </Card>

    </AppLayout>
  );
}
