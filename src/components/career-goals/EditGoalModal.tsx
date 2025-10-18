
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CareerGoal } from "@/types";
import { useEffect } from "react";

const goalFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  progress: z.number().min(0).max(100),
  deadline: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface EditGoalModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goalToEdit: CareerGoal | null;
  onSave: (goal: CareerGoal) => void;
}

export default function EditGoalModal({ isOpen, onOpenChange, goalToEdit, onSave }: EditGoalModalProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      progress: 0,
      deadline: undefined,
    },
  });

  useEffect(() => {
    if (goalToEdit) {
      form.reset({
        title: goalToEdit.title,
        description: goalToEdit.description || '',
        progress: goalToEdit.progress,
        deadline: goalToEdit.deadline ? new Date(goalToEdit.deadline) : undefined,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        progress: 0,
        deadline: undefined,
      });
    }
  }, [goalToEdit, form, isOpen]);

  const handleSubmit = (values: GoalFormValues) => {
    const goalData: CareerGoal = {
      id: goalToEdit?.id || `goal-${Date.now()}`,
      ...values,
      progress: values.progress ?? 0,
    };
    onSave(goalData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">{goalToEdit ? 'Edit Career Goal' : 'Add New Career Goal'}</DialogTitle>
          <DialogDescription>
            {goalToEdit ? "Update the details of your career goal." : "Define a new goal to track your progress."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Master React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add more details about your goal..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Goal</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
