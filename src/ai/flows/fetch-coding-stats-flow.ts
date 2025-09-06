
'use server';
/**
 * @fileOverview An AI agent for fetching and aggregating coding platform statistics.
 *
 * - fetchCodingStats - A function that takes usernames for various platforms and
 *                      returns a structured object of their stats.
 */

import { z } from 'zod';
import { format, startOfDay } from 'date-fns';

// Input Schema: Takes optional usernames for each platform
const FetchCodingStatsInputSchema = z.object({
    codeforces: z.string().optional().describe("Codeforces username"),
    leetcode: z.string().optional().describe("LeetCode username"),
    codechef: z.string().optional().describe("Codechef username"),
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key. No longer used but kept for schema consistency."),
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
    // New field for contribution data
    contributionData: z.record(z.number()).optional().describe("A record of contributions per day, in 'yyyy-MM-dd' format."),
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


// --- Helper Functions for Real-Time Data Fetching ---

async function fetchCodeforcesData(username: string): Promise<z.infer<typeof CodeforcesDataSchema>> {
  try {
    const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
    const userInfoData = await userInfoResponse.json();

    if (userInfoData.status !== 'OK') {
      throw new Error(`Codeforces: ${userInfoData.comment}`);
    }

    const userStatusResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=1000`);
    const userStatusData = await userStatusResponse.json();
    
    let totalSolved = 0;
    const contributionData: Record<string, number> = {};

    if (userStatusData.status === 'OK') {
        const uniqueSolvedProblems = new Set<string>();
        const submissions = userStatusData.result;

        submissions.forEach((sub: any) => {
            if (sub.verdict === 'OK') {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                uniqueSolvedProblems.add(problemId);
                
                const submissionDate = format(startOfDay(new Date(sub.creationTimeSeconds * 1000)), 'yyyy-MM-dd');
                contributionData[submissionDate] = (contributionData[submissionDate] || 0) + 1;
            }
        });
        totalSolved = uniqueSolvedProblems.size;
    }
    
    const streak = 0; // Placeholder

    const contestsResponse = await fetch('https://codeforces.com/api/contest.list?gym=false');
    const contestsData = await contestsResponse.json();
    const upcomingContests = contestsData.result
      .filter((c: any) => c.phase === 'BEFORE')
      .slice(0, 5)
      .map((c:any) => ({
          id: c.id,
          name: c.name,
          startTimeSeconds: c.startTimeSeconds,
          durationSeconds: c.durationSeconds,
      }));

    return {
      username: userInfoData.result[0].handle,
      rating: userInfoData.result[0].rating || 0,
      rank: userInfoData.result[0].rank || 'Unrated',
      totalSolved,
      streak,
      contests: upcomingContests,
      contributionData,
    };
  } catch (error: any) {
    return { username, rating: 0, rank: 'N/A', totalSolved: 0, streak: 0, error: error.message };
  }
}

async function fetchLeetCodeData(username: string): Promise<z.infer<typeof LeetCodeDataSchema>> {
  try {
    const query = `
      query getUserProfile($username: String!) {
        allQuestionsCount { difficulty count }
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum { difficulty count }
          }
        }
      }
    `;
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } }),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error('User not found on LeetCode.');
    }

    const stats = data.data.matchedUser.submitStats.acSubmissionNum;
    const totalSolved = stats.find((s: any) => s.difficulty === 'All')?.count || 0;
    const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    
    // LeetCode API does not directly provide streak. Returning placeholder.
    const streak = 0;

    return { username, totalSolved, easy, medium, hard, streak };
  } catch (error: any) {
    return { username, totalSolved: 0, easy: 0, medium: 0, hard: 0, streak: 0, error: error.message };
  }
}

async function fetchCodeChefData(username: string): Promise<z.infer<typeof CodeChefDataSchema>> {
  try {
    // Using a reliable third-party proxy as the official API requires OAuth
    const response = await fetch(`https://lazarus-api.onrender.com/codechef/${username}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `User not found on CodeChef.`);
    }
    const data = await response.json();

    return {
      username: data.profile.username || username,
      rating: data.currentRating || 0,
      stars: data.stars || '0',
      totalSolved: data.problemsSolved || 0,
    };
  } catch (error: any) {
    return { username, rating: 0, stars: '0', totalSolved: 0, error: error.message };
  }
}

// This is the main exported function that combines the results.
export async function fetchCodingStats(input: FetchCodingStatsInput): Promise<AllPlatformsUserData> {
  const { codeforces, leetcode, codechef } = input;
  const result: AllPlatformsUserData = {};

  const promises = [];
  if (codeforces) promises.push(fetchCodeforcesData(codeforces));
  if (leetcode) promises.push(fetchLeetCodeData(leetcode));
  if (codechef) promises.push(fetchCodeChefData(codechef));

  const results = await Promise.all(promises);
  
  results.forEach(platformResult => {
      if (platformResult.hasOwnProperty('contests')) {
          result.codeforces = platformResult as z.infer<typeof CodeforcesDataSchema>;
      } else if (platformResult.hasOwnProperty('easy')) {
          result.leetcode = platformResult as z.infer<typeof LeetCodeDataSchema>;
      } else if (platformResult.hasOwnProperty('stars')) {
          result.codechef = platformResult as z.infer<typeof CodeChefDataSchema>;
      }
  });

  return result;
}
