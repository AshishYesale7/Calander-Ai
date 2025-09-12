
'use client';
import type { DailyPlan } from '@/types';
import { CheckSquare, Calendar, Quote, Brain, AlertTriangle } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { useEffect, useState } from 'react';
import { isToday as dfnsIsToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { logUserActivity } from '@/services/activityLogService';


interface TodaysPlanContentProps {
  plan: DailyPlan;
  displayDate: Date;
  onStatusChange?: (itemIndex: number, newStatus: 'completed' | 'missed') => void;
}

export function TodaysPlanContent({ plan, displayDate, onStatusChange }: TodaysPlanContentProps) {
  const [now, setNow] = useState(new Date());
  const isToday = dfnsIsToday(displayDate);
  const { user } = useAuth();


  useEffect(() => {
    if (isToday) {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }
  }, [isToday]);

  const currentHour = isToday ? now.getHours() : -1;

  return (
    <div className="space-y-6">
      {plan.reminders && plan.reminders.length > 0 && (
        <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center text-yellow-400">
                <AlertTriangle className="mr-2 h-5 w-5" /> Important Reminders
            </h3>
            <ul className="space-y-1 pl-0">
            {plan.reminders.map((reminder, index) => (
                <li key={index} className="text-sm text-yellow-300/90 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                    <span>{reminder}</span>
                </li>
            ))}
            </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Brain className="mr-2 h-5 w-5 text-accent" /> Micro-Goals
        </h3>
        <ul className="space-y-1 pl-0">
          {plan.microGoals.map((goal, index) => (
            <li key={index} className="text-sm text-foreground/90 flex items-start">
              <CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Calendar className="mr-2 h-5 w-5 text-accent" /> Schedule
        </h3>
        <ul className="space-y-2">
          {plan.schedule.map((item, index) => {
            const isRange = item.time.includes('-');
            
            if (isRange) {
              return (
                 <li key={`${item.id}-${index}`} className="text-sm text-foreground/90 flex items-center py-1">
                    <Checkbox id={`plan-item-${item.id}`} className="mr-3 opacity-0 cursor-default" disabled />
                    <label htmlFor={`plan-item-${item.id}`} className="flex items-center">
                        <span className="font-medium w-36 text-accent/90">{item.time}</span>
                        <span>{item.activity}</span>
                    </label>
                </li>
              )
            }

            const timeParts = item.time.match(/(\d+):(\d+)\s(AM|PM)/);
            if (!timeParts) return null;

            const [, hours, minutes, period] = timeParts;
            let hour24 = parseInt(hours, 10);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0; // Midnight case

            const isPast = isToday && hour24 < currentHour;
            const isCurrent = isToday && hour24 === currentHour;
            
            // The item is checked if its status is 'completed'.
            // For items that are still 'pending', they will appear checked if they are in the past,
            // giving the user a chance to mark them as 'missed' if they were not done.
            const isChecked = item.status === 'completed' || (item.status !== 'missed' && isPast);

            const handleCheckboxChange = (checked: boolean) => {
                if (onStatusChange) {
                    const newStatus = checked ? 'completed' : 'missed';
                     if (newStatus === 'completed' && user) {
                        logUserActivity(user.uid, 'task_completed', { title: item.activity });
                    }
                    onStatusChange(index, newStatus);
                }
            };

            return (
              <li key={`${item.id}-${index}`} className={cn("text-sm text-foreground/90 flex items-center relative pl-4 py-1", isCurrent && "text-accent font-semibold")}>
                {isCurrent && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                )}
                <Checkbox 
                    id={`plan-item-${item.id}-${index}`}
                    className="mr-3" 
                    checked={isChecked}
                    onCheckedChange={handleCheckboxChange}
                    disabled={!onStatusChange}
                />
                <label htmlFor={`plan-item-${item.id}-${index}`} className="flex items-center cursor-pointer">
                  <span className="font-medium w-24">{item.time}</span>
                  <span>{item.activity}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Quote className="mr-2 h-5 w-5 text-accent" /> Motivational Spark
        </h3>
        <blockquote className="border-l-4 border-accent pl-4 italic text-sm text-foreground/90">
          {plan.motivationalQuote}
        </blockquote>
      </div>
    </div>
  );
}
