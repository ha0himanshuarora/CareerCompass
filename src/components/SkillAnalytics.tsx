

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skill } from "@/lib/types";
import { Wand2, TrendingUp, BarChart as BarChartIcon } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Bar, XAxis, YAxis, Tooltip, BarChart } from 'recharts';


interface SkillAnalyticsProps {
    skills: Skill[];
}

export function SkillAnalytics({ skills }: SkillAnalyticsProps) {

    const aggregateSkills = () => {
        const skillTypes: Record<string, number> = { 'Technical': 0, 'Soft': 0 };
        skills.forEach(skill => {
            if (skill.type in skillTypes) {
                skillTypes[skill.type]++;
            }
        });
        
        const maxCount = Math.max(...Object.values(skillTypes), 1);
        
        return Object.keys(skillTypes).map(key => ({
            subject: key,
            A: skillTypes[key],
            fullMark: maxCount
        }));
    }
    
    const technicalSkillsData = skills
        .filter(s => s.type === 'Technical')
        .map(s => ({ name: s.name, progress: s.progress ?? 0 }));

    const chartData = aggregateSkills();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5" />
                    Skill Analytics
                </CardTitle>
                <CardDescription>A visual breakdown of your skills and progress.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="h-72">
                    <h3 className="text-center font-semibold mb-2">Technical vs. Soft Skills</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1']} tick={false} axisLine={false} />
                            <Radar name="Skills" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="h-72">
                    <h3 className="text-center font-semibold mb-2">Skill Progress</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={technicalSkillsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide domain={[0, 100]}/>
                            <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ 
                                    background: 'hsl(var(--background))', 
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Bar dataKey="progress" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
