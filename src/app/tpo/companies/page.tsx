
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { Recruiter } from "@/lib/types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function TPOCompaniesPage() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const recruitersQuery = query(collection(db, "users"), where("role", "==", "recruiter"));
        
        const unsubscribe = onSnapshot(recruitersQuery, (snapshot) => {
            const recruitersData = snapshot.docs.map(doc => doc.data() as Recruiter);
            setRecruiters(recruitersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recruiters: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                                    <Button variant="ghost" size="sm">View Details</Button>
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
        </AppLayout>
    );
}
