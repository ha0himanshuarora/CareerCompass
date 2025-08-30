
"use client";

import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Student } from "@/lib/types";
import { Award, Briefcase, Calendar, Edit, FileText, Github, GraduationCap, Linkedin, Loader2, Mail, MapPin, Phone, User as UserIcon, Wand2 } from "lucide-react";
import Link from "next/link";
import { SkillAnalytics } from "@/components/SkillAnalytics";

function StudentProfile() {
    const { userProfile } = useAuth();
    const student = userProfile as Student;

    if (!student) {
        return <Loader2 className="animate-spin" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl font-headline">{student.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">{student.email}</CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/profile/edit">
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-4">
                        {student.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{student.phone}</span></div>}
                        {student.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{student.address}</span></div>}
                        {student.links?.linkedin && <a href={student.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Linkedin className="h-4 w-4 text-muted-foreground" /> <span>LinkedIn</span></a>}
                        {student.links?.github && <a href={student.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Github className="h-4 w-4 text-muted-foreground" /> <span>GitHub</span></a>}
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Career Objective</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">
                        {student.careerObjective || "No career objective provided."}
                    </p>
                </CardContent>
            </Card>

            {student.skills && <SkillAnalytics skills={student.skills} />}
            
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Academic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {student.academicRecords?.map((record, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{record.degree} - {record.institute}</h3>
                                <Badge variant="secondary">{record.level}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 mt-1">
                                <span>Year: {record.year}</span>
                                <span>CGPA/Percentage: {record.cgpa}</span>
                            </div>
                        </div>
                    ))}
                     {(!student.academicRecords || student.academicRecords.length === 0) && (
                         <p className="text-sm text-muted-foreground">No academic records added yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Work Experience</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {student.experience?.map((exp, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">{exp.role} at {exp.company}</h3>
                                <span className="text-sm text-muted-foreground">{exp.duration}</span>
                            </div>
                            <p className="text-sm text-muted-foreground my-1">{exp.description}</p>
                        </div>
                    ))}
                    {(!student.experience || student.experience.length === 0) && (
                         <p className="text-sm text-muted-foreground">No work experience added yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Projects</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {student.projects?.map((project, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-md">
                            <h3 className="font-semibold">{project.title}</h3>
                            <p className="text-sm text-muted-foreground my-1">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {project.skillsUsed?.map(skill => <Badge variant="outline" key={skill}>{skill}</Badge>)}
                            </div>
                        </div>
                    ))}
                     {(!student.projects || student.projects.length === 0) && (
                         <p className="text-sm text-muted-foreground">No projects added yet.</p>
                    )}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Achievements & Certifications</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                     {student.certifications?.map((cert, index) => (
                        <p key={index} className="text-sm">
                            <span className="font-semibold">{cert.name}</span>
                            <span className="text-muted-foreground"> from {cert.issuer} ({cert.date})</span>
                        </p>
                    ))}
                     {(!student.certifications || student.certifications.length === 0) && (
                         <p className="text-sm text-muted-foreground">No certifications added yet.</p>
                    )}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Job Preferences</CardTitle></CardHeader>
                <CardContent>
                    {student.jobPreferences && (student.jobPreferences.domains.length > 0 || student.jobPreferences.locations.length > 0 || student.jobPreferences.packageExpectation) ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div><span className="font-semibold">Domains:</span> {student.jobPreferences?.domains.join(', ')}</div>
                            <div><span className="font-semibold">Locations:</span> {student.jobPreferences?.locations.join(', ')}</div>
                            <div><span className="font-semibold">Expected Salary:</span> {student.jobPreferences?.packageExpectation}</div>
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground">No job preferences set yet.</p>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}


export default function ProfilePage() {
    const { userProfile, loading } = useAuth();

    const renderProfile = () => {
        if (!userProfile) {
            return <div>User profile not found.</div>;
        }

        switch (userProfile.role) {
            case 'student':
                return <StudentProfile />;
            // Add cases for 'recruiter' and 'tpo' here in the future
            default:
                return <div>Profile page for this role is not yet implemented.</div>;
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                        <p className="text-muted-foreground">View and manage your personal and professional information.</p>
                    </div>
                </div>
                {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : renderProfile()}
            </div>
        </AppLayout>
    );
}
