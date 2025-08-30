import { AppLayout } from "@/components/AppLayout";
import { SkillsExtractorClient } from "@/components/skills-extractor-client";

export default function SkillsExtractorPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <SkillsExtractorClient />
      </div>
    </AppLayout>
  );
}
