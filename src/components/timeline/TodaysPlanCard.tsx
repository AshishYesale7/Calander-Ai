
'use client';

import { useEffect, useState, useCallback } from 'react';
import { CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Calendar, AlertTriangle, Edit, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { generateDailyPlan } from '@/ai/flows/generate-daily-plan-flow';
import type { DailyPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getDailyPlan, saveDailyPlan } from '@/services/dailyPlanService';
import { getUserPreferences } from '@/services/userService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TodaysPlanContent } from './TodaysPlanContent';
import { format, subDays, addDays, isToday, isTomorrow, isYesterday, startOfDay, differenceInDays } from 'date-fns';
import EditRoutineModal from './EditRoutineModal';
import { logUserActivity } from '@/services/activityLogService';

export default function TodaysPlanCard() {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  
  const [displayDate, setDisplayDate] = useState(new Date());
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isRoutineSetupNeeded, setIsRoutineSetupNeeded] = useState(false);

  const fetchAndGeneratePlan = useCallback(async (date: Date, forceRegenerate: boolean = false) => {
    if (!user) {
      setIsLoading(false);
      setError("Please sign in to generate a plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setIsRoutineSetupNeeded(false);
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      if (!forceRegenerate) {
        const savedPlan = await getDailyPlan(user.uid, dateStr);
        if (savedPlan) {
          setPlan(savedPlan);
          setIsLoading(false);
          return;
        }
      }

      // Explicitly check for user preferences before attempting to generate.
      const userPrefs = await getUserPreferences(user.uid);
      if (!userPrefs) {
        setIsRoutineSetupNeeded(true);
        setIsLoading(false);
        return; 
      }

      const result = await generateDailyPlan({
        apiKey,
        currentDate: date.toISOString(),
        userId: user.uid,
      });
      
      await saveDailyPlan(user.uid, dateStr, result);
      setPlan(result);

    } catch (err: any) {
      console.error('Error in fetchAndGeneratePlan:', err);
      let errorMessage = err.message || "Failed to generate daily plan.";
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
          errorMessage = "The AI model for planning is temporarily overloaded. Please try again in a few moments.";
          toast({ title: "AI Service Unavailable", description: errorMessage, variant: "destructive" });
      } else {
          toast({ title: "Planning Error", description: errorMessage, variant: "destructive" });
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, apiKey, toast]);

  useEffect(() => {
    fetchAndGeneratePlan(displayDate, false);
  }, [fetchAndGeneratePlan, displayDate]);

  const handleRoutineSaved = () => {
    if (user) {
      fetchAndGeneratePlan(displayDate, true);
    }
  };
  
  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return; // It was a button click, don't toggle accordion.
    }
    if (isRoutineSetupNeeded) {
        e.preventDefault();
        setIsRoutineModalOpen(true);
    }
  };

  const handleStatusChange = (itemIndex: number, newStatus: 'completed' | 'missed') => {
    if (!plan || !user) return;
    
    const updatedSchedule = plan.schedule.map((item, index) =>
        index === itemIndex ? { ...item, status: newStatus } : item
    );
    const updatedPlan = { ...plan, schedule: updatedSchedule };
    setPlan(updatedPlan);

    // Log activity if an item is completed
    if (newStatus === 'completed' && user) {
      logUserActivity(user.uid, 'task_completed', { title: updatedPlan.schedule[itemIndex].activity });
    }

    const dateStr = format(displayDate, 'yyyy-MM-dd');
    saveDailyPlan(user.uid, dateStr, updatedPlan)
        .catch(err => {
            toast({
                title: "Sync Error",
                description: "Failed to save plan changes. Your changes are saved locally for this session.",
                variant: 'destructive'
            });
        });
  };

  const handlePrevDay = () => setDisplayDate(prev => subDays(prev, 1));
  const handleNextDay = () => setDisplayDate(prev => addDays(prev, 1));

  const today = startOfDay(new Date());
  const normalizedDisplayDate = startOfDay(displayDate);
  const daysFromToday = differenceInDays(normalizedDisplayDate, today);

  const canGoBack = daysFromToday > -3;
  const canGoForward = daysFromToday < 3;

  const getDisplayDateTitle = (date: Date): string => {
    if (isToday(date)) return "AI-Powered Daily Plan";
    if (isYesterday(date)) return "Yesterday's Plan";
    if (isTomorrow(date)) return "Tomorrow's Plan";
    return `Plan for ${format(date, 'EEEE, MMMM d')}`;
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Checking for plan...</p>
        </div>
      );
    }
    
    if (isRoutineSetupNeeded) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Edit className="h-10 w-10 mb-4 text-accent" />
          <p className="font-semibold text-lg">Set Up Your Weekly Routine</p>
          <p className="text-sm text-muted-foreground my-2">Click the header above or the button below to define your schedule so the AI can generate your plan.</p>
          <Button onClick={() => setIsRoutineModalOpen(true)} className="mt-2">
            <Edit className="mr-2 h-4 w-4" /> Edit Routine
          </Button>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center text-destructive">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="font-semibold">Could not generate plan</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (plan) {
      return <TodaysPlanContent plan={plan} displayDate={displayDate} onStatusChange={handleStatusChange} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
        <p>No plan available for {format(displayDate, 'MMMM d')}.</p>
        <Button onClick={() => fetchAndGeneratePlan(displayDate, true)} className="mt-4">Generate Plan</Button>
      </div>
    );
  };

  return (
    <>
      <div className="w-full frosted-glass shadow-lg rounded-lg">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionPrimitive.Header className="w-full">
              <AccordionPrimitive.Trigger asChild disabled={isRoutineSetupNeeded}>
                <div className="p-4 md:p-6 w-full cursor-pointer group" onClick={handleHeaderClick}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handlePrevDay(); }}
                            disabled={!canGoBack || isLoading}
                            className="h-8 w-8 shrink-0"
                            aria-label="Previous day"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleNextDay(); }}
                            disabled={!canGoForward || isLoading}
                            className="h-8 w-8 shrink-0"
                            aria-label="Next day"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="font-headline text-lg md:text-xl text-primary flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-accent shrink-0" />
                            <span className="truncate">{getDisplayDateTitle(displayDate)}</span>
                          </CardTitle>
                           <CardDescription className="mt-1 truncate">
                              {isRoutineSetupNeeded
                              ? 'Set your weekly routine to get started'
                              : (
                                <>
                                  <span className="hidden md:inline">Your personalized schedule for </span>
                                  <span>{format(displayDate, 'MMMM d, yyyy')}.</span>
                                </>
                              )}
                          </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:pl-0">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchAndGeneratePlan(displayDate, true);
                        }}
                        className="h-8 w-8 p-0 shrink-0"
                        aria-label="Refresh plan"
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-5 w-5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRoutineModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 shrink-0"
                        aria-label="Edit routine"
                      >
                        <Edit className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      {!isRoutineSetupNeeded && (
                        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      )}
                    </div>
                  </div>
                </div>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="px-6 pb-6 pt-0">
              <CardContent className="p-0">
                {renderContent()}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <EditRoutineModal
        isOpen={isRoutineModalOpen}
        onOpenChange={setIsRoutineModalOpen}
        onRoutineSave={handleRoutineSaved}
      />
    </>
  );
}
