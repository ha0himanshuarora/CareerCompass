
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { Application } from "@/lib/types";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
} from "firebase/firestore";
import { Loader2, Check, X, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlacementHistory } from "@/components/PlacementHistory";
import Link from "next/link";

function ApplicationMatrix({ applications, isProcessing, onOfferDecision, isPlaced }) {
  const getStatusVariant = (status: Application["status"]) => {
    switch (status) {
      case "joined":
      case "offer":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="border rounded-lg">
      {applications.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">
                  {app.companyName}
                </TableCell>
                <TableCell>{app.jobTitle}</TableCell>
                <TableCell>
                  {app.appliedDate
                    ? formatDistanceToNow(app.appliedDate.toDate(), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(app.status)} className="capitalize">
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {app.status === "offer" && app.offerLetterId && (
                     <Button asChild size="sm" variant="outline">
                       <Link href={`/offer-letters/${app.offerLetterId}`}>
                         <FileText className="mr-2 h-4 w-4" /> View Offer
                       </Link>
                     </Button>
                  )}
                  {app.status !== "offer" && app.status !== "joined" && app.status !== "rejected" ? (
                    <span className="text-muted-foreground text-xs">No actions available</span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center p-12">
          <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
        </div>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const applicationsQuery = query(
      collection(db, "applications"),
      where("studentId", "==", userProfile.uid)
    );

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const apps = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Application)
      );
      setApplications(apps.sort((a, b) => b.appliedDate.toDate() - a.appliedDate.toDate()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleOfferDecision = async (
    acceptedApp: Application,
    decision: "accept" | "reject"
  ) => {
    if (!userProfile || isPlaced) return;
    setIsProcessing(true);

    const batch = writeBatch(db);

    try {
      if (decision === "accept") {
        // 1. Update the student's profile to isPlaced: true
        const studentRef = doc(db, "users", userProfile.uid);
        batch.update(studentRef, { isPlaced: true });

        // 2. Update all other applications
        applications.forEach((app) => {
          const appRef = doc(db, "applications", app.id);
          if (app.id === acceptedApp.id) {
            batch.update(appRef, { status: "joined" });
          } else if (app.status !== "rejected" && app.status !== "joined") {
            batch.update(appRef, { status: "rejected" });
          }
        });

        toast({
          title: "Congratulations!",
          description: `You have accepted the offer from ${acceptedApp.companyName}.`,
        });
      } else {
        // 'reject'
        const appRef = doc(db, "applications", acceptedApp.id);
        batch.update(appRef, { status: "rejected" });
        toast({
          title: "Offer Rejected",
          description: `You have rejected the offer from ${acceptedApp.companyName}.`,
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("Error processing offer decision:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process your decision.",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isPlaced = userProfile?.isPlaced || false;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              Job Application Tracker
            </h1>
            <p className="text-muted-foreground">
              Manage your job applications from start to finish.
            </p>
          </div>
        </div>

        {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="matrix">
              <TabsList>
                <TabsTrigger value="matrix">Application Matrix</TabsTrigger>
                <TabsTrigger value="timeline">History Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="matrix" className="mt-4">
                <ApplicationMatrix 
                  applications={applications} 
                  isProcessing={isProcessing} 
                  onOfferDecision={handleOfferDecision}
                  isPlaced={isPlaced}
                />
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <PlacementHistory applications={applications} />
              </TabsContent>
            </Tabs>
          )}

      </div>
    </AppLayout>
  );
}
