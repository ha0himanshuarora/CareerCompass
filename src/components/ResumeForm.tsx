
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Resume, Student } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, Pencil, Trash2, Github, Linkedin, Briefcase, Award, GraduationCap, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { Checkbox } from "./ui/checkbox";

const resumeSchema = z.object({
  title: z.string().min(1, "Resume title is required."),
  template: z.enum(["onyx", "opal", "topaz"], { required_error: "Please select a template." }),
  
  // Selections from profile
  selectedSkills: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  selectedExperience: z.array(z.string()).optional(),
  selectedCerts: z.array(z.string()).optional(),
  selectedAcademics: z.array(z.string()).optional(),
});

type ResumeFormValues = z.infer<typeof resumeSchema>;

const templates = [
    { id: "onyx", name: "Onyx", image: "/templates/onyx.png" },
    { id: "opal", name: "Opal", image: "/templates/opal.png" },
    { id: "topaz", name: "Topaz", image: "/templates/topaz.png" },
] as const;

interface ResumeFormProps {
    initialData?: Resume | null;
}

export function ResumeForm({ initialData = null }: ResumeFormProps) {
    const router = useRouter();
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!initialData;
    const student = userProfile as Student | null;

    const form = useForm<ResumeFormValues>({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            title: "",
            template: "onyx",
            selectedSkills: [],
            selectedProjects: [],
            selectedExperience: [],
            selectedCerts: [],
            selectedAcademics: [],
        },
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            form.reset({
                title: initialData.title,
                template: initialData.template,
                // In edit mode, we can pre-select items that were saved with the resume
                selectedSkills: initialData.skills.map(s => s.name),
                selectedProjects: initialData.projects.map(p => p.title),
                selectedExperience: initialData.experience?.map(e => e.company) || [],
                selectedCerts: initialData.certifications?.map(c => c.name) || [],
                selectedAcademics: initialData.academicDetails.map(a => a.degree),
            })
        } else if (student) {
            // For a new resume, pre-select everything by default
            form.reset({
                title: "",
                template: "onyx",
                selectedSkills: student.skills?.map(s => s.name) || [],
                selectedProjects: student.projects?.map(p => p.title) || [],
                selectedExperience: student.experience?.map(e => e.company) || [],
                selectedCerts: student.certifications?.map(c => c.name) || [],
                selectedAcademics: student.academicRecords?.map(a => a.degree) || [],
            });
        }
    }, [isEditMode, initialData, form, student])
    
    const onSubmit = async (values: ResumeFormValues) => {
        if (!student) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        setIsLoading(true);
        try {
            const resumeData = {
                studentId: student.uid,
                title: values.title,
                template: values.template,
                personalInfo: {
                    name: student.name,
                    email: student.email,
                    phone: student.phone || "",
                    branch: student.branch,
                    ...student.links
                },
                careerObjective: student.careerObjective,
                // Filter profile data based on user's selection
                skills: student.skills?.filter(s => values.selectedSkills?.includes(s.name)) || [],
                projects: student.projects?.filter(p => values.selectedProjects?.includes(p.title)) || [],
                experience: student.experience?.filter(e => values.selectedExperience?.includes(e.company)) || [],
                certifications: student.certifications?.filter(c => values.selectedCerts?.includes(c.name)) || [],
                academicDetails: student.academicRecords?.filter(a => values.selectedAcademics?.includes(a.degree)) || [],
                updatedAt: serverTimestamp(),
            };

            if (isEditMode && initialData) {
                const resumeRef = doc(db, "resumes", initialData.id);
                await updateDoc(resumeRef, resumeData);
                toast({ title: "Success", description: "Your resume has been updated." });
                router.push(`/resumes/${initialData.id}`);
            } else {
                 const docRef = await addDoc(collection(db, "resumes"), {
                    ...resumeData,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Your resume has been created." });
                router.push(`/resumes/${docRef.id}`);
            }
        } catch (error) {
            console.error("Error saving resume:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save your resume." });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!userProfile) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
    
    const renderCheckboxList = (profileItems: any[], fieldName: keyof ResumeFormValues, titleKey: string) => {
        if (!profileItems || profileItems.length === 0) return <p className="text-sm text-muted-foreground">No {fieldName.toString().replace('selected', '').toLowerCase()} found in your profile. <Button type="button" variant="link" size="sm" onClick={() => router.push('/profile/edit')}>Add them here.</Button></p>;
        
        return (
            <FormField
              control={form.control}
              name={fieldName as any}
              render={({ field }) => (
                <FormItem>
                  {profileItems.map((item) => (
                    <FormField
                      key={item[titleKey]}
                      control={form.control}
                      name={fieldName as any}
                      render={({ field }) => {
                        return (
                          <FormItem key={item[titleKey]} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item[titleKey])}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item[titleKey]])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item[titleKey]
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item[titleKey]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
        )
    };


    return (
         <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                         <CardHeader>
                            <CardTitle className="text-2xl font-headline flex items-center gap-2">
                                <Pencil />
                                {isEditMode ? "Edit Your Resume" : "Create Your Resume"}
                            </CardTitle>
                            <CardDescription>
                                {isEditMode 
                                    ? "Update your resume title, template, and content."
                                    : "Your professional data is fetched from your profile. Select the items you want to include in this version of the resume."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resume Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., My Software Engineer Resume" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="template"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select a Template</FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {templates.map(template => (
                                                    <div key={template.id} onClick={() => field.onChange(template.id)} className="cursor-pointer">
                                                        <div className={`border-2 rounded-lg p-1 transition-all ${field.value === template.id ? 'border-primary' : 'border-transparent'}`}>
                                                            <div className="aspect-[3/4] bg-muted rounded-md flex items-center justify-center">
                                                                <p className="text-muted-foreground">{template.name}</p>
                                                            </div>
                                                        </div>
                                                        <p className={`text-center text-sm font-medium mt-2 ${field.value === template.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                            {template.name}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                          <CardTitle>Select Content</CardTitle>
                          <CardDescription>Choose which items from your profile to include in this resume.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div>
                            <h3 className="font-semibold mb-2">Skills</h3>
                            {renderCheckboxList(student?.skills || [], 'selectedSkills', 'name')}
                           </div>
                           <div>
                            <h3 className="font-semibold mb-2">Projects</h3>
                            {renderCheckboxList(student?.projects || [], 'selectedProjects', 'title')}
                           </div>
                           <div>
                            <h3 className="font-semibold mb-2">Experience</h3>
                             {renderCheckboxList(student?.experience || [], 'selectedExperience', 'company')}
                           </div>
                            <div>
                            <h3 className="font-semibold mb-2">Certifications</h3>
                            {renderCheckboxList(student?.certifications || [], 'selectedCerts', 'name')}
                           </div>
                           <div>
                            <h3 className="font-semibold mb-2">Academic Records</h3>
                            {renderCheckboxList(student?.academicRecords || [], 'selectedAcademics', 'degree')}
                           </div>
                        </CardContent>
                    </Card>
                  
                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Save Changes" : "Create Resume"}
                        </Button>
                    </div>
                </form>
            </Form>
         </div>
    )
}
