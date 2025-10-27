
'use client';

import { useMemo } from 'react';
import type { TimelineEvent } from '@/types';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { addMonths, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

const getPriorityStyles = (priority: TimelineEvent['priority'] = 'None') => {
    switch (priority) {
        case 'High': return 'bg-purple-600 text-white';
        case 'Medium': return 'bg-blue-500 text-white';
        case 'Low': return 'bg-sky-500 text-white';
        default: return 'hidden';
    }
};

const getStatusStyles = (status: TimelineEvent['status'] = 'pending') => {
    switch(status) {
        case 'completed': return { text: 'Done', className: 'bg-green-500 text-white' };
        case 'in-progress': return { text: 'Working on it', className: 'bg-orange-500 text-white' };
        case 'missed': return { text: 'Stuck', className: 'bg-red-500 text-white' };
        default: return { text: 'Pending', className: 'hidden' };
    }
}

interface NextMonthHighlightsCardProps {
    events: TimelineEvent[];
    className?: string;
}

export default function NextMonthHighlightsCard({ events, className }: NextMonthHighlightsCardProps) {
    const nextMonthEvents = useMemo(() => {
        const now = new Date();
        const nextMonthStart = startOfMonth(addMonths(now, 1));
        const nextMonthEnd = endOfMonth(addMonths(now, 1));

        return events
            .filter(event => {
                if (!event.date) return false;
                return isWithinInterval(event.date, { start: nextMonthStart, end: nextMonthEnd });
            })
            .sort((a, b) => {
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };
                const priorityA = priorityOrder[a.priority || 'None'];
                const priorityB = priorityOrder[b.priority || 'None'];
                if (priorityA !== priorityB) return priorityB - priorityA;
                return a.date.getTime() - b.date.getTime();
            })
            .slice(0, 5);
    }, [events]);

    return (
        <div className={cn("w-full h-full flex flex-col", className)}>
            <CardContent className="p-4 space-y-4 flex-1">
                <div className="flex items-center">
                    <div className="w-1 h-5 bg-primary rounded-full mr-3"></div>
                    <h3 className="font-headline text-xl text-primary">Next month</h3>
                </div>

                {nextMonthEvents.length > 0 ? (
                    <div className="space-y-1 text-sm">
                        {/* Header Row */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-2 py-1 text-xs text-muted-foreground font-semibold">
                            <span className="text-left">TASK</span>
                            <span className="text-center w-20">PRIORITY</span>
                            <span className="text-center w-28">STATUS</span>
                        </div>
                        {/* Event Rows */}
                        {nextMonthEvents.map(event => {
                            const statusInfo = getStatusStyles(event.status);
                            return (
                                <div key={event.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-2 rounded-md hover:bg-background/40 border-b border-border/20 last:border-b-0">
                                    <div className="flex flex-col truncate">
                                        <span className="font-medium truncate">{event.title}</span>
                                        <span className="text-xs text-muted-foreground">{format(event.date, 'MMM d')}</span>
                                    </div>
                                    <div className="w-20 text-center">
                                        <div className={cn('text-xs font-bold px-2 py-1 rounded', getPriorityStyles(event.priority))}>
                                            {event.priority !== 'None' ? event.priority : ''}
                                        </div>
                                    </div>
                                     <div className="w-28 text-center">
                                        <div className={cn('text-xs font-bold px-2 py-1 rounded', statusInfo.className)}>
                                            {statusInfo.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No important events scheduled for next month yet.</p>
                    </div>
                )}
            </CardContent>
        </div>
    );
}
