
'use client';

import type { TimelineEvent } from '@/types';
import DayTimetableView from './DayTimetableView';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface DayTimetableViewWidgetProps {
  date: Date | null;
  events: TimelineEvent[];
  onClose?: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

export default function DayTimetableViewWidget({
  date,
  events,
  onClose,
  onDeleteEvent,
  onEditEvent,
  onEventStatusChange,
}: DayTimetableViewWidgetProps) {
  if (!date) {
    return (
        <Card className="w-full h-full flex flex-col frosted-glass">
            <CardContent className="p-4 flex-1 flex flex-col items-center justify-center text-center">
                 <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                 <h3 className="font-semibold text-lg text-foreground">Hourly Schedule</h3>
                 <p className="text-sm text-muted-foreground mt-1">Select a day on the calendar to see its detailed hourly view.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <DayTimetableView
      date={date}
      events={events}
      onClose={onClose}
      onDeleteEvent={onDeleteEvent}
      onEditEvent={onEditEvent}
      onEventStatusChange={onEventStatusChange}
    />
  );
}
