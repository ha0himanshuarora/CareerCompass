
"use client";

import { AppLayout } from "@/components/AppLayout";
import { ProfileForm } from "@/components/ProfileForm";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function EditProfilePage() {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }
    
    if (!userProfile) {
        return (
            <AppLayout>
                <div>User profile not found.</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
           <ProfileForm initialData={userProfile} />
        </AppLayout>
    );
}
