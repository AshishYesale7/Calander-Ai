
'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-resources.ts';
import '@/ai/flows/motivational-quote.ts';
import '@/ai/flows/process-google-data-flow.ts';
import '@/ai/flows/career-vision-flow.ts';
import '@/ai/flows/summarize-news-flow.ts';
import '@/ai/flows/summarize-email-flow.ts';
import '@/ai/flows/generate-daily-plan-flow.ts';
import '@/ai/flows/create-event-flow.ts';
import '@/ai/flows/conversational-event-flow.ts';
import '@/ai/flows/track-deadlines-flow.ts';
import '@/ai/flows/send-notification-flow.ts';
import '@/ai/flows/fetch-coding-stats-flow.ts';
import '@/ai/flows/generate-streak-insight-flow.ts';
import '@/ai/flows/generate-workout-flow.ts';
import '@/ai/flows/generate-upcoming-insights-flow.ts';
import '@/ai/flows/generate-greeting-flow.ts';
import '@/ai/flows/webapp-qa-flow.ts';
import '@/ai/flows/conversational-agent-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts'; // Import the new flow
