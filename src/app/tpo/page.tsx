
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RedirectToCollaborations() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/collaborations');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}
