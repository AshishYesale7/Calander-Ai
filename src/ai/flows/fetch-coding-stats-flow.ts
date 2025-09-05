
'use server';
/**
 * @fileOverview An AI agent for fetching and aggregating coding platform statistics.
 *
 * - fetchCodingStats - A function that takes usernames for various platforms and
 *                      returns a structured object of their stats.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: Takes optional usernames for each platform
const FetchCodingStatsInputSchema = z.object({
    codeforces: z.string().optional().describe("Codeforces username"),
    leetcode: z.string().optional().describe("LeetCode username"),
    codechef: z.string().optional().describe("Codechef username"),
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type FetchCodingStatsInput = z.infer<typeof FetchCodingStatsInputSchema>;


// Output Schemas for each platform
const ContestSchema = z.object({
    id: z.number().describe("The contest ID."),
    name: z.string().describe("The name of the contest."),
    startTimeSeconds: z.number().describe("The start time of the contest in Unix seconds."),
    durationSeconds: z.number().describe("The duration of the contest in seconds."),
});
export type Contest = z.infer<typeof ContestSchema>;

const CodeforcesDataSchema = z.object({
    username: z.string().describe("The user's Codeforces handle."),
    rating: z.number().describe("The user's current contest rating."),
    rank: z.string().describe("The user's rank (e.g., 'Newbie', 'Expert')."),
    totalSolved: z.number().describe("Total number of problems solved."),
    streak: z.number().describe("Current daily problem-solving streak."),
    contests: z.array(ContestSchema).optional().describe("A list of upcoming contests."),
    error: z.string().optional().describe("An error message if the user is not found or data is private."),
});

const LeetCodeDataSchema = z.object({
    username: z.string().describe("The user's LeetCode username."),
    totalSolved: z.number().describe("Total number of problems solved."),
    easy: z.number().describe("Number of easy problems solved."),
    medium: z.number().describe("Number of medium problems solved."),
    hard: z.number().describe("Number of hard problems solved."),
    streak: z.number().describe("Current daily problem-solving streak."),
    error: z.string().optional().describe("An error message if the user is not found or data is private."),
});

const CodeChefDataSchema = z.object({
    username: z.string().describe("The user's CodeChef username."),
    rating: z.number().describe("The user's current contest rating."),
    stars: z.string().describe("Star rating, e.g., '4 Star'."),
    totalSolved: z.number().describe("Total problems solved."),
    error: z.string().optional().describe("An error message if the user is not found or data is private."),
});

// Combined Output Schema
const AllPlatformsUserDataSchema = z.object({
    codeforces: CodeforcesDataSchema.optional(),
    leetcode: LeetCodeDataSchema.optional(),
    codechef: CodeChefDataSchema.optional(),
});
export type AllPlatformsUserData = z.infer<typeof AllPlatformsUserDataSchema>;


export async function fetchCodingStats(input: FetchCodingStatsInput): Promise<AllPlatformsUserData> {
  const { apiKey, ...usernames } = input;
  const usernameEntries = Object.entries(usernames).filter(([, value]) => value);

  if (usernameEntries.length === 0) {
      return {};
  }

  const promptText = `You are an expert AI assistant that can generate realistic mock data for public coding platform profiles.
This is a **simulation**. You do not have live web access. Your task is to generate a **realistic but fictional** data set for the given usernames and return it in a structured JSON format.

**Usernames to Generate Data For:**
${usernameEntries.map(([platform, username]) => `- ${platform}: ${username}`).join('\n')}

**CRITICAL INSTRUCTIONS:**
1.  **Generate Realistic Data:** For each provided username, you **MUST** generate realistic, non-zero, plausible statistics. Do not return zero values for ratings, solved problems, etc., unless it's a brand new account.
    -   **Codeforces:** Generate a plausible rating (e.g., 1200-2200), a corresponding rank (e.g., 'Pupil', 'Expert'), total problems solved, and a daily streak. Also, create a list of 2-3 fictional upcoming contests.
    -   **LeetCode:** Generate a total solved count, a breakdown of easy/medium/hard problems that adds up to the total, and a daily streak.
    -   **CodeChef:** Generate a plausible rating, a star rating (e.g., "4 Star"), and a total problems solved.
2.  **Handle Missing Users:** If and only if a username seems intentionally invalid (e.g., 'user_does_not_exist_123'), you should return an error. For all normal-looking usernames, you must generate data. Set the "error" field for the specific platform with a descriptive message (e.g., "User not found or profile is private.").
3.  **Format Output:** Your entire output MUST be a single JSON object that strictly adheres to the 'AllPlatformsUserDataSchema'. Only include keys for the platforms that had usernames provided.

Now, generate the JSON object with the fetched statistics.
`;

  const { output } = await generateWithApiKey(apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: AllPlatformsUserDataSchema,
    },
  });

  if (!output) {
    throw new Error("The AI model did not return valid user statistics.");
  }
  
  return output;
}
