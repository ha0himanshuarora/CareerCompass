import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const resumes = [
  { id: 1, title: "Software Engineer Resume", template: "Modern", lastUpdated: "2 days ago", previewUrl: "https://picsum.photos/400/566?random=1" },
  { id: 2, title: "Data Analyst CV", template: "Classic", lastUpdated: "1 week ago", previewUrl: "https://picsum.photos/400/566?random=2" },
  { id: 3, title: "UX Designer Portfolio Resume", template: "Creative", lastUpdated: "3 weeks ago", previewUrl: "https://picsum.photos/400/566?random=3" },
];

export default function ResumesPage() {
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Resumes</h1>
          <p className="text-muted-foreground">Create and manage your professional resumes.</p>
        </div>
        <Button>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Create New Resume
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resumes.map((resume) => (
          <Card key={resume.id} className="group overflow-hidden">
            <CardHeader className="p-0">
               <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={resume.previewUrl} data-ai-hint="resume document" alt={resume.title} fill className="object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               </div>
            </CardHeader>
            <CardContent className="p-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-headline">{resume.title}</CardTitle>
                        <CardDescription className="text-xs">Last updated: {resume.lastUpdated}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
            </CardContent>
          </Card>
        ))}
         <Card className="flex items-center justify-center border-dashed border-2 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-80">
            <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Create New</p>
            </div>
        </Card>
      </div>
    </AppLayout>
  );
}
