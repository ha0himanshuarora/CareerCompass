"use client";

import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { RecruiterDashboard } from "@/components/dashboards/RecruiterDashboard";
import { TpoDashboard } from "@/components/dashboards/TpoDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { userProfile, loading } = useAuth();

    const renderDashboard = () => {
        if (!userProfile) {
            return null; // Or a fallback UI
        }
        switch (userProfile.role) {
            case 'student':
                return <StudentDashboard />;
            case 'recruiter':
                return <RecruiterDashboard />;
            case 'tpo':
                return <TpoDashboard />;
            default:
                return <div>Unknown role</div>;
        }
    };

    return (
        <AppLayout>
            {loading ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                renderDashboard()
            )}
        </AppLayout>
    );
}
