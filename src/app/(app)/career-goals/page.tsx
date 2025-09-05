
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CareerGoal } from '@/types';
import { mockCareerGoals } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Edit3, PlusCircle, Trash2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditGoalModal from '@/components/career-goals/EditGoalModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getCareerGoals, saveCareerGoal, deleteCareerGoal } from '@/services/careerGoalsService';
import { logUserActivity } from '@/services/activityLogService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CAREER_GOALS_STORAGE_KEY = 'futureSightCareerGoals';

const syncToLocalStorage = (data: CareerGoal[]) => {
  if (typeof window === 'undefined') return;
  try {
    const serializableGoals = data.map(g => ({...g, deadline: g.deadline?.toISOString()}));
    localStorage.setItem(CAREER_GOALS_STORAGE_KEY, JSON.stringify(serializableGoals));
  } catch (error) {
    console.error("Failed to save goals to local storage", error);
  }
};

const loadFromLocalStorage = (): CareerGoal[] => {
  if (typeof window === 'undefined') return mockCareerGoals;
  try {
    const storedGoals = localStorage.getItem(CAREER_GOALS_STORAGE_KEY);
    if (storedGoals) {
      const parsedGoals: (Omit<CareerGoal, 'deadline'> & { deadline?: string })[] = JSON.parse(storedGoals);
      return parsedGoals.map(g => ({...g, deadline: g.deadline ? new Date(g.deadline) : undefined}));
    }
  } catch (error) {
    console.error("Failed to load goals from local storage", error);
  }
  return mockCareerGoals;
};

export default function CareerGoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<CareerGoal[]>(loadFromLocalStorage);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // This effect runs once on mount to sync with Firestore in the background
  useEffect(() => {
    const syncWithFirestore = async () => {
      if (user) {
        try {
          const firestoreGoals = await getCareerGoals(user.uid);
          setGoals(firestoreGoals);
          syncToLocalStorage(firestoreGoals);
        } catch (error) {
          console.error("Failed to fetch from Firestore, using local data.", error);
          toast({ title: "Offline Mode", description: "Could not sync goals. Displaying local data.", variant: "destructive"});
        }
      }
    };
    syncWithFirestore();
  }, [user, toast]);

  const handleOpenModal = (goal: CareerGoal | null) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };
  
  // Effect to handle actions from command palette
  useEffect(() => {
    if (searchParams.get('action') === 'newGoal') {
      handleOpenModal(null);
      // Clear the action from the URL
      router.replace('/career-goals', { scroll: false });
    }
  }, [searchParams, router]);


  const handleDeleteGoal = async (goalId: string) => {
    const originalGoals = goals;
    const newGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(newGoals); // Optimistic update
    
    toast({ title: "Goal Deleted", description: "The career goal has been successfully removed." });
    
    syncToLocalStorage(newGoals);

    if (user) {
      try {
        await deleteCareerGoal(user.uid, goalId);
      } catch (error) {
        console.error("Failed to delete goal from Firestore", error);
        // DO NOT REVERT UI. The change is saved locally.
        toast({ title: "Sync Error", description: "Failed to delete goal from the server. It is removed locally.", variant: "destructive" });
      }
    }
  };

  const handleSaveGoal = async (goalToSave: CareerGoal) => {
    const originalGoals = goals;
    const goalExists = goals.some(g => g.id === goalToSave.id);
    let newGoals: CareerGoal[];

    if (goalExists) {
      newGoals = goals.map(g => g.id === goalToSave.id ? goalToSave : g);
      toast({ title: "Goal Updated", description: "Your career goal has been successfully updated." });
    } else {
      newGoals = [...goals, goalToSave];
      toast({ title: "Goal Added", description: "A new career goal has been successfully added." });
    }

    setGoals(newGoals); // Optimistic update
    setIsModalOpen(false);
    setEditingGoal(null);

    syncToLocalStorage(newGoals);

    if (user) {
        try {
            const payload = {
              ...goalToSave,
              deadline: goalToSave.deadline ? goalToSave.deadline.toISOString() : null,
            };
            await saveCareerGoal(user.uid, payload);

            // If goal is completed, log the activity
            if (goalToSave.progress === 100) {
              const previousGoal = originalGoals.find(g => g.id === goalToSave.id);
              if (!previousGoal || previousGoal.progress < 100) {
                await logUserActivity(user.uid, 'goal_completed', { title: goalToSave.title });
              }
            }

        } catch (error) {
            console.error("Failed to save goal to Firestore", error);
            // DO NOT REVERT UI. The changes are saved locally.
            toast({ title: "Sync Error", description: "Could not save goal to the server. Your changes are saved locally.", variant: "destructive" });
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Career Goals</h1>
        <Button onClick={() => handleOpenModal(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Goal
        </Button>
      </div>
      <p className="text-foreground/80">
        Define your aspirations and track your progress towards achieving them.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="frosted-glass shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Target className="mr-2 h-5 w-5 text-accent" /> {goal.title}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(goal)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this career goal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {goal.deadline && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  Deadline: {format(goal.deadline, 'MMM d, yyyy')}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              {goal.description && <p className="text-sm text-foreground/80 mb-4">{goal.description}</p>}
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-primary">Progress</span>
                  <span className="text-sm font-medium text-accent">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} aria-label={`${goal.title} progress ${goal.progress}%`} className="h-3 [&>div]:bg-accent" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <EditGoalModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        goalToEdit={editingGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
