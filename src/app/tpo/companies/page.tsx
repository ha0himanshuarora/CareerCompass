
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { Recruiter, Collaboration, TPO } from "@/lib/types";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Loader2, MoreHorizontal, Eye, Handshake, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CompanyDetailsDialog } from "@/components/CompanyDetailsDialog";
import { useAuth } from "@/hooks/use-auth";
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
} from "@/components/ui/alert-dialog"


export default function TPOCompaniesPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyToView, setCompanyToView] = useState<Recruiter | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [collabToDelete, setCollabToDelete] = useState<Collaboration | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setLoading(true);
        const recruitersQuery = query(collection(db, "users"), where("role", "==", "recruiter"));
        const unsubRecruiters = onSnapshot(recruitersQuery, (snapshot) => {
            const recruitersData = snapshot.docs.map(doc => doc.data() as Recruiter);
            setRecruiters(recruitersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recruiters: ", error);
            setLoading(false);
        });
        
        let unsubCollabs = () => {};
        if (userProfile) {
            const collabsQuery = query(collection(db, "collaborations"), where("tpoId", "==", userProfile.uid));
            unsubCollabs = onSnapshot(collabsQuery, (snapshot) => {
                setCollaborations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collaboration)));
            });
        }

        return () => {
            unsubRecruiters();
            unsubCollabs();
        }
    }, [userProfile]);

    const collaborationMap = useMemo(() => {
        const map = new Map<string, Collaboration>();
        collaborations.forEach(c => map.set(c.recruiterId, c));
        return map;
    }, [collaborations]);

    const handleCollaborationRequest = async (recruiter: Recruiter, existingCollab?: Collaboration) => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        setIsSubmitting(recruiter.uid);
        try {
            if (existingCollab) {
                 const collabRef = doc(db, "collaborations", existingCollab.id);
                 await updateDoc(collabRef, {
                    status: 'pending',
                    requestedAt: serverTimestamp(),
                    initiatedBy: 'tpo',
                });
            } else {
                await addDoc(collection(db, "collaborations"), {
                    recruiterId: recruiter.uid,
                    recruiterName: recruiter.name,
                    companyName: recruiter.companyName,
                    tpoId: userProfile.uid,
                    tpoName: userProfile.name,
                    instituteName: (userProfile as TPO).instituteName,
                    status: 'pending',
                    requestedAt: serverTimestamp(),
                    initiatedBy: 'tpo',
                });
            }
            toast({
                title: "Request Sent!",
                description: `Your collaboration request to ${recruiter.companyName} has been sent.`,
            });
        } catch (error) {
            console.error("Error sending request:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not send collaboration request." });
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleDeleteCollaboration = async () => {
        if (!collabToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "collaborations", collabToDelete.id));
            toast({ title: "Collaboration Ended", description: `Your collaboration with ${collabToDelete.companyName} has ended.` });
            setCollabToDelete(null);
        } catch (error) {
            console.error("Error ending collaboration:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not end the collaboration." });
        } finally {
            setIsDeleting(false);
        }
    };


    const renderCollaborationMenuItem = (recruiter: Recruiter) => {
        const collaboration = collaborationMap.get(recruiter.uid);
        const isLoading = isSubmitting === recruiter.uid;

        if (collaboration) {
            switch (collaboration.status) {
                case 'pending':
                    return <DropdownMenuItem disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Request Sent</DropdownMenuItem>
                case 'accepted':
                    return <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setCollabToDelete(collaboration)}><XCircle className="mr-2 h-4 w-4" />End Collaboration</DropdownMenuItem>
                case 'rejected':
                     return (
                        <DropdownMenuItem onClick={() => handleCollaborationRequest(recruiter, collaboration)} disabled={isLoading}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />}
                            Request Again
                        </DropdownMenuItem>
                     )
            }
        }

        return (
            <DropdownMenuItem onClick={() => handleCollaborationRequest(recruiter)} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />}
                Collaborate
            </DropdownMenuItem>
        )
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Company Management</h1>
                    <p className="text-muted-foreground">View and manage all registered companies.</p>
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>HR Contact Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recruiters.length > 0 ? recruiters.map((recruiter) => (
                            <TableRow key={recruiter.uid}>
                                <TableCell className="font-medium">{recruiter.companyName}</TableCell>
                                <TableCell>{recruiter.name}</TableCell>
                                <TableCell>{recruiter.hrContact}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setCompanyToView(recruiter)}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {renderCollaborationMenuItem(recruiter)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No companies have registered yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            <CompanyDetailsDialog 
                recruiter={companyToView}
                onOpenChange={(open) => !open && setCompanyToView(null)}
            />

            <AlertDialog open={!!collabToDelete} onOpenChange={(open) => !open && setCollabToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will end your collaboration with {collabToDelete?.companyName}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCollaboration} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            End Collaboration
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    );
}
