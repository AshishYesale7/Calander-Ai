
'use server';
/**
 * @fileOverview An AI agent for generating a smart daily plan.
 *
 * - generateDailyPlan - A function that creates a personalized daily schedule by fetching the user's data.
 * - GenerateDailyPlanInput - The input type for the generateDailyPlan function.
 * - GenerateDailyPlanOutput - The return type for the generateDailyPlan function.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { getCareerGoals } from '@/services/careerGoalsService';
import { getSkills } from '@/services/skillsService';
import { getTimelineEvents } from '@/services/timelineService';
import { getUserPreferences } from '@/services/userService';
import type { RoutineItem } from '@/types';
import { addHours, format, isSameDay } from 'date-fns';
import { z } from 'genkit';

// Main input schema for the payload - now much simpler
const GenerateDailyPlanPayloadSchema = z.object({
  currentDate: z.string().describe("Today's date in ISO format."),
  userId: z.string().describe("The user's unique ID to fetch their data."),
});

// Full input schema including optional API key
const GenerateDailyPlanInputSchema = GenerateDailyPlanPayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateDailyPlanInput = z.infer<typeof GenerateDailyPlanInputSchema>;


// The output schema the AI must adhere to
const GenerateDailyPlanOutputSchema = z.object({
  schedule: z.array(z.object({
    id: z.string().describe("A unique ID for this schedule item, e.g., 'plan-item-1'."),
    time: z.string().describe("The time for the activity, e.g., '09:00 AM' or a range like '11:00 PM - 07:00 AM'."),
    activity: z.string().describe("A specific, actionable task."),
    status: z.enum(['pending', 'completed', 'missed']).default('pending').describe("The initial status of the task, which must always be 'pending'."),
  })).describe("A detailed schedule for the day, starting from wake-up time."),
  microGoals: z.array(z.string()).describe("A list of 2-4 specific, achievable micro-goals for today."),
  reminders: z.array(z.string()).describe("A list of 1-3 critical reminders for today or tomorrow."),
  motivationalQuote: z.string().describe("An inspiring quote for the day."),
});
export type GenerateDailyPlanOutput = z.infer<typeof GenerateDailyPlanOutputSchema>;


// This is the main exported function now.
export async function generateDailyPlan(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput> {
  // Fetch all necessary data *inside* the function.
  const [timelineEvents, careerGoals, skills, userPreferences] = await Promise.all([
      getTimelineEvents(input.userId),
      getCareerGoals(input.userId),
      getSkills(input.userId),
      getUserPreferences(input.userId),
  ]);

  // Pre-process the data for the prompt
  const today = new Date(input.currentDate);

  let userSleepSchedule: RoutineItem | undefined;
  let todaysRoutineBlocks: { title: string; startTime: string; endTime: string }[] = [];

  if (userPreferences) {
      // Find the user's sleep schedule for today
      userSleepSchedule = userPreferences.routine.find(item =>
        item.activity.toLowerCase() === 'sleep' && item.days.includes(today.getDay())
      );
    
      // Filter routine items for today, EXCLUDING sleep
      todaysRoutineBlocks = userPreferences.routine.filter(item =>
        item.activity.toLowerCase() !== 'sleep' && item.days.includes(today.getDay())
      ).map(item => ({
        title: item.activity,
        startTime: item.startTime,
        endTime: item.endTime,
      }));
  }
  
  // Filter timeline events that occur today
  const todaysTimelineBlocks = timelineEvents.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, today);
  }).map(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const eventEndDate = event.endDate instanceof Date ? event.endDate : (event.endDate ? new Date(event.endDate) : addHours(eventDate, 1));
      return {
          title: event.title,
          startTime: format(eventDate, 'HH:mm'),
          endTime: format(eventEndDate, 'HH:mm')
      }
  });

  // Combine both into a single list of fixed schedule items (without sleep)
  const fixedScheduleForToday = [...todaysRoutineBlocks, ...todaysTimelineBlocks];

  // Manually construct the prompt string
  const currentDateStr = format(today, 'PPPP');

  const sleepScheduleText = userSleepSchedule
    ? `The user's preferred sleep time is from ${userSleepSchedule.startTime} to ${userSleepSchedule.endTime}.`
    : 'The user has not set a preferred sleep time; assume a standard 8-hour sleep schedule (e.g., 11 PM to 7 AM).';

  const fixedScheduleText = fixedScheduleForToday.length > 0
    ? fixedScheduleForToday.map(item => `  - Activity: "${item.title}" from ${item.startTime} to ${item.endTime}`).join('\n')
    : '- The user has no fixed activities scheduled for today.';

  const careerGoalsText = careerGoals.map(g => ` - ${g.title} (Progress: ${g.progress}%${g.deadline ? `, Deadline: ${format(g.deadline, 'PPP')}` : ''}).`).join('\n');
  
  const skillsText = skills.map(s => ` - ${s.name} (Proficiency: ${s.proficiency}).`).join('\n');
  
  const timelineEventsText = timelineEvents.map(e => `- Event: "${e.title}" on ${format(e.date, 'PPP')}.`).join('\n');

  const promptText = `You are an expert productivity and career coach AI named 'Career Calender'.
Your goal is to create a highly personalized, scannable, and motivating daily plan for a user that flows chronologically from their wake-up time.

Today's date is: ${currentDateStr}

**1. User's Preferred Sleep Schedule:**
${sleepScheduleText}

**2. CRITICAL: User's Fixed Schedule for Today**
These are the user's fixed, non-negotiable activities and appointments for today (excluding sleep). The times provided are in 24-hour format.
You MUST include every single one of these items in the final schedule at their specified times.
${fixedScheduleText}

**3. User's Long-Term Goals & Vision:**
- Career Goals:
${careerGoalsText.length > 0 ? careerGoalsText : 'No career goals set.'}
- Skills to Develop:
${skillsText.length > 0 ? skillsText : 'No skills being tracked.'}

**4. All Upcoming Events (for context):**
${timelineEventsText.length > 0 ? timelineEventsText : 'No upcoming events on the timeline.'}

---
**YOUR TASK**
Analyze all the provided information and generate a complete daily plan. Follow these instructions precisely:

1.  **Create Daily Micro-Goals:** Based on the user's goals, skills, and any upcoming deadlines, generate 2-4 specific, achievable "micro-goals" for today.

2.  **Build the Schedule:**
    a.  The schedule must start from the user's first waking activity. Do not include a sleep block at the beginning of the day.
    b.  First, place all items from the "CRITICAL: User's Fixed Schedule for Today" section into the timetable.
    c.  Then, intelligently fill the remaining empty time slots with tasks to achieve the micro-goals. Mix focused work with short breaks.
    d.  **IMPORTANT OUTPUT FORMATTING:** When creating the final 'schedule' array, follow this rule:
        - For any activity block (either from the fixed schedule or one you plan) that is **4 hours or longer** (like 'Sleep'), you MUST create a **single entry** with a time range. Example: \`{"time": "11:00 PM - 07:00 AM", "activity": "Sleep"}\`.
        - For any activity block that is **shorter than 4 hours** (like a 2-hour 'College' block or a 1-hour 'Study' block), you MUST create **individual hourly entries**. For example, a 'Study' block from 9 AM to 11 AM must be represented as two separate entries: one for \`{"time": "09:00 AM", "activity": "Study"}\` and another for \`{"time": "10:00 AM", "activity": "Study"}\`.
    e.  The sleep block for the upcoming night should be placed at the very end of the schedule. You MUST use the times from the "User's Preferred Sleep Schedule" section above for this. This should be the ONLY 'Sleep' activity in the entire schedule. If no sleep schedule is provided, assume a reasonable one like 11 PM to 7 AM.
    f.  All times in the final 'schedule' output must use a 12-hour clock with AM/PM (e.g., '09:00 AM').
    g.  Each schedule item you create MUST have a unique 'id' field (e.g. "plan-item-1", "plan-item-2") and a 'status' field initialized to "pending".

3.  **Generate Critical Reminders:** Create a list of 1-3 important reminders for today or tomorrow.

4.  **Find a Motivational Quote:** Provide one short, inspiring quote related to productivity or learning.

Your entire output MUST be a single, valid JSON object that adheres to the output schema.`;
  
  // Use the generateWithApiKey helper with the constructed prompt string
  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: GenerateDailyPlanOutputSchema,
    },
  });

  if (!output) {
    throw new Error("The AI model did not return a valid daily plan.");
  }
  
  return output;
}
