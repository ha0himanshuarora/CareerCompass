
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Collaboration } from "@/lib/types";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Loader2, Check, X, Handshake, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export default function TPOCollaborationsPage() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [collabToDelete, setCollabToDelete] = useState<Collaboration | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!userProfile) return;

        setLoading(true);
        const collaborationsQuery = query(
            collection(db, "collaborations"), 
            where("tpoId", "==", userProfile.uid),
            where("initiatedBy", "==", "recruiter")
        );
        
        const unsubscribe = onSnapshot(collaborationsQuery, (snapshot) => {
            const collaborationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collaboration));
            setCollaborations(collaborationsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching collaborations: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch collaborations." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile, toast]);

    const filteredCollaborations = useMemo(() => {
        return {
            pending: collaborations.filter(c => c.status === 'pending'),
            accepted: collaborations.filter(c => c.status === 'accepted'),
            rejected: collaborations.filter(c => c.status === 'rejected'),
        }
    }, [collaborations]);

    const handleRequest = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
        try {
            const requestRef = doc(db, "collaborations", requestId);
            await updateDoc(requestRef, { status: newStatus });
            toast({
                title: "Success",
                description: `Request has been ${newStatus}.`
            });
        } catch (error) {
            console.error("Error updating request:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update the request status." });
        }
    };
    
    const handleEndCollaboration = async () => {
        if (!collabToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "collaborations", collabToDelete.id));
            toast({ title: "Collaboration Ended", description: `Collaboration with ${collabToDelete.companyName} has ended.` });
            setCollabToDelete(null);
        } catch (error) {
            console.error("Error ending collaboration:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not end the collaboration." });
        } finally {
            setIsDeleting(false);
        }
    };

    const renderTable = (data: Collaboration[], type: 'pending' | 'accepted' | 'rejected') => {
        const columns = [
            { key: 'companyName', label: 'Company Name' },
            { key: 'recruiterName', label: 'Recruiter Name' },
            type !== 'rejected' ? { key: 'actions', label: 'Actions', align: 'right' as const } : null
        ].filter(Boolean) as { key: string, label: string, align?: 'right' }[];

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map(col => <TableHead key={col.key} className={col.align === 'right' ? 'text-right' : ''}>{col.label}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.companyName}</TableCell>
                            <TableCell>{item.recruiterName}</TableCell>
                            {type === 'pending' && (
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(item.id, 'accepted')}>
                                        <Check className="mr-2 h-4 w-4" /> Accept
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleRequest(item.id, 'rejected')}>
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </TableCell>
                            )}
                            {type === 'accepted' && (
                                 <TableCell className="text-right">
                                    <Button size="sm" variant="destructive" onClick={() => setCollabToDelete(item)}>
                                        <XCircle className="mr-2 h-4 w-4" /> End Collaboration
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No {type} collaborations.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage Collaborations</h1>
                    <p className="text-muted-foreground">Manage collaboration requests and partnerships with companies.</p>
                </div>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Company Requests & Partnerships</CardTitle>
                    <CardDescription>Review requests and manage your active company collaborations.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                       <Tabs defaultValue="pending">
                           <TabsList>
                               <TabsTrigger value="pending">
                                   <Handshake className="mr-2 h-4 w-4" /> Pending ({filteredCollaborations.pending.length})
                                </TabsTrigger>
                               <TabsTrigger value="accepted">
                                   <Users className="mr-2 h-4 w-4" /> Accepted ({filteredCollaborations.accepted.length})
                                </TabsTrigger>
                               <TabsTrigger value="rejected">
                                   <X className="mr-2 h-4 w-4" /> Rejected ({filteredCollaborations.rejected.length})
                                </TabsTrigger>
                           </TabsList>
                           <TabsContent value="pending" className="mt-4">
                               {renderTable(filteredCollaborations.pending, 'pending')}
                           </TabsContent>
                           <TabsContent value="accepted" className="mt-4">
                               {renderTable(filteredCollaborations.accepted, 'accepted')}
                           </TabsContent>
                           <TabsContent value="rejected" className="mt-4">
                               {renderTable(filteredCollaborations.rejected, 'rejected')}
                           </TabsContent>
                       </Tabs>
                    )}
                </CardContent>
            </Card>

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
                    <AlertDialogAction onClick={handleEndCollaboration} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    End Collaboration
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
