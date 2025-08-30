
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
import { ArrowLeft, Loader2, Pencil, Trash2, Github, Linkedin, Briefcase, Award, GraduationCap, LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";

const resumeSchema = z.object({
  title: z.string().min(1, "Resume title is required."),
  template: z.enum(["onyx", "opal", "topaz"], { required_error: "Please select a template." }),
  personalInfo: z.object({
      linkedin: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
  }),
  careerObjective: z.string().min(20, "Career objective must be at least 20 characters.").max(300, "Must be 300 characters or less."),
  skills: z.string().min(1, "Please enter at least one skill."),
  projects: z.array(z.object({
    title: z.string().min(1, "Project title is required."),
    description: z.string().min(1, "Project description is required."),
    githubLink: z.string().url().optional().or(z.literal('')),
    liveLink: z.string().url().optional().or(z.literal('')),
  })).min(1, "Please add at least one project."),
  academicDetails: z.array(z.object({
      degree: z.string().min(1, "Degree is required."),
      institute: z.string().min(1, "Institute is required."),
      cgpa: z.string().min(1, "CGPA/Percentage is required."),
      year: z.string().min(1, "Year of completion is required."),
  })).min(1, "Please add at least one academic detail."),
  experience: z.array(z.object({
      company: z.string().min(1, "Required"),
      role: z.string().min(1, "Required"),
      duration: z.string().min(1, "Required"),
      description: z.string().min(1, "Required"),
  })).optional(),
  certifications: z.array(z.object({
      name: z.string().min(1, "Required"),
      issuer: z.string().min(1, "Required"),
      date: z.string().min(1, "Required"),
      link: z.string().url().optional().or(z.literal('')),
  })).optional(),
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

    const form = useForm<ResumeFormValues>({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            title: "",
            template: "onyx",
            personalInfo: { linkedin: "", github: ""},
            careerObjective: "",
            skills: "",
            projects: [{ title: "", description: "", githubLink: "", liveLink: "" }],
            academicDetails: [{ degree: "", institute: "", cgpa: "", year: "" }],
            experience: [],
            certifications: [],
        },
    });

    useEffect(() => {
        if (isEditMode) {
            form.reset({
                title: initialData.title,
                template: initialData.template,
                personalInfo: {
                    linkedin: initialData.personalInfo.linkedin || "",
                    github: initialData.personalInfo.github || "",
                },
                careerObjective: initialData.careerObjective,
                skills: initialData.skills.join(", "),
                projects: initialData.projects,
                academicDetails: initialData.academicDetails,
                experience: initialData.experience || [],
                certifications: initialData.certifications || [],
            })
        }
    }, [isEditMode, initialData, form])
    
    const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
    const { fields: academicFields, append: appendAcademic, remove: removeAcademic } = useFieldArray({ control: form.control, name: "academicDetails" });
    const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control: form.control, name: "experience" });
    const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control: form.control, name: "certifications" });


    const onSubmit = async (values: ResumeFormValues) => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
            return;
        }
        setIsLoading(true);
        try {
            const student = userProfile as Student;
            const resumeData = {
                studentId: student.uid,
                title: values.title,
                template: values.template,
                personalInfo: {
                    name: student.name,
                    email: student.email,
                    branch: student.branch,
                    passingYear: student.graduationYear,
                    mobile: "+91 9876543210", 
                    enrollment: "123456",
                    linkedin: values.personalInfo.linkedin,
                    github: values.personalInfo.github,
                },
                careerObjective: values.careerObjective,
                skills: values.skills.split(',').map(s => s.trim()).filter(Boolean),
                projects: values.projects,
                academicDetails: values.academicDetails,
                experience: values.experience || [],
                certifications: values.certifications || [],
                updatedAt: serverTimestamp(),
            };

            if (isEditMode) {
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
                            <CardDescription>{isEditMode ? "Update your resume details below." : "Fill in the details below. Your personal information is pre-filled from your profile."}</CardDescription>
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
                                                                {/* In a real app, you'd have actual image previews */}
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
                    
                    {/* Form Sections */}
                    <Card>
                        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1"><FormLabel>Name</FormLabel><Input value={userProfile.name} disabled /></div>
                           <div className="space-y-1"><FormLabel>Email</FormLabel><Input value={userProfile.email} disabled /></div>
                           <div className="space-y-1"><FormLabel>Branch</FormLabel><Input value={(userProfile as Student).branch} disabled /></div>
                           <div className="space-y-1"><FormLabel>Passing Year</FormLabel><Input value={(userProfile as Student).graduationYear} disabled /></div>
                           
                           <FormField control={form.control} name="personalInfo.linkedin" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Linkedin className="size-4"/> LinkedIn Profile URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/your-profile" {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="personalInfo.github" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Github className="size-4"/> GitHub Profile URL</FormLabel><FormControl><Input placeholder="https://github.com/your-username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Career Objective</CardTitle></CardHeader>
                        <CardContent>
                           <FormField
                                control={form.control}
                                name="careerObjective"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea placeholder="e.g., Aspiring Software Engineer with a passion for innovative technology." className="min-h-24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="skills"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea placeholder="e.g., JavaScript, React, Node.js, MongoDB" {...field} />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground">Enter your skills, separated by commas.</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase />Work Experience (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {expFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4">
                                     <div className="flex justify-end">
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeExp(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => ( <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`experience.${index}.role`} render={({ field }) => ( <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name={`experience.${index}.duration`} render={({ field }) => ( <FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} placeholder="e.g., Jan 2023 - Present" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendExp({ company: "", role: "", duration: "", description: "" })}>Add Experience</Button>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Pencil />Projects</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {projectFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                    <div className="flex justify-end absolute top-2 right-2">
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeProject(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`projects.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Project Title</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`projects.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl><Textarea {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`projects.${index}.githubLink`} render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Github className="size-4"/> GitHub Link (Optional)</FormLabel><FormControl><Input placeholder="https://github.com/user/repo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`projects.${index}.liveLink`} render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><LinkIcon className="size-4"/> Live Link (Optional)</FormLabel><FormControl><Input placeholder="https://myproject.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendProject({ title: "", description: "" })}>Add Project</Button>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><GraduationCap/>Academic Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {academicFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                     <div className="flex justify-end absolute top-2 right-2">
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeAcademic(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name={`academicDetails.${index}.degree`} render={({ field }) => ( <FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} placeholder="e.g., B.Tech" /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name={`academicDetails.${index}.institute`} render={({ field }) => ( <FormItem><FormLabel>Institute</FormLabel><FormControl><Input {...field} placeholder="e.g., XYZ University" /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name={`academicDetails.${index}.cgpa`} render={({ field }) => ( <FormItem><FormLabel>CGPA / %</FormLabel><FormControl><Input {...field} placeholder="e.g., 8.5" /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name={`academicDetails.${index}.year`} render={({ field }) => ( <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} placeholder="e.g., 2024" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendAcademic({ degree: "", institute: "", cgpa: "", year: "" })}>Add Academic Detail</Button>
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award />Certifications (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {certFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                    <div className="flex justify-end absolute top-2 right-2">
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeCert(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Certificate Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`certifications.${index}.issuer`} render={({ field }) => ( <FormItem><FormLabel>Issuing Organization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`certifications.${index}.date`} render={({ field }) => ( <FormItem><FormLabel>Date Issued</FormLabel><FormControl><Input {...field} placeholder="e.g., June 2023" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`certifications.${index}.link`} render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><LinkIcon className="size-4"/> Certificate Link (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendCert({ name: "", issuer: "", date: "", link: "" })}>Add Certification</Button>
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
