
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Collaboration, TPO, Recruiter } from "@/lib/types";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Loader2, Search, Handshake, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
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

export default function FindTPOsPage() {
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

    const handleCollaborationRequest = async (tpo: TPO) => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        setIsSubmitting(tpo.uid);
        try {
            await addDoc(collection(db, "collaborations"), {
                recruiterId: userProfile.uid,
                recruiterName: userProfile.name,
                companyName: (userProfile as Recruiter).companyName,
                tpoId: tpo.uid,
                tpoName: tpo.name,
                instituteName: tpo.instituteName,
                status: 'pending',
                requestedAt: serverTimestamp(),
            });
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

        if (collaboration) {
            switch (collaboration.status) {
                case 'pending':
                    return <Button className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Request Sent</Button>
                case 'accepted':
                    return <Button className="w-full" variant="outline" onClick={() => setCollabToDelete(collaboration)}><XCircle className="mr-2 h-4 w-4" />End Collaboration</Button>
                case 'rejected':
                     return <Button className="w-full" disabled variant="destructive">Request Rejected</Button>
            }
        }
        
        return (
            <Button 
                className="w-full" 
                onClick={() => handleCollaborationRequest(tpo)}
                disabled={isSubmitting === tpo.uid}
            >
                {isSubmitting === tpo.uid ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Handshake className="mr-2 h-4 w-4" />
                )}
                Collaborate
            </Button>
        );
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Find Placement Officers</h1>
                    <p className="text-muted-foreground">Collaborate with colleges to find the best talent.</p>
                </div>
            </div>
            
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
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
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
        </AppLayout>
    );
}
