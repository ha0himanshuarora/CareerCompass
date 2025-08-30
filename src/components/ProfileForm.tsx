

"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Student } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Slider } from "./ui/slider";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  links: z.object({
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  careerObjective: z.string().optional(),
  academicRecords: z.array(z.object({
    level: z.enum(["10th", "12th", "Undergraduate", "Postgraduate"]),
    degree: z.string().min(1, "Degree is required"),
    institute: z.string().min(1, "Institute is required"),
    cgpa: z.string().min(1, "CGPA/Percentage is required"),
    year: z.string().min(4, "Year must be 4 digits"),
  })).optional(),
  skills: z.array(z.object({
      name: z.string().min(1, "Skill name is required"),
      type: z.enum(['Technical', 'Soft']),
      progress: z.coerce.number().min(0).max(100).optional(),
  })).optional(),
  experience: z.array(z.object({
      company: z.string().min(1, "Company is required"),
      role: z.string().min(1, "Role is required"),
      duration: z.string().min(1, "Duration is required"),
      description: z.string().min(1, "Description is required"),
  })).optional(),
  projects: z.array(z.object({
      title: z.string().min(1, "Project title is required"),
      description: z.string().min(1, "Description is required"),
      skillsUsed: z.string(), // comma separated
      githubLink: z.string().optional(),
      liveLink: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
      name: z.string().min(1, "Certification name is required"),
      issuer: z.string().min(1, "Issuer is required"),
      date: z.string().min(1, "Date is required"),
      link: z.string().optional(),
  })).optional(),
   jobPreferences: z.object({
        domains: z.string(), // comma separated
        locations: z.string(), // comma separated
        packageExpectation: z.string(),
    }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: Student;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        ...initialData,
        skills: initialData.skills?.map(s => ({ ...s, progress: s.progress ?? 50 })),
        projects: initialData.projects?.map(p => ({...p, skillsUsed: p.skillsUsed.join(', ')})),
        jobPreferences: {
            domains: initialData.jobPreferences?.domains.join(', ') || '',
            locations: initialData.jobPreferences?.locations.join(', ') || '',
            packageExpectation: initialData.jobPreferences?.packageExpectation || '',
        }
    }
  });
  
  const { fields: academicFields, append: appendAcademic, remove: removeAcademic } = useFieldArray({ control: form.control, name: "academicRecords" });
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "experience" });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control: form.control, name: "certifications" });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
        const dataToSave = {
            ...values,
            projects: values.projects?.map(p => ({ ...p, skillsUsed: p.skillsUsed.split(',').map(s => s.trim()) })),
            jobPreferences: {
                domains: values.jobPreferences?.domains.split(',').map(d => d.trim()) || [],
                locations: values.jobPreferences?.locations.split(',').map(l => l.trim()) || [],
                packageExpectation: values.jobPreferences?.packageExpectation || '',
            }
        };

      const userRef = doc(db, "users", initialData.uid);
      await updateDoc(userRef, dataToSave as Partial<Student>);
      toast({ title: "Success!", description: "Your profile has been updated." });
      router.push("/profile");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "An error occurred", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
        </Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
          <Card><CardHeader><CardTitle>Personal Information</CardTitle></CardHeader><CardContent className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="links.linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="links.github" render={({ field }) => (<FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="links.portfolio" render={({ field }) => (<FormItem><FormLabel>Portfolio URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Career Objective</CardTitle></CardHeader><CardContent>
             <FormField control={form.control} name="careerObjective" render={({ field }) => (<FormItem><FormControl><Textarea placeholder="A brief summary of your career goals..." {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CardContent></Card>
          
          <Card><CardHeader><CardTitle>Academic Records</CardTitle></CardHeader><CardContent className="space-y-4">
            {academicFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                    <FormField control={form.control} name={`academicRecords.${index}.level`} render={({ field }) => (<FormItem><FormLabel>Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl><SelectContent><SelectItem value="10th">10th</SelectItem><SelectItem value="12th">12th</SelectItem><SelectItem value="Undergraduate">Undergraduate</SelectItem><SelectItem value="Postgraduate">Postgraduate</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`academicRecords.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree/Exam</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`academicRecords.${index}.institute`} render={({ field }) => (<FormItem><FormLabel>Institute</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`academicRecords.${index}.cgpa`} render={({ field }) => (<FormItem><FormLabel>CGPA / Percentage</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`academicRecords.${index}.year`} render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeAcademic(index)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendAcademic({ level: 'Undergraduate', degree: '', institute: '', cgpa: '', year: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Academic Record</Button>
          </CardContent></Card>
          
          <Card><CardHeader><CardTitle>Skills</CardTitle><CardDescription>Add your skills and rate your proficiency.</CardDescription></CardHeader><CardContent className="space-y-4">
             {skillFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField control={form.control} name={`skills.${index}.name`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Skill</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`skills.${index}.type`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Technical">Technical</SelectItem><SelectItem value="Soft">Soft</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeSkill(index)} className="md:col-span-1"><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                    </div>
                     <FormField control={form.control} name={`skills.${index}.progress`} render={({ field }) => (<FormItem><FormLabel>Self-Assessed Progress ({field.value}%)</FormLabel><FormControl>
                        <Slider
                            defaultValue={[field.value || 50]}
                            max={100}
                            step={10}
                            onValueChange={(value) => field.onChange(value[0])}
                        />
                     </FormControl><FormMessage /></FormItem>)} />
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendSkill({ name: '', type: 'Technical', progress: 50 })}><PlusCircle className="mr-2 h-4 w-4"/>Add Skill</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Work Experience</CardTitle></CardHeader><CardContent className="space-y-4">
             {experienceFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                    <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`experience.${index}.role`} render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`experience.${index}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., Jan 2022 - Dec 2022" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeExperience(index)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({ company: '', role: '', duration: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Experience</Button>
          </CardContent></Card>

           <Card><CardHeader><CardTitle>Projects</CardTitle></CardHeader><CardContent className="space-y-4">
             {projectFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4">
                    <FormField control={form.control} name={`projects.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`projects.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`projects.${index}.skillsUsed`} render={({ field }) => (<FormItem><FormLabel>Skills Used (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`projects.${index}.githubLink`} render={({ field }) => (<FormItem><FormLabel>GitHub Link</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`projects.${index}.liveLink`} render={({ field }) => (<FormItem><FormLabel>Live Link</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeProject(index)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendProject({ title: '', description: '', skillsUsed: ''})}><PlusCircle className="mr-2 h-4 w-4"/>Add Project</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Certifications</CardTitle></CardHeader><CardContent className="space-y-4">
             {certFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4">
                    <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`certifications.${index}.issuer`} render={({ field }) => (<FormItem><FormLabel>Issuer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`certifications.${index}.date`} render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`certifications.${index}.link`} render={({ field }) => (<FormItem><FormLabel>Credential Link</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeCert(index)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendCert({ name: '', issuer: '', date: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Certification</Button>
          </CardContent></Card>

            <Card><CardHeader><CardTitle>Job Preferences</CardTitle></CardHeader><CardContent className="space-y-4">
                <FormField control={form.control} name="jobPreferences.domains" render={({ field }) => (<FormItem><FormLabel>Preferred Domains (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="jobPreferences.locations" render={({ field }) => (<FormItem><FormLabel>Preferred Locations (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="jobPreferences.packageExpectation" render={({ field }) => (<FormItem><FormLabel>Package Expectation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent></Card>


          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
