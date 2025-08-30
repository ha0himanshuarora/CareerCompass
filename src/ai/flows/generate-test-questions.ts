'use server';
/**
 * @fileOverview Generates test questions using AI.
 *
 * - generateTestQuestions - A function that takes a topic, difficulty, and count, and returns a list of questions.
 * - GenerateTestQuestionsInput - The input type for the generateTestQuestions function.
 * - GenerateTestQuestionsOutput - The return type for the generateTestQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Question } from '@/lib/types';


const QuestionSchema = z.object({
  questionText: z.string().describe("The text of the multiple-choice question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four string options for the question."),
  correctOption: z.number().min(0).max(3).describe("The 0-indexed integer of the correct option in the options array."),
});

const GenerateTestQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic or subject for the questions (e.g., "React Hooks", "Javascript Promises").'),
  difficulty: z.string().describe('The difficulty level for the questions (e.g., "Easy", "Intermediate", "Hard").'),
  count: z.number().min(1).max(10).describe('The number of questions to generate.'),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

const GenerateTestQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe("An array of generated questions."),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;


export async function generateTestQuestions(input: GenerateTestQuestionsInput): Promise<GenerateTestQuestionsOutput> {
    console.log("Generating questions with input:", input);
    const result = await generateTestQuestionsFlow(input);
    console.log("Generated questions result:", result);
    return result;
}


const prompt = ai.definePrompt({
  name: 'generateTestQuestionsPrompt',
  input: {schema: GenerateTestQuestionsInputSchema},
  output: {schema: GenerateTestQuestionsOutputSchema},
  prompt: `You are an expert test creator for technical and professional topics. Your task is to generate a set of high-quality multiple-choice questions based on the user's request.

  Please generate {{count}} questions on the topic of "{{topic}}" with a difficulty level of "{{difficulty}}".

  For each question, you must provide:
  1.  A clear and concise question text.
  2.  Exactly four plausible options.
  3.  The 0-indexed integer representing the correct answer from the options array.

  Ensure the questions accurately reflect the specified topic and difficulty. The options should be well-formed, and there must be one unambiguously correct answer.`,
});

const generateTestQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTestQuestionsFlow',
    inputSchema: GenerateTestQuestionsInputSchema,
    outputSchema: GenerateTestQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate questions.");
    }
    return output;
  }
);
