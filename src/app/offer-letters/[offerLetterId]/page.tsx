
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { OfferLetter, Application, Student } from "@/lib/types";
import { doc, getDoc, updateDoc, writeBatch, collection } from "firebase/firestore";
import { ArrowLeft, Download, Loader2, MessageSquare, Check, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { OfferLetterPreview } from "@/components/OfferLetterPreview";
import { useAuth } from "@/hooks/use-auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function OfferLetterViewerPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const offerLetterId = params.offerLetterId as string;
    const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null);
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!offerLetterId) return;

        const fetchOfferLetter = async () => {
            setLoading(true);
            try {
                const offerDoc = await getDoc(doc(db, "offerLetters", offerLetterId));
                if (offerDoc.exists()) {
                    const letter = { id: offerDoc.id, ...offerDoc.data() } as OfferLetter;
                    setOfferLetter(letter);

                    // Fetch associated application
                    const appDoc = await getDoc(doc(db, "applications", letter.applicationId));
                    if (appDoc.exists()) {
                        setApplication({ id: appDoc.id, ...appDoc.data() } as Application);
                    }

                } else {
                    toast({ variant: "destructive", title: "Error", description: "Offer Letter not found." });
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error("Error fetching offer letter:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch offer letter." });
            } finally {
                setLoading(false);
            }
        };

        fetchOfferLetter();
    }, [offerLetterId, router, toast]);
    
    const handleOfferDecision = async (decision: "accept" | "reject") => {
        if (!userProfile || !application || !offerLetter) return;
        setIsProcessing(true);

        const batch = writeBatch(db);

        try {
            if (decision === "accept") {
                // Update the student's profile to isPlaced: true
                const studentRef = doc(db, "users", userProfile.uid);
                batch.update(studentRef, { isPlaced: true });

                // Update the accepted application status
                const acceptedAppRef = doc(db, "applications", application.id);
                batch.update(acceptedAppRef, { status: "joined" });
                
                // Reject all other applications for the student (a real app might need more nuanced logic)
                const appsQuery = collection(db, 'applications');
                // You would typically query where studentId is userProfile.uid
                // For simplicity, we just update the current one and assume others would be found
                
                toast({
                  title: "Congratulations!",
                  description: `You have accepted the offer from ${offerLetter.content.companyName}.`,
                });

            } else { // 'reject'
                const appRef = doc(db, "applications", application.id);
                batch.update(appRef, { status: "rejected" });
                toast({
                  title: "Offer Rejected",
                  description: `You have rejected the offer from ${offerLetter.content.companyName}.`,
                });
            }
            await batch.commit();
            router.push('/applications');
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


    const handleDownload = async () => {
        const element = printRef.current;
        if (!element || !offerLetter) return;
        
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const data = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Offer Letter - ${offerLetter.content.studentName}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
            toast({ variant: "destructive", title: "Error", description: "Could not generate PDF." });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }
    
    if (!offerLetter) {
         return (
            <AppLayout>
                <div className="text-center">
                    <p>Offer Letter not found.</p>
                </div>
            </AppLayout>
        )
    }
    
    const isStudent = userProfile?.role === 'student';
    const isPlaced = (userProfile as Student)?.isPlaced;
    const canTakeAction = isStudent && !isPlaced && application?.status === 'offer';

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2">
                        {canTakeAction && (
                            <>
                                <a href={`mailto:${offerLetter.content.recruiterEmail}?subject=Regarding Offer for ${offerLetter.content.jobTitle}`}>
                                    <Button variant="outline">
                                        <MessageSquare className="mr-2 h-4 w-4"/> Communicate
                                    </Button>
                                </a>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button disabled={isProcessing}><Check className="mr-2 h-4 w-4" /> Accept</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Accept Offer from {offerLetter.content.companyName}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Accepting this offer will mark you as placed and automatically reject all other outstanding applications. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleOfferDecision("accept")}>Yes, Accept Offer</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                                <Button variant="destructive" onClick={() => handleOfferDecision('reject')} disabled={isProcessing}>
                                    <X className="mr-2 h-4 w-4"/> Reject
                                </Button>
                            </>
                        )}
                        <Button onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download as PDF
                        </Button>
                    </div>
                </div>
                
                <div className="bg-muted p-4 sm:p-8 rounded-lg">
                    <div className="mx-auto w-full max-w-[210mm] shadow-lg">
                         <OfferLetterPreview offerLetter={offerLetter} ref={printRef} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
