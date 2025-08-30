import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Briefcase, FileText, Wand2, Compass, GanttChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Compass className="text-primary" size={28} />
          <h1 className="text-2xl font-bold font-headline">CareerCompass</h1>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h2 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
            Navigate Your Career Path with Confidence
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            CareerCompass is your all-in-one platform for resume building, job tracking, and skill development, designed to guide students to their dream careers.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Get Started <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-white/50 dark:bg-black/10 py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-3xl font-bold font-headline">All Your Career Tools in One Place</h3>
                        <p className="mt-4 text-muted-foreground">
                            From crafting the perfect resume to tracking every application, CareerCompass streamlines your job search. Focus on what matters: landing the job.
                        </p>
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <FileText className="size-8 text-primary shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold font-headline">Resume Builder</h4>
                                    <p className="text-sm text-muted-foreground">Create professional resumes from templates.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Briefcase className="size-8 text-primary shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold font-headline">Application Tracker</h4>
                                    <p className="text-sm text-muted-foreground">Visualize your job application pipeline.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Wand2 className="size-8 text-primary shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold font-headline">AI Skill Extractor</h4>
                                    <p className="text-sm text-muted-foreground">Analyze job descriptions for key skills.</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-4">
                                <GanttChart className="size-8 text-primary shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold font-headline">Placement Timeline</h4>
                                    <p className="text-sm text-muted-foreground">Track your placement journey milestones.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="relative h-80 rounded-xl overflow-hidden shadow-2xl">
                         <Image src="https://picsum.photos/600/400" alt="Student using laptop" data-ai-hint="career planning" fill className="object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} CareerCompass. All rights reserved.</p>
      </footer>
    </div>
  );
}
