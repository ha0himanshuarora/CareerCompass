
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building, Briefcase, Users, Loader2, CheckCircle2 } from "lucide-react";
import type { Student } from "@/lib/types";

interface SummaryCard {
  title: string;
  value: number;
  icon: React.ElementType;
}

export function TpoDashboard() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([
        { title: "Total Students", value: 0, icon: Users },
        { title: "Registered Companies", value: 0, icon: Building },
        { title: "Active Job Postings", value: 0, icon: Briefcase },
        { title: "Total Placed", value: 0, icon: CheckCircle2 },
    ]);

  useEffect(() => {
    if (!userProfile) return;

    const instituteName = userProfile.instituteName;

    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("instituteName", "==", instituteName));
    const companiesQuery = query(collection(db, "users"), where("role", "==", "recruiter"));
    const jobsQuery = query(collection(db, "jobs"), where("status", "==", "open"));

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
        const students = snapshot.docs.map(doc => doc.data() as Student);
        const placedCount = students.filter(s => s.isPlaced).length;
        updateSummaryCard("Total Students", snapshot.size);
        updateSummaryCard("Total Placed", placedCount);
    });

    const unsubCompanies = onSnapshot(companiesQuery, (snapshot) => {
      updateSummaryCard("Registered Companies", snapshot.size);
    });

    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      updateSummaryCard("Active Job Postings", snapshot.size);
    });
    
    setLoading(false);

    return () => {
      unsubStudents();
      unsubCompanies();
      unsubJobs();
    };

  }, [userProfile]);
  
  const updateSummaryCard = (title: string, value: number) => {
    setSummaryCards(prevCards => 
      prevCards.map(card => 
        card.title === title ? { ...card, value } : card
      )
    );
  };
  
  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.name ?? 'TPO'}!</h1>
            <p className="text-muted-foreground">Here's an overview of your institute's placement activities.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => (
                <Card key={index} className="shadow-lg rounded-xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Placement Analytics</CardTitle>
                <CardDescription>Visual representation of placement data will be here.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p>Charts and graphs will be displayed here in a future update.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
