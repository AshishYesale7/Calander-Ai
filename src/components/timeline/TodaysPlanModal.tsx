
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateDailyPlan } from '@/ai/flows/generate-daily-plan-flow';
import type { DailyPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { useAuth } from '@/context/AuthContext';
import { getDailyPlan, saveDailyPlan } from '@/services/dailyPlanService';
import { TodaysPlanContent } from './TodaysPlanContent';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { format } from 'date-fns';


interface TodaysPlanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TodaysPlanModal({ isOpen, onOpenChange }: TodaysPlanModalProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndGeneratePlan = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setError("Please sign in to generate a plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      const savedPlan = await getDailyPlan(user.uid, todayStr);
      if (savedPlan) {
        setPlan(savedPlan);
        setIsLoading(false);
        return;
      }

      // The AI flow now fetches its own data.
      const result = await generateDailyPlan({
        apiKey,
        currentDate: new Date().toISOString(),
        userId: user.uid
      });

      await saveDailyPlan(user.uid, todayStr, result);
      setPlan(result);
    } catch (err: any) {
      console.error('Error generating daily plan in modal:', err);
      let errorMessage = err.message || "Failed to generate daily plan. Please try again later.";
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
    if (isOpen) {
      fetchAndGeneratePlan();
    }
  }, [isOpen, fetchAndGeneratePlan]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">The AI is crafting your personalized plan...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-destructive">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="font-semibold">Could not generate plan</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (plan) {
      // The modal always shows today's plan, so we can pass a new Date()
      // onStatusChange is omitted, so checkboxes will be read-only
      return <TodaysPlanContent plan={plan} displayDate={new Date()} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <p>No plan available for today.</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-accent" /> Here's Your Plan for Today!
          </DialogTitle>
          <DialogDescription>
            A quick look at your AI-generated goals and schedule to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {renderContent()}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Let's Get Started!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
