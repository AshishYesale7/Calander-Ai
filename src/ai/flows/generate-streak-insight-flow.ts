
'use server';
/**
 * @fileOverview An AI agent for generating streak-based motivational insights.
 *
 * - generateStreakInsight - A function that takes a user's streak data and rank
 *                           to generate a personalized, encouraging message.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStreakInsightInputSchema = z.object({
  currentStreak: z.number().describe("The user's current continuous daily streak."),
  longestStreak: z.number().describe("The user's longest-ever daily streak."),
  rank: z.number().optional().describe("The user's current rank on the leaderboard. Can be null if not ranked."),
  totalUsers: z.number().describe("The total number of users on the leaderboard."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateStreakInsightInput = z.infer<typeof GenerateStreakInsightInputSchema>;

const GenerateStreakInsightOutputSchema = z.object({
  insight: z.string().describe("A single, short, encouraging, and analytical sentence about the user's streak. Varies based on milestones."),
});
export type GenerateStreakInsightOutput = z.infer<typeof GenerateStreakInsightOutputSchema>;


export async function generateStreakInsight(input: GenerateStreakInsightInput): Promise<GenerateStreakInsightOutput> {

  const promptText = `You are a motivating and analytical AI coach. Your goal is to generate a single, short, encouraging sentence for a user based on their daily streak and leaderboard performance.

**User Data:**
- Current Streak: ${input.currentStreak} days
- Longest Streak: ${input.longestStreak} days
- Leaderboard Rank: ${input.rank ? `${input.rank} / ${input.totalUsers}` : 'Not Ranked'}

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
    -   If approaching longest streak: "You're only ${input.longestStreak - input.currentStreak} days away from your personal best!"
    -   If just broke longest streak: "New personal record! You've officially set your new longest streak."
4.  **Default Encouragement:** If none of the above apply (e.g., low streak, low rank), give a simple, encouraging message.
    -   "Each day is a new victory. Keep it up!"
    -   "Consistency is key. Another great day!"
5.  **Output:** Provide only a single sentence in the 'insight' field.

**Example for a 4-day streak, ranked 52/100:**
"You're on the leaderboard! Keep the streak alive to climb higher."

**Example for a 31-day streak:**
"An entire month of dedication! You're in the top percentile of users for consistency."

Now, generate the insight for the provided user data.`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: GenerateStreakInsightOutputSchema,
    },
  });

  if (!output || !output.insight) {
    // Fallback in case of AI error
    return { insight: "Keep up the great work! Consistency is key." };
  }
  
  return output;
}
