import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Briefcase, FileText, Wand2, Compass, GanttChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold font-headline">All Your Career Tools in One Place</h3>
                    <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
                        From crafting the perfect resume to tracking every application, CareerCompass streamlines your job search. Focus on what matters: landing the job. Our platform offers a suite of tools designed to give you an edge in the competitive job market.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <FileText className="size-10 text-primary mb-4" />
                        <h4 className="font-bold font-headline text-lg">Resume Builder</h4>
                        <p className="text-sm text-muted-foreground mt-2">Create professional, standout resumes from a variety of customizable templates tailored to your industry.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Briefcase className="size-10 text-primary mb-4" />
                        <h4 className="font-bold font-headline text-lg">Application Tracker</h4>
                        <p className="text-sm text-muted-foreground mt-2">Visualize your job application pipeline with our Kanban-style board, and never lose track of an opportunity.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <Wand2 className="size-10 text-primary mb-4" />
                        <h4 className="font-bold font-headline text-lg">AI Skill Extractor</h4>
                        <p className="text-sm text-muted-foreground mt-2">Analyze job descriptions to identify the key skills you need, helping you tailor your resume and prepare for interviews.</p>
                    </div>
                     <div className="flex flex-col items-center text-center">
                        <GanttChart className="size-10 text-primary mb-4" />
                        <h4 className="font-bold font-headline text-lg">Placement Timeline</h4>
                        <p className="text-sm text-muted-foreground mt-2">Track your placement journey from start to finish with a clear, visual timeline of your milestones and deadlines.</p>
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
