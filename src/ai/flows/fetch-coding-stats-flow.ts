
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
    geeksforgeeks: z.string().optional().describe("Geeks for Geeks username"),
    codestudio: z.string().optional().describe("Coding Ninjas Studio username"),
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
type Contest = z.infer<typeof ContestSchema>;

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

const GeeksForGeeksDataSchema = z.object({
    username: z.string().describe("The user's Geeks for Geeks username."),
    totalSolved: z.number().describe("Total problems solved."),
    streak: z.number().describe("Current daily problem-solving streak."),
    error: z.string().optional().describe("An error message if the user is not found or data is private."),
});

const CodeStudioDataSchema = z.object({
    username: z.string().describe("The user's Coding Ninjas Studio username."),
    totalSolved: z.number().describe("Total problems solved."),
    error: z.string().optional().describe("An error message if the user is not found or data is private."),
});


// Combined Output Schema
const AllPlatformsUserDataSchema = z.object({
    codeforces: CodeforcesDataSchema.optional(),
    leetcode: LeetCodeDataSchema.optional(),
    codechef: CodeChefDataSchema.optional(),
    geeksforgeeks: GeeksForGeeksDataSchema.optional(),
    codestudio: CodeStudioDataSchema.optional(),
});
export type AllPlatformsUserData = z.infer<typeof AllPlatformsUserDataSchema>;


export async function fetchCodingStats(input: FetchCodingStatsInput): Promise<AllPlatformsUserData> {
  const { apiKey, ...usernames } = input;
  const usernameEntries = Object.entries(usernames).filter(([, value]) => value);

  if (usernameEntries.length === 0) {
      return {};
  }

  const promptText = `You are an expert AI assistant that can fetch user statistics from public coding platform profiles.
Your task is to perform a simulated, intelligent web search for the provided usernames on their respective platforms and return the data in a structured JSON format.

**Usernames to Fetch:**
${usernameEntries.map(([platform, username]) => `- ${platform}: ${username}`).join('\n')}

**Instructions for each platform:**
1.  **Simulate a Search:** Imagine you are visiting the public profile page for each provided username (e.g., codeforces.com/profile/USERNAME, leetcode.com/USERNAME).
2.  **Extract Key Information:** Pull the following details if they are publicly available. If a user is not found or their profile is private, you MUST set the "error" field for that platform with a descriptive message.
    -   **Codeforces:** Get current rating, rank, total problems solved, and current daily streak. Also, fetch a list of the next 2-3 upcoming contests from the platform.
    -   **LeetCode:** Get total solved count, the breakdown of easy/medium/hard problems, and the current daily streak.
    -   **CodeChef:** Get current rating, star rating (e.g., "4 Star"), and total problems solved.
    -   **Geeks for Geeks (GFG):** Get total problems solved and the current daily streak.
    -   **Codestudio (Coding Ninjas):** Get total problems solved.
3.  **Handle Missing Users:** If a username does not exist on a platform, you MUST set the 'error' field for that specific platform's data object to a message like "User not found." Do not skip the platform in the output.
4.  **Format Output:** Your entire output MUST be a single JSON object that strictly adheres to the 'AllPlatformsUserDataSchema'. Only include keys for the platforms that had usernames provided. If a username is provided but the user is not found, include the key for the platform with the 'error' field set.

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
