
'use server';
/**
 * @fileOverview An AI agent for generating personalized workout plans.
 *
 * - generateWorkoutPlan - A function that creates a workout plan based on user inputs.
 * - GenerateWorkoutPlanInput - The input type for the generateWorkoutPlan function.
 * - GenerateWorkoutPlanOutput - The return type for the generateWorkoutPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateWorkoutPlanInputSchema = z.object({
  goal: z.enum(['strength', 'hypertrophy', 'endurance', 'fat-loss']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(30).max(120).describe("Workout duration in minutes"),
  muscleGroups: z.array(z.string()).optional().describe("Specific muscle groups to focus on"),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

const ExerciseSchema = z.object({
    name: z.string().describe("Name of the exercise"),
    sets: z.number().describe("Number of sets"),
    reps: z.string().describe("Rep range (e.g., '8-12', '15-20')"),
    rest: z.string().describe("Rest period in seconds or minutes (e.g., '60s', '2min')"),
    notes: z.string().optional().describe("Tips for form or execution"),
});

export const GenerateWorkoutPlanOutputSchema = z.object({
  title: z.string().describe("A catchy title for the workout plan."),
  description: z.string().describe("A brief, motivating description of the workout."),
  warmup: z.array(z.object({
    activity: z.string(),
    duration: z.string(),
  })).describe("A list of warm-up activities."),
  workout: z.array(ExerciseSchema).describe("The main list of exercises for the workout."),
  cooldown: z.array(z.object({
    activity: z.string(),
    duration: z.string(),
  })).describe("A list of cool-down stretches."),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema>;


const workoutPlanPrompt = ai.definePrompt({
    name: 'workoutPlanPrompt',
    input: { schema: GenerateWorkoutPlanInputSchema },
    output: { schema: GenerateWorkoutPlanOutputSchema },
    prompt: `You are an expert fitness coach. Generate a personalized workout plan based on the user's goals, experience, and available time.

User's Goal: {{{goal}}}
Experience Level: {{{experience}}}
Available Duration: {{{duration}}} minutes
Focus Muscle Groups: {{#if muscleGroups}}{{{muscleGroups}}}{{else}}Full Body{{/if}}

Instructions:
1.  Create a workout plan with a catchy title and a motivating description.
2.  Include a warm-up section with 2-3 activities.
3.  The main workout section should be a list of exercises. For each exercise, specify sets, reps, and rest time. Provide brief notes on proper form where applicable.
4.  The number and type of exercises should be appropriate for the user's experience level and the specified duration.
5.  Include a cool-down section with 2-3 stretching activities.
6.  Ensure the total workout time (warmup + workout + cooldown) fits within the user's specified duration.
7.  If specific muscle groups are provided, tailor the workout to focus on them. Otherwise, create a balanced full-body routine.
`,
});


const generateWorkoutPlanFlow = ai.defineFlow({
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema,
}, async (input) => {
    const { output } = await workoutPlanPrompt(input);
    
    if (!output) {
      throw new Error("The AI model did not return a valid workout plan.");
    }
    
    return output;
});

export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<GenerateWorkoutPlanOutput> {
    return generateWorkoutPlanFlow(input);
}

    