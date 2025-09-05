
'use server';
/**
 * @fileOverview An AI agent for generating streak-based motivational insights.
 *
 * - generateStreakInsight - A function that takes a user's streak data and rank
 *                           to generate a personalized, encouraging message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStreakInsightInputSchema = z.object({
  currentStreak: z.number().describe("The user's current continuous daily streak."),
  longestStreak: z.number().describe("The user's longest-ever daily streak."),
  rank: z.number().optional().describe("The user's current rank on the leaderboard. Can be null if not ranked."),
  totalUsers: z.number().describe("The total number of users on the leaderboard."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key. Not used in this flow directly but kept for potential future use and schema consistency."),
});
export type GenerateStreakInsightInput = z.infer<typeof GenerateStreakInsightInputSchema>;

const GenerateStreakInsightOutputSchema = z.object({
  insight: z.string().describe("A single, short, encouraging, and analytical sentence about the user's streak. Varies based on milestones."),
});
export type GenerateStreakInsightOutput = z.infer<typeof GenerateStreakInsightOutputSchema>;

// Mock insights to use as a fallback if the AI service fails or is rate-limited.
const mockInsights = [
    "Keep up the great work! Consistency is key.",
    "Another day, another step towards your goals.",
    "You're building a powerful habit. Keep it going!",
    "Every day you practice, you get stronger.",
    "Small steps lead to big results. You're proving it!",
    "Consistency is what transforms average into excellence.",
    "Don't stop now, you've got momentum on your side!",
];

const streakInsightPrompt = ai.definePrompt({
    name: 'streakInsightPrompt',
    input: {
        schema: GenerateStreakInsightInputSchema.omit({apiKey: true}), // We don't need apiKey in the prompt itself
    },
    output: {
        schema: GenerateStreakInsightOutputSchema,
    },
    prompt: `You are a motivating and analytical AI coach. Your goal is to generate a single, short, encouraging sentence for a user based on their daily streak and leaderboard performance.

**User Data:**
- Current Streak: {{{currentStreak}}} days
- Longest Streak: {{{longestStreak}}} days
- Leaderboard Rank: {{#if rank}}{{rank}} / {{totalUsers}}{{else}}Not Ranked{{/if}}

**Instructions:**
1.  **Acknowledge Milestones:** If the streak hits a specific milestone, make it the focus.
    -   7 days: "A full week of consistency! That's how habits are built."
    -   14 days: "Two weeks strong! You're building incredible momentum."
    -   30 days: "An entire month of dedication! You're in the top percentile of users for consistency."
    -   60 days: "Two months straight! This level of commitment is rare and impressive."
    -   100 days: "Wow, 100 days! You've achieved a truly elite level of discipline."
    -   365 days: "A full year! Your dedication is an inspiration to the entire community."
2.  **Incorporate Rank:** If not a major milestone, use the rank.
    -   If rank is in the top 10%: "You're in the top 10% of all learners! Your consistency is paying off."
    -   If rank is in the top 25%: "Keeping a streak puts you in the top 25% of all users. Keep climbing!"
    -   If rank is available but not top 25%: "You're on the leaderboard! Keep the streak alive to climb higher."
3.  **Compare to Longest Streak:** If not a milestone and not highly ranked, compare to their personal best.
    -   If approaching longest streak: "You're only {{subtract longestStreak currentStreak}} days away from your personal best!"
    -   If just broke longest streak: "New personal record! You've officially set your new longest streak."
4.  **Default Encouragement:** If none of the above apply (e.g., low streak, low rank), give a simple, encouraging message.
    -   "Each day is a new victory. Keep it up!"
    -   "Consistency is key. Another great day!"
5.  **Output:** Provide only a single sentence in the 'insight' field.

Now, generate the insight for the provided user data.`,
});

const generateStreakInsightFlow = ai.defineFlow(
  {
    name: 'generateStreakInsightFlow',
    inputSchema: GenerateStreakInsightInputSchema,
    outputSchema: GenerateStreakInsightOutputSchema,
  },
  async (input) => {
    try {
        const { output } = await streakInsightPrompt(input);
        if (!output || !output.insight) {
            throw new Error("AI did not return a valid insight.");
        }
        return output;
    } catch (error) {
        console.warn("AI insight generation failed, using fallback. Error:", error);
        // Return a random mock insight on any error
        const randomIndex = Math.floor(Math.random() * mockInsights.length);
        return { insight: mockInsights[randomIndex] };
    }
  }
);

export async function generateStreakInsight(input: GenerateStreakInsightInput): Promise<GenerateStreakInsightOutput> {
  return generateStreakInsightFlow(input);
}
