
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { Resume } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Download, Edit, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResumePreview } from "@/components/ResumePreview";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ResumeViewerPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const resumeId = params.resumeId as string;
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const resumePrintRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!resumeId) return;

        const fetchResume = async () => {
            setLoading(true);
            try {
                const resumeDoc = await getDoc(doc(db, "resumes", resumeId));
                if (resumeDoc.exists()) {
                    setResume({ id: resumeDoc.id, ...resumeDoc.data() } as Resume);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Resume not found." });
                    router.push('/resumes');
                }
            } catch (error) {
                console.error("Error fetching resume:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch resume." });
            } finally {
                setLoading(false);
            }
        };

        fetchResume();
    }, [resumeId, router, toast]);

    const handleDownload = async () => {
        const element = resumePrintRef.current;
        if (!element) return;
        
        setIsDownloading(true);
        try {
            // A4 dimensions in pixels at 300 DPI: 2480 x 3508
            // We'll use a slightly smaller scale for performance
            const canvas = await html2canvas(element, { 
                scale: 2,
                width: element.offsetWidth,
                height: element.offsetHeight
            });
            const data = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resume?.title ?? 'resume'}.pdf`);
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
    
    if (!resume) {
         return (
            <AppLayout>
                <div className="text-center">
                    <p>Resume not found.</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Resumes
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/resumes/edit/${resume.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
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
                    <div className="mx-auto w-full max-w-[210mm]">
                         <ResumePreview resume={resume} ref={resumePrintRef} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
