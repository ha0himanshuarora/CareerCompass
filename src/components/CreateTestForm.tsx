

"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { Test, Recruiter, TPO, Question } from "@/lib/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2, PlusCircle, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { generateTestQuestions } from "@/ai/flows/generate-test-questions";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";

const questionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty."),
  options: z.array(z.string().min(1, "Option cannot be empty.")).min(4, "Must have at least 4 options.").max(4, "Must have at most 4 options."),
  correctOption: z.coerce.number().min(0, "Please select a correct option."),
});

const testFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes."),
  passingScore: z.coerce.number().min(1, "Passing score must be at least 1.").optional(),
  questions: z.array(questionSchema).min(1, "A test must have at least one question."),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const aiGeneratorSchema = z.object({
    topic: z.string().min(1, "Please enter a topic."),
    difficulty: z.string(),
    count: z.coerce.number().min(1, "Must be at least 1").max(5, "Cannot generate more than 5 at once."),
});
type AIGeneratorValues = z.infer<typeof aiGeneratorSchema>;

interface CreateTestFormProps {
  onFormSubmit: () => void;
  initialData?: Test | null;
}

export function CreateTestForm({ onFormSubmit, initialData }: CreateTestFormProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const isEditMode = !!initialData;
    
    const [aiTopic, setAiTopic] = useState("");
    const [aiDifficulty, setAiDifficulty] = useState("Easy");
    const [aiCount, setAiCount] = useState(1);


    const form = useForm<TestFormValues>({
        resolver: zodResolver(testFormSchema),
        defaultValues: initialData ? {
            title: initialData.title,
            duration: initialData.duration,
            passingScore: initialData.passingScore,
            questions: initialData.questions,
        } : {
            title: "",
            duration: 30,
            passingScore: 1,
            questions: [{ questionText: "", options: ["", "", "", ""], correctOption: 0 }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "questions"
    });
    
    const handleGenerateQuestions = async () => {
        setIsGenerating(true);
        try {
            const result = await generateTestQuestions({
                topic: aiTopic,
                difficulty: aiDifficulty,
                count: aiCount,
            });
            if (result.questions && result.questions.length > 0) {
                // Check if the first question is the initial empty one and remove it
                const currentQuestions = form.getValues("questions");
                if (currentQuestions.length === 1 && currentQuestions[0].questionText === "") {
                    remove(0);
                }
                
                // Append new questions
                append(result.questions);
                toast({ title: "Success!", description: `${result.questions.length} questions have been generated.` });
            } else {
                 toast({ variant: "destructive", title: "AI Error", description: "The AI did not return any questions." });
            }
        } catch (error) {
            console.error("Error generating questions:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not generate questions with AI." });
        } finally {
            setIsGenerating(false);
        }
    };


    const onSubmit = async (values: TestFormValues) => {
        if (!userProfile) return;
        setIsLoading(true);

        const testData: any = {
            ...values,
            type: userProfile.role === 'tpo' ? 'mock' : 'company',
            createdBy: userProfile.uid,
            createdAt: serverTimestamp(),
        };

        if (userProfile.role === 'tpo') {
            testData.instituteName = (userProfile as TPO).instituteName;
        } else if (userProfile.role === 'recruiter') {
            testData.companyName = (userProfile as Recruiter).companyName;
        }

        try {
            if (isEditMode && initialData) {
                await updateDoc(doc(db, "tests", initialData.id), testData);
                toast({ title: "Success", description: "Test updated successfully." });
            } else {
                await addDoc(collection(db, "tests"), testData);
                toast({ title: "Success", description: "Test created successfully." });
            }
            onFormSubmit();
        } catch (error) {
            console.error("Error saving test:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save the test." });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Test Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Aptitude Test" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duration (in minutes)</FormLabel><FormControl><Input type="number" min="5" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {userProfile?.role === 'recruiter' && (
                     <FormField control={form.control} name="passingScore" render={({ field }) => (
                        <FormItem><FormLabel>Passing Score</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                           <Wand2 className="text-primary"/> Generate with AI
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Let AI create questions for you. You can review and edit them afterward.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-2 grid gap-1.5">
                                <Label>Topic</Label>
                                <Input placeholder="e.g. React Hooks, Data Structures" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                            </div>
                             <div className="grid gap-1.5">
                                <Label>Difficulty</Label>
                                <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                             <div className="grid gap-1.5">
                                 <Label>Number of Questions</Label>
                                 <Input type="number" min="1" max="5" value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))}/>
                             </div>
                              <div className="md:col-span-2">
                                <Button type="button" onClick={handleGenerateQuestions} disabled={isGenerating || !aiTopic} className="w-full">
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Generate
                                </Button>
                             </div>
                         </div>
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                <div>
                    <FormLabel>Questions</FormLabel>
                    <div className="space-y-4 mt-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-semibold">Question {index + 1}</FormLabel>
                                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <FormField control={form.control} name={`questions.${index}.questionText`} render={({ field }) => (
                                    <FormItem><FormControl><Textarea {...field} placeholder="What is 2+2?" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`questions.${index}.correctOption`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Options (select the correct one)</FormLabel>
                                        <RadioGroup onValueChange={field.onChange} value={String(field.value)} className="space-y-2">
                                        {[...Array(4)].map((_, optionIndex) => (
                                            <div key={optionIndex} className="flex items-center gap-2">
                                                <FormControl>
                                                    <RadioGroupItem value={String(optionIndex)} />
                                                </FormControl>
                                                <FormField control={form.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                                                     <FormControl><Input {...field} placeholder={`Option ${optionIndex + 1}`} /></FormControl>
                                                )} />
                                            </div>
                                        ))}
                                    </RadioGroup>
                                    <FormMessage /></FormItem>
                                )} />
                            </div>
                        ))}
                         <Button type="button" variant="outline" size="sm" onClick={() => append({ questionText: "", options: ["", "", "", ""], correctOption: 0 })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Question Manually
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Test'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
