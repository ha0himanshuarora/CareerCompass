
"use client";

import { Resume } from "@/lib/types";
import React from "react";
import { Mail, Phone, Linkedin, Github, Globe, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Template Components
const OnyxTemplate = ({ resume }: { resume: Resume }) => (
    <div className="bg-white text-[#333] p-8 font-[Calibri]">
        <header className="text-center mb-6">
            <h1 className="text-4xl font-bold tracking-wider uppercase">{resume.personalInfo.name}</h1>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                <a href={`mailto:${resume.personalInfo.email}`} className="flex items-center gap-1.5 hover:text-blue-600"><Mail className="size-3"/>{resume.personalInfo.email}</a>
                <span className="flex items-center gap-1.5"><Phone className="size-3"/>{resume.personalInfo.mobile}</span>
                {resume.personalInfo.linkedin && <a href={resume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600"><Linkedin className="size-3"/>LinkedIn</a>}
                {resume.personalInfo.github && <a href={resume.personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600"><Github className="size-3"/>GitHub</a>}
            </div>
        </header>

        <main className="space-y-5">
            <section>
                <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Career Objective</h2>
                <p className="text-sm leading-relaxed">{resume.careerObjective}</p>
            </section>
            
            <section>
                <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Education</h2>
                {resume.academicDetails.map((ad, i) => (
                    <div key={i} className="text-sm mb-2">
                        <div className="flex justify-between">
                            <p className="font-bold">{ad.institute}</p>
                            <p className="font-bold">{ad.year}</p>
                        </div>
                         <div className="flex justify-between">
                            <p>{ad.degree}</p>
                            <p>CGPA: {ad.cgpa}</p>
                        </div>
                    </div>
                ))}
            </section>
            
            {resume.experience && resume.experience.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Experience</h2>
                    {resume.experience.map((ex, i) => (
                        <div key={i} className="text-sm mb-2">
                            <div className="flex justify-between">
                                <h3 className="font-bold">{ex.company}</h3>
                                <p className="text-xs">{ex.duration}</p>
                            </div>
                            <p className="italic text-xs mb-1">{ex.role}</p>
                            <p className="text-xs leading-relaxed">{ex.description}</p>
                        </div>
                    ))}
                </section>
            )}

            <section>
                <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Skills</h2>
                <p className="text-sm leading-relaxed">{resume.skills.join(' | ')}</p>
            </section>
            
            <section>
                <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Projects</h2>
                {resume.projects.map((p, i) => (
                    <div key={i} className="text-sm mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold">{p.title}</h3>
                             {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600"><Github className="size-3"/></a>}
                            {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600"><Globe className="size-3"/></a>}
                        </div>
                        <p className="text-xs leading-relaxed">{p.description}</p>
                    </div>
                ))}
            </section>

             {resume.certifications && resume.certifications.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b-2 border-gray-300 pb-1 mb-2">Certifications</h2>
                    {resume.certifications.map((cert, i) => (
                        <div key={i} className="text-sm mb-1">
                           <p>
                                <span className="font-bold">{cert.name}</span> from {cert.issuer} ({cert.date})
                                {cert.link && <a href={cert.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline"><LinkIcon className="inline size-3"/></a>}
                            </p>
                        </div>
                    ))}
                </section>
            )}
        </main>
    </div>
);

const OpalTemplate = ({ resume }: { resume: Resume }) => (
    <div className="bg-white text-gray-800 p-8 font-[Garamond] flex gap-8">
        <aside className="w-1/3 bg-gray-100 p-4">
             <h1 className="text-3xl font-bold text-gray-900">{resume.personalInfo.name}</h1>
             <p className="text-lg text-gray-700">{resume.personalInfo.branch}</p>

            <div className="mt-6 space-y-3 text-xs">
                 <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Contact</h2>
                 <a href={`mailto:${resume.personalInfo.email}`} className="flex items-center gap-2 hover:text-cyan-700"><Mail className="size-3"/>{resume.personalInfo.email}</a>
                 <p className="flex items-center gap-2"><Phone className="size-3"/>{resume.personalInfo.mobile}</p>
                 {resume.personalInfo.linkedin && <a href={resume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan-700"><Linkedin className="size-3"/>LinkedIn</a>}
                 {resume.personalInfo.github && <a href={resume.personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan-700"><Github className="size-3"/>GitHub</a>}
            </div>

            <div className="mt-6 space-y-2 text-xs">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Skills</h2>
                {resume.skills.map(s => <p key={s}>{s}</p>)}
            </div>

             <div className="mt-6 space-y-2 text-xs">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Education</h2>
                {resume.academicDetails.map((ad, i) => (
                    <div key={i}>
                        <p className="font-bold">{ad.degree}</p>
                        <p>{ad.institute}</p>
                        <p>{ad.year} - {ad.cgpa} CGPA</p>
                    </div>
                ))}
            </div>
        </aside>

        <main className="w-2/3">
             <section>
                <h2 className="text-xl font-bold text-cyan-800 tracking-wider border-b-2 border-cyan-800 pb-1 mb-3">Career Objective</h2>
                <p className="text-sm leading-relaxed">{resume.careerObjective}</p>
            </section>
            
            {resume.experience && resume.experience.length > 0 && (
                 <section className="mt-6">
                    <h2 className="text-xl font-bold text-cyan-800 tracking-wider border-b-2 border-cyan-800 pb-1 mb-3">Experience</h2>
                    {resume.experience.map((ex, i) => (
                        <div key={i} className="text-sm mb-3">
                            <h3 className="font-bold text-base">{ex.role}</h3>
                            <div className="flex justify-between text-xs">
                                <p className="italic">{ex.company}</p>
                                <p>{ex.duration}</p>
                            </div>
                            <p className="text-xs mt-1">{ex.description}</p>
                        </div>
                    ))}
                </section>
            )}
           
            <section className="mt-6">
                <h2 className="text-xl font-bold text-cyan-800 tracking-wider border-b-2 border-cyan-800 pb-1 mb-3">Projects</h2>
                {resume.projects.map((p, i) => (
                     <div key={i} className="text-sm mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">{p.title}</h3>
                            {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-900"><Github className="size-4"/></a>}
                            {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-900"><Globe className="size-4"/></a>}
                        </div>
                        <p className="text-xs leading-relaxed">{p.description}</p>
                    </div>
                ))}
            </section>

             {resume.certifications && resume.certifications.length > 0 && (
                 <section className="mt-6">
                    <h2 className="text-xl font-bold text-cyan-800 tracking-wider border-b-2 border-cyan-800 pb-1 mb-3">Certifications</h2>
                    {resume.certifications.map((cert, i) => (
                        <div key={i} className="text-sm mb-2">
                             <a href={cert.link || '#'} target="_blank" rel="noopener noreferrer" className={`font-bold ${cert.link ? 'hover:underline' : 'pointer-events-none'}`}>{cert.name}</a>
                            <p className="text-xs">{cert.issuer} ({cert.date})</p>
                        </div>
                    ))}
                </section>
            )}

        </main>
    </div>
);

const TopazTemplate = ({ resume }: { resume: Resume }) => (
    <div className="bg-slate-50 text-slate-800 p-8 font-[Arial]">
        <header className="flex items-center justify-between pb-4 border-b-4 border-slate-700">
            <div>
                <h1 className="text-5xl font-extrabold text-slate-800">{resume.personalInfo.name}</h1>
                <p className="text-xl text-slate-600 font-light mt-1">{resume.personalInfo.branch}</p>
            </div>
             <div className="text-right text-xs space-y-1">
                <a href={`mailto:${resume.personalInfo.email}`} className="flex items-center justify-end gap-2 hover:text-slate-900 font-semibold"><Mail className="size-3"/>{resume.personalInfo.email}</a>
                <p className="flex items-center justify-end gap-2"><Phone className="size-3"/>{resume.personalInfo.mobile}</p>
                {resume.personalInfo.linkedin && <a href={resume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-end gap-2 hover:text-slate-900 font-semibold"><Linkedin className="size-3"/>LinkedIn</a>}
                {resume.personalInfo.github && <a href={resume.personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-end gap-2 hover:text-slate-900 font-semibold"><Github className="size-3"/>GitHub</a>}
            </div>
        </header>
        
        <main className="mt-6">
            <p className="text-sm italic text-center mb-6">{resume.careerObjective}</p>
            
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                    {resume.experience && resume.experience.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-2">Work Experience</h2>
                            {resume.experience.map((ex, i) => (
                                <div key={i} className="text-sm mb-3 relative pl-4 border-l-2 border-slate-300">
                                    <div className="absolute -left-1.5 top-1 h-2 w-2 rounded-full bg-slate-700"></div>
                                    <p className="text-xs text-slate-500">{ex.duration}</p>
                                    <h3 className="font-semibold">{ex.role} at {ex.company}</h3>
                                    <p className="text-xs">{ex.description}</p>
                                </div>
                            ))}
                        </section>
                    )}
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-2">Projects</h2>
                        {resume.projects.map((p, i) => (
                             <div key={i} className="text-sm mb-2">
                                 <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{p.title}</h3>
                                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900"><Github className="size-4"/></a>}
                                    {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900"><Globe className="size-4"/></a>}
                                </div>
                                <p className="text-xs leading-relaxed mt-1">{p.description}</p>
                            </div>
                        ))}
                    </section>
                </div>

                <div className="col-span-1 space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-2">Education</h2>
                        {resume.academicDetails.map((ad, i) => (
                            <div key={i} className="text-sm mb-2">
                                <p className="font-semibold">{ad.degree}</p>
                                <p className="text-xs">{ad.institute}</p>
                                <p className="text-xs">{ad.year} | {ad.cgpa} CGPA</p>
                            </div>
                        ))}
                    </section>
                    <section>
                         <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-2">Skills</h2>
                         <div className="flex flex-wrap gap-1.5">
                            {resume.skills.map((skill, index) => (
                                <span key={index} className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded">{skill}</span>
                            ))}
                        </div>
                    </section>
                    {resume.certifications && resume.certifications.length > 0 && (
                        <section>
                             <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider mb-2">Certifications</h2>
                            {resume.certifications.map((cert, i) => (
                                <div key={i} className="text-sm mb-1">
                                    <a href={cert.link || '#'} target="_blank" rel="noopener noreferrer" className={`font-semibold ${cert.link ? 'hover:underline' : 'pointer-events-none'}`}>{cert.name}</a>
                                    <p className="text-xs">{cert.issuer} ({cert.date})</p>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </main>
    </div>
);

const templates = {
    onyx: OnyxTemplate,
    opal: OpalTemplate,
    topaz: TopazTemplate
}

interface ResumePreviewProps {
    resume: Resume;
}

export const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(({ resume }, ref) => {
    const TemplateComponent = templates[resume.template] || OnyxTemplate;
    return (
        <div ref={ref} className="bg-white shadow-lg A4-aspect-ratio">
            <TemplateComponent resume={resume} />
        </div>
    );
});

ResumePreview.displayName = "ResumePreview";
