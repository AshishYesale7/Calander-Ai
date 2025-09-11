
'use client';

import type { TimelineEvent, RawGoogleTask } from '@/types';
import PlannerDayView from './PlannerDayView';
import type { MaxViewTheme } from '../timeline/DayTimetableView';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlannerWeeklyViewProps {
    week: Date[];
    events: TimelineEvent[];
    viewTheme: MaxViewTheme;
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
    onDeleteEvent?: (eventId: string) => void;
    ghostEvent: { date: Date; hour: number } | null;
}

export default function PlannerWeeklyView({
    week,
    events,
    viewTheme,
    onDrop,
    onDragOver,
    onEditEvent,
    onDeleteEvent,
    ghostEvent
}: PlannerWeeklyViewProps) {

  const rulerClasses = viewTheme === 'dark' ? 'bg-gray-900/80 border-b border-gray-700/50' : 'bg-[#fff8ed] border-b border-gray-200';
  const dayHeaderClasses = viewTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const gridContainerClasses = viewTheme === 'dark' ? 'bg-gray-800 divide-x divide-gray-700/50' : 'bg-stone-50 divide-x divide-gray-200';

  return (
    <div className="flex flex-col flex-1 min-h-0">
        <div className={cn("flex flex-shrink-0", rulerClasses)}>
            <div className="w-16 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-7">
                {week.map(day => (
                    <div key={day.toISOString()} className={cn("p-2 text-center", dayHeaderClasses)}>
                        <p className="text-xs">{format(day, 'E')}</p>
                        <p className="text-xl font-semibold">{format(day, 'd')}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className={cn("flex-1 grid grid-cols-7 min-h-0 overflow-hidden", gridContainerClasses)}>
            {week.map(day => (
                <PlannerDayView
                    key={day.toISOString()}
                    date={day}
                    events={events}
                    onEditEvent={onEditEvent}
                    onDeleteEvent={onDeleteEvent}
                    viewTheme={viewTheme}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    ghostEvent={ghostEvent}
                />
            ))}
        </div>
    </div>
  );
}
