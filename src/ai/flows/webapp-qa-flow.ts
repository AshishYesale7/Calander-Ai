
'use server';
/**
 * @fileOverview A conversational AI agent that can answer questions about the Calendar.ai web application.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the conversational flow
const WebAppQaInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type WebAppQaInput = z.infer<typeof WebAppQaInputSchema>;


// Output schema for the conversational flow
const WebAppQaOutputSchema = z.object({
    response: z.string().describe("The AI's helpful and informative response to the user's question."),
});
export type WebAppQaOutput = z.infer<typeof WebAppQaOutputSchema>;

const webAppQaPrompt = ai.definePrompt({
    name: 'webAppQaPrompt',
    input: { schema: z.object({ chatHistoryString: z.string() }) },
    output: { schema: WebAppQaOutputSchema },
    prompt: `You are a friendly and knowledgeable AI assistant for a web application called "Calendar.ai". Your goal is to answer user questions about the app's features, purpose, and technology.

You have been provided with a comprehensive knowledge base about Calendar.ai. Use this information to answer the user's questions accurately and concisely.

**Knowledge Base about Calendar.ai:**

Calendar.ai is an intelligent digital assistant designed for college students and early-career professionals to manage academic responsibilities, career development, and personal growth. It uses AI to transform planning from reactive to proactive.

**Key Features:**
- **AI-Powered Dashboard:** Multiple calendar views (monthly, weekly planner, timeline) that sync with Google Calendar and Tasks.
- **Smart Daily Planning:** The AI generates a personalized daily plan with an optimized schedule, micro-goals, and reminders.
- **Career Vision Planner:** Users describe their career aspirations, and the AI generates a comprehensive plan including a vision statement, strengths analysis, development areas (technical, soft, hard skills), and an actionable roadmap.
- **Goal & Skill Tracking:** Define and monitor career goals with progress trackers and log acquired skills with proficiency levels.
- **Real-time Communication:** One-on-one chat, audio, and video calling with other users, featuring a peer-to-peer WebRTC architecture.
- **Gamification & Social Features:** Includes daily streaks, a competitive leaderboard, user profiles, and a follow system.
- **Extension Marketplace:** A marketplace for plugins. The flagship is "Codefolio Ally" for competitive programmers, which tracks stats from Codeforces, LeetCode, and CodeChef.
- **Intelligent Integrations:** AI-powered Gmail scanning for important emails (summarizes them, filters out sensitive info) and an "AI Opportunity Tracker" to find upcoming deadlines for exams or jobs.
- **Advanced UX:** Multi-account support (Email, Google, Phone), push notifications, extensive customization (themes, backgrounds, glass effects), and an intelligent command palette (Ctrl+K).

**Technology Stack:**
- **Core:** Next.js, React, TypeScript, Tailwind CSS.
- **AI:** Google's Genkit framework with Gemini models.
- **Backend:** Firebase (Authentication, Firestore, Cloud Messaging).
- **Integrations:** Google Workspace APIs (Calendar, Tasks, Gmail), Razorpay for payments, competitive programming APIs.

---

**Your Task:**
Analyze the user's latest question from the chat history and provide a helpful, friendly, and informative response based *only* on the knowledge base provided above.

**Chat History:**
{{{chatHistoryString}}}

**Instructions:**
1. Read the entire conversation to understand the context.
2. Formulate a direct and helpful answer to the last user message.
3. If the user asks what the app is about, give a concise summary.
4. If the user asks about specific features (like "Codefolio" or "clans"), explain them based on the knowledge base.
5. If the user's question is outside the scope of Calendar.ai, politely state that you can only answer questions about the application.
6. Keep your answers conversational and easy to understand.
`,
});

const answerWebAppQuestionsFlow = ai.defineFlow({
    name: 'answerWebAppQuestionsFlow',
    inputSchema: WebAppQaInputSchema,
    outputSchema: WebAppQaOutputSchema,
}, async (input) => {
    const historyString = input.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    try {
        const { output } = await webAppQaPrompt({
            chatHistoryString: historyString,
        });

        if (!output || !output.response) {
          throw new Error("The AI model did not return a valid response.");
        }
        return output;
    } catch (e: any) {
        if (e.message && e.message.includes('503')) {
            return {
                response: "I'm sorry, I'm currently unavailable as the service is overloaded. Please try again in a moment.",
            };
        }
        console.error("Error in WebApp QA flow:", e);
        return {
            response: "I'm sorry, I encountered an error and can't provide a response right now.",
        };
    }
});

// The main exported function that the UI will call
export async function answerWebAppQuestions(input: WebAppQaInput): Promise<WebAppQaOutput> {
  return answerWebAppQuestionsFlow(input);
}
