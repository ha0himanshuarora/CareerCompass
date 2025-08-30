
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
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { OfferLetter } from "@/lib/types";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Loader2, Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

export default function OfferLettersPage() {
  const { userProfile } = useAuth();
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);
    const lettersQuery = query(
      collection(db, "offerLetters"),
      where("recruiterId", "==", userProfile.uid)
    );

    const unsubscribe = onSnapshot(lettersQuery, (snapshot) => {
      const letters = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as OfferLetter)
      );
      setOfferLetters(letters.sort((a, b) => b.issuedAt.toDate() - a.issuedAt.toDate()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);


  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Generated Offer Letters</h1>
          <p className="text-muted-foreground">
            View and manage all the offer letters you have issued.
          </p>
        </div>
      </div>

      {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : offerLetters.length > 0 ? (
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Issued On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {offerLetters.map((letter) => (
                <TableRow key={letter.id}>
                    <TableCell className="font-medium">
                    {letter.content.studentName}
                    </TableCell>
                    <TableCell>{letter.content.jobTitle}</TableCell>
                    <TableCell>
                    {letter.issuedAt
                        ? format(letter.issuedAt.toDate(), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/offer-letters/${letter.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">You haven't generated any offer letters yet.</p>
        </div>
      )}
    </AppLayout>
  );
}
