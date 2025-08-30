
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Resume } from "@/lib/types";

export default function ResumesPage() {
  const { userProfile } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const resumesQuery = query(collection(db, "resumes"), where("studentId", "==", userProfile.uid));

    const unsubscribe = onSnapshot(resumesQuery, (snapshot) => {
      const resumesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
      setResumes(resumesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resumes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Resumes</h1>
          <p className="text-muted-foreground">Create and manage your professional resumes.</p>
        </div>
        <Button asChild>
          <Link href="/resumes/new">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Create New Resume
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="flex flex-col">
              <CardHeader>
                  <CardTitle className="font-headline">{resume.title}</CardTitle>
                  <CardDescription>
                    Last updated: {resume.updatedAt?.toDate().toLocaleDateString() ?? 'N/A'}
                  </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/resumes/edit/${resume.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href={`/resumes/${resume.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          <Link href="/resumes/new">
            <Card className="flex items-center justify-center border-dashed border-2 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-48 h-full">
                <div className="text-center">
                    <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold">Create New</p>
                </div>
            </Card>
          </Link>
        </div>
      )}
    </AppLayout>
  );
}
