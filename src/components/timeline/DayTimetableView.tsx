
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { XCircle, Maximize, Palette } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import MaximizedPlannerView from '@/components/planner/MaximizedPlannerView';
import PlannerDayView from '@/components/planner/PlannerDayView';

type TimetableViewTheme = 'default' | 'professional' | 'wood';

interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

export default function DayTimetableView({
  date: initialDate,
  events: allEvents,
  onClose,
  onDeleteEvent,
  onEditEvent,
  onEventStatusChange,
}: DayTimetableViewProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');
  
  const [maximizedViewTheme, setMaximizedViewTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('planner-view-theme') as 'light' | 'dark') || 'dark';
  });

  const eventsForDayView = useMemo(() => {
    return allEvents.filter(event =>
        event.date instanceof Date && !isNaN(event.date.valueOf()) &&
        isSameDay(event.date, initialDate)
    );
  }, [allEvents, initialDate]);

  const handleDrop = () => {};
  const handleDragOver = () => {};

  if (isMaximized) {
    return (
        <MaximizedPlannerView 
            initialDate={initialDate}
            allEvents={allEvents}
            onMinimize={() => setIsMaximized(false)}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
        />
    );
  }

  return (
    <Card 
      className={cn(
        "frosted-glass w-full shadow-xl flex flex-col transition-all duration-300",
        "max-h-[70vh]"
      )}
      data-theme={viewTheme}
    >
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-xl text-primary">
            {format(initialDate, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>Hourly schedule. Scroll to see all hours and events.</CardDescription>
        </div>
        <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Theme settings">
                  <Palette className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 frosted-glass">
                <RadioGroup value={viewTheme} onValueChange={(v) => setViewTheme(v as TimetableViewTheme)}>
                  <div className="space-y-1">
                    <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                      <RadioGroupItem value="default" id="t-default" />
                      <span>Default</span>
                    </Label>
                      <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                      <RadioGroupItem value="professional" id="t-prof" />
                      <span>Professional</span>
                    </Label>
                      <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                      <RadioGroupItem value="wood" id="t-wood" />
                      <span>Wood Plank</span>
                    </Label>
                  </div>
                </RadioGroup>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(true)} aria-label="Maximize view">
                <Maximize className="h-6 w-6 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
              <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
            </Button>
        </div>
      </CardHeader>
      <PlannerDayView
        date={initialDate}
        events={allEvents}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
        viewTheme={maximizedViewTheme}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        ghostEvent={null}
      />
    </Card>
  );
}
