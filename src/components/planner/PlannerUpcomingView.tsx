
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { generateUpcomingInsights, type GenerateUpcomingInsightsOutput } from '@/ai/flows/generate-upcoming-insights-flow';
import type { MaxViewTheme } from './MaximizedPlannerView';
import { cn } from '@/lib/utils';
import { AlertTriangle, Bot, Check, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface PlannerUpcomingViewProps {
  viewTheme: MaxViewTheme;
}

export default function PlannerUpcomingView({ viewTheme }: PlannerUpcomingViewProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<GenerateUpcomingInsightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be signed in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await generateUpcomingInsights({ userId: user.uid, apiKey });
      setInsights(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate insights.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const containerClasses = viewTheme === 'dark' ? 'bg-gray-800/60 text-gray-200' : 'bg-stone-100 text-gray-800';

  return (
    <div className={cn("p-3 flex flex-col h-full overflow-y-auto", containerClasses)}>
      <div className="flex-shrink-0">
        <h2 className="text-sm font-bold mb-2">Upcoming Week Insights</h2>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-9">
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {isLoading ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </div>

      <div className="mt-4 flex-1 space-y-4">
        {error && (
            <div className="p-4 text-center text-red-400">
                <AlertTriangle className="mx-auto h-6 w-6 mb-2"/>
                <p className="text-sm">{error}</p>
            </div>
        )}
        
        {insights ? (
            <div className="space-y-4 text-xs">
                {/* Prioritized Tasks */}
                <div>
                    <h3 className="font-semibold text-sm mb-2">Top Priority Tasks</h3>
                    <div className="space-y-2">
                        {insights.prioritizedTasks.map((task, i) => (
                            <div key={i} className="p-2 bg-black/20 rounded-md">
                                <p className="font-bold">{task.taskTitle}</p>
                                <p className="text-yellow-300/80 italic text-[11px]">Due: {format(new Date(task.dueDate), 'MMM d')}</p>
                                <p className="mt-1 text-gray-400 text-[11px]">{task.reasoning}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prep for Events */}
                <div>
                    <h3 className="font-semibold text-sm mb-2">Prepare For...</h3>
                    <div className="space-y-2">
                        {insights.prepForEvents.map((event, i) => (
                             <div key={i} className="p-2 bg-black/20 rounded-md">
                                <p className="font-bold">{event.eventName}</p>
                                <p className="text-gray-400 text-[11px]">On: {format(new Date(event.eventDate), 'PPP')}</p>
                                <ul className="mt-2 space-y-1 list-disc list-inside">
                                    {event.suggestedMicroTasks.map((task, j) => <li key={j} className="text-[11px]">{task}</li>)}
                                </ul>
                             </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div>
                    <h3 className="font-semibold text-sm mb-2">Hard Deadlines</h3>
                     <div className="space-y-2">
                        {insights.upcomingDeadlines.map((deadline, i) => (
                             <div key={i} className="p-2 bg-red-900/30 rounded-md border border-red-500/30">
                                <p className="font-bold text-red-200">{deadline.title}</p>
                                <p className="text-red-300/80 text-[11px]">{format(new Date(deadline.date), 'PPP')}</p>
                             </div>
                        ))}
                    </div>
                </div>

            </div>
        ) : (
             !isLoading && <div className="text-center text-xs text-gray-500 pt-8">Click "Generate" to see your prioritized week.</div>
        )}
      </div>
    </div>
  );
}
