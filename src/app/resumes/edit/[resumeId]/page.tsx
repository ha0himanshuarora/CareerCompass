
"use client";

import { AppLayout } from "@/components/AppLayout";
import { ResumeForm } from "@/components/ResumeForm";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Resume } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditResumePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const resumeId = params.resumeId as string;
    const [initialData, setInitialData] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        if (!resumeId) {
            setLoading(false);
            setError("No resume ID provided.");
            return;
        };

        const fetchResume = async () => {
            setLoading(true);
            try {
                const resumeDoc = await getDoc(doc(db, "resumes", resumeId));
                if (resumeDoc.exists()) {
                    setInitialData({ id: resumeDoc.id, ...resumeDoc.data() } as Resume);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Resume not found." });
                    setError("Resume not found.");
                    router.push('/resumes');
                }
            } catch (err) {
                console.error("Error fetching resume:", err);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch resume." });
                setError("Failed to load resume data.");
            } finally {
                setLoading(false);
            }
        };

        fetchResume();
    }, [resumeId, router, toast]);

    return (
        <AppLayout>
             {loading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            {error && <div className="text-destructive text-center">{error}</div>}
            {!loading && !error && initialData && (
                <ResumeForm initialData={initialData} />
            )}
        </AppLayout>
    );
}
