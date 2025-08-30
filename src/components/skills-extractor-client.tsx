"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { extractSkills, type ExtractSkillsInput, type ExtractSkillsOutput } from "@/ai/flows/extract-skills-from-job-description";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters long."),
});

type FormValues = z.infer<typeof formSchema>;

export function SkillsExtractorClient() {
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setExtractedSkills([]);
    try {
      const result: ExtractSkillsOutput = await extractSkills(data);
      setExtractedSkills(result.skills);
    } catch (error) {
      console.error("Error extracting skills:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to extract skills. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>AI Skills Extractor</CardTitle>
            <CardDescription>Paste a job description below to identify the key skills required.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'We are looking for a proactive Software Engineer with experience in React, Node.js, and cloud technologies...'"
                      className="min-h-48"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Extract Skills
                </>
              )}
            </Button>
            
            {extractedSkills.length > 0 && (
              <div className="w-full">
                <h3 className="font-semibold mb-2">Extracted Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
