
import { AppLayout } from "@/components/AppLayout";

export default function CandidatesPage() {
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Candidates</h1>
          <p className="text-muted-foreground">Browse and manage applicants for your job postings.</p>
        </div>
      </div>
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <p>Candidate management interface will be here.</p>
      </div>
    </AppLayout>
  );
}
