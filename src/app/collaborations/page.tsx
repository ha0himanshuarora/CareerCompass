

"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Collaboration, Recruiter, TPO } from "@/lib/types";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Check, X, Handshake, Users, XCircle, School, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";

function ManageRequestsTab() {
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
            where("recruiterId", "==", userProfile.uid),
            where("initiatedBy", "==", "tpo")
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
            toast({ title: "Collaboration Ended", description: `Collaboration with ${collabToDelete.instituteName} has ended.` });
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
            { key: 'instituteName', label: 'Institute Name' },
            { key: 'tpoName', label: 'TPO Name' },
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
                            <TableCell className="font-medium">{item.instituteName}</TableCell>
                            <TableCell>{item.tpoName}</TableCell>
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
        <>
            <Card>
                <CardHeader>
                    <CardTitle>TPO Requests & Partnerships</CardTitle>
                    <CardDescription>Review requests and manage your active institute collaborations.</CardDescription>
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
                                   <School className="mr-2 h-4 w-4" /> Accepted ({filteredCollaborations.accepted.length})
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
                    This will end your collaboration with {collabToDelete?.instituteName}. This action cannot be undone.
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
        </>
    )
}

function FindTposTab() {
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const [tpos, setTpos] = useState<TPO[]>([]);
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [collabToDelete, setCollabToDelete] = useState<Collaboration | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const tposQuery = query(collection(db, "users"), where("role", "==", "tpo"));
        const unsubTpos = onSnapshot(tposQuery, (snapshot) => {
            setTpos(snapshot.docs.map(doc => doc.data() as TPO));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching TPOs: ", error);
            setLoading(false);
        });

        let unsubCollabs = () => {};
        if (userProfile) {
            const collabsQuery = query(collection(db, "collaborations"), where("recruiterId", "==", userProfile.uid));
            unsubCollabs = onSnapshot(collabsQuery, (snapshot) => {
                setCollaborations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collaboration)));
            });
        }
        
        return () => {
            unsubTpos();
            unsubCollabs();
        };

    }, [userProfile]);

    const collaborationMap = useMemo(() => {
        const map = new Map<string, Collaboration>();
        collaborations.forEach(c => map.set(c.tpoId, c));
        return map;
    }, [collaborations]);

    const filteredTpos = useMemo(() => {
        if (!searchTerm) return tpos;
        return tpos.filter(tpo => 
            tpo.instituteName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tpos, searchTerm]);

    const handleCollaborationRequest = async (tpo: TPO, existingCollab?: Collaboration) => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        setIsSubmitting(tpo.uid);
        try {
            if (existingCollab) {
                // Update existing 'rejected' request to 'pending'
                const collabRef = doc(db, "collaborations", existingCollab.id);
                await updateDoc(collabRef, {
                    status: 'pending',
                    requestedAt: serverTimestamp(),
                    initiatedBy: 'recruiter',
                });
            } else {
                // Add new collaboration request
                await addDoc(collection(db, "collaborations"), {
                    recruiterId: userProfile.uid,
                    recruiterName: userProfile.name,
                    companyName: (userProfile as Recruiter).companyName,
                    tpoId: tpo.uid,
                    tpoName: tpo.name,
                    instituteName: tpo.instituteName,
                    status: 'pending',
                    requestedAt: serverTimestamp(),
                    initiatedBy: 'recruiter',
                });
            }
            toast({
                title: "Request Sent!",
                description: `Your collaboration request to ${tpo.instituteName} has been sent.`,
            });
        } catch (error) {
            console.error("Error sending request:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not send collaboration request." });
        } finally {
            setIsSubmitting(null);
        }
    };
    
    const handleEndCollaboration = async () => {
        if (!collabToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "collaborations", collabToDelete.id));
            toast({ title: "Collaboration Ended", description: `Your collaboration with ${collabToDelete.instituteName} has ended.` });
            setCollabToDelete(null);
        } catch (error) {
            console.error("Error ending collaboration:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not end the collaboration." });
        } finally {
            setIsDeleting(false);
        }
    };


    const renderCollaborationButton = (tpo: TPO) => {
        const collaboration = collaborationMap.get(tpo.uid);
        const isLoading = isSubmitting === tpo.uid;

        if (collaboration) {
            switch (collaboration.status) {
                case 'pending':
                    return <Button className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Request Sent</Button>
                case 'accepted':
                    return <Button className="w-full" variant="destructive" onClick={() => setCollabToDelete(collaboration)}><XCircle className="mr-2 h-4 w-4" />End Collaboration</Button>
                case 'rejected':
                     return (
                        <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleCollaborationRequest(tpo, collaboration)}
                            disabled={isLoading}
                        >
                            {isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Handshake className="mr-2 h-4 w-4" /> )}
                            Request Again
                        </Button>
                     )
            }
        }
        
        return (
            <Button 
                className="w-full" 
                onClick={() => handleCollaborationRequest(tpo)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Handshake className="mr-2 h-4 w-4" />
                )}
                Collaborate
            </Button>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Find Placement Officers</CardTitle>
                    <CardDescription>Collaborate with colleges to find the best talent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by institute name..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTpos.length > 0 ? filteredTpos.map((tpo) => (
                                <Card key={tpo.uid}>
                                    <CardHeader>
                                        <CardTitle>{tpo.instituteName}</CardTitle>
                                        <CardDescription>{tpo.name}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {renderCollaborationButton(tpo)}
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center col-span-full py-12">
                                    <p className="text-muted-foreground">No TPOs found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!collabToDelete} onOpenChange={(open) => !open && setCollabToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will end your collaboration with {collabToDelete?.instituteName}. This action cannot be undone.
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
        </>
    );
}

export default function RecruiterCollaborationsPage() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage TPO Collaborations</h1>
                    <p className="text-muted-foreground">Manage collaboration requests from Training & Placement Officers.</p>
                </div>
            </div>
            
             <Tabs defaultValue="requests">
                <TabsList className="mb-4">
                    <TabsTrigger value="requests">Manage Requests</TabsTrigger>
                    <TabsTrigger value="find">Find TPOs</TabsTrigger>
                </TabsList>
                <TabsContent value="requests">
                    <ManageRequestsTab />
                </TabsContent>
                <TabsContent value="find">
                    <FindTposTab />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
