'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CalendarClock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getTimelineEvents } from '@/services/timelineService';
import type { TimelineEvent } from '@/types';
import { startOfToday, endOfToday, addDays, isWithinInterval, formatDistanceToNowStrict, format } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ScrollArea } from '../ui/scroll-area';

export default function NotificationPanel() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getTimelineEvents(user.uid)
        .then(setEvents)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const upcomingEvents = useMemo(() => {
    const todayStart = startOfToday();
    const nextThreeDaysEnd = endOfToday(addDays(todayStart, 3));
    return events
      .filter(event => 
          !event.deletedAt &&
          event.date && 
          isWithinInterval(event.date, { start: todayStart, end: nextThreeDaysEnd })
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const hasUnread = upcomingEvents.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 frosted-glass p-0">
        <div className="p-4 border-b border-border/30">
            <h3 className="font-headline text-lg text-primary">Notifications</h3>
            <p className="text-sm text-muted-foreground">Upcoming events in the next 3 days.</p>
        </div>
        <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner />
                    </div>
                ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 flex-shrink-0 bg-accent/10 rounded-full flex items-center justify-center">
                                <CalendarClock className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(event.date, 'MMM d, h:mm a')}
                                    <span className="mx-1 text-muted-foreground/50">·</span>
                                    {formatDistanceToNowStrict(event.date, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm">No upcoming events.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
