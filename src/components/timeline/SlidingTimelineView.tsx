
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, ChevronLeft, ChevronRight, Clock, ExternalLink as LinkIcon, Edit3, Info, History, Hash } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isToday as dfnsIsToday, formatDistanceToNowStrict, isFuture, isPast, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const getEventDotColor = (type: TimelineEvent['type']): string => {
  switch (type) {
    case 'exam': return 'bg-red-500';
    case 'deadline': return 'bg-yellow-500';
    case 'goal': return 'bg-green-500';
    case 'project': return 'bg-blue-500';
    case 'application': return 'bg-purple-500';
    case 'ai_suggestion': return 'bg-teal-500';
    default: return 'bg-gray-500';
  }
};

const getEventTypeStyle = (type: TimelineEvent['type']) => { // For badges
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-700 text-white';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900';
    case 'goal': return 'bg-green-500/80 border-green-700 text-white';
    case 'project': return 'bg-blue-500/80 border-blue-700 text-white';
    case 'application': return 'bg-purple-500/80 border-purple-700 text-white';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-700 text-white';
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};

const getStatusBadgeVariant = (status?: TimelineEvent['status']): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (status) {
    case 'completed':
      return { variant: 'default', className: 'bg-green-500/80 border-green-700 text-white hover:bg-green-600/80' };
    case 'in-progress':
      return { variant: 'default', className: 'bg-blue-500/80 border-blue-700 text-white hover:bg-blue-600/80' };
    case 'missed':
      return { variant: 'destructive', className: 'bg-red-500/80 border-red-700 text-white hover:bg-red-600/80' };
    case 'pending':
    default:
      return { variant: 'secondary', className: 'bg-yellow-500/80 border-yellow-700 text-yellow-900 hover:bg-yellow-600/80' };
  }
};

const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
};

const isMidnight = (date: Date): boolean => {
  if (!(date instanceof Date) || isNaN(date.valueOf())) return true;
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
};

const getCountdownText = (eventDate: Date): string => {
  const now = new Date();
  if (dfnsIsToday(eventDate)) return "Today";
  if (isFuture(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  if (isPast(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  return "";
};

interface SlidingTimelineViewProps {
  events: TimelineEvent[];
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent) => void;
  currentDisplayMonth: Date; 
  onNavigateMonth: (direction: 'prev' | 'next') => void; 
}

export default function SlidingTimelineView({ 
  events: allEventsFromProps, 
  onDeleteEvent,
  onEditEvent,
  currentDisplayMonth,
  onNavigateMonth
}: SlidingTimelineViewProps) {
  const { toast } = useToast();

  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: e.date instanceof Date && !isNaN(e.date.valueOf()) ? e.date : parseISO(e.date as unknown as string) }))
      .sort((a, b) => {
        if (!(a.date instanceof Date) || isNaN(a.date.valueOf())) return 1;
        if (!(b.date instanceof Date) || isNaN(b.date.valueOf())) return -1;
        return a.date.getTime() - b.date.getTime();
      });
  }, [allEventsFromProps]);

  const { pastEvents, upcomingEvents } = useMemo(() => {
    const monthStart = startOfMonth(currentDisplayMonth);
    const monthEnd = endOfMonth(currentDisplayMonth);
    const today = startOfDay(new Date());

    const eventsInMonth = processedEvents.filter(event => {
      if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return false;
      return isWithinInterval(event.date, { start: monthStart, end: monthEnd })
    });

    return {
      pastEvents: eventsInMonth.filter(e => startOfDay(e.date) < today),
      upcomingEvents: eventsInMonth.filter(e => startOfDay(e.date) >= today),
    }
  }, [processedEvents, currentDisplayMonth]);
  
  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed.` });
    }
  };

  const renderEvent = (event: TimelineEvent) => {
    if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return null;
    const statusBadge = getStatusBadgeVariant(event.status);
    const countdownText = getCountdownText(event.date);

    return (
    <div key={event.id} className={cn("flex items-start relative")}>
      <div className="absolute -left-[19px] top-1 flex flex-col items-center z-10">
        <div 
          className={cn(
            "w-3.5 h-3.5 rounded-full border-2 border-background", 
            !event.color && getEventDotColor(event.type)
          )} 
          style={event.color ? { backgroundColor: event.color } : {}}
        />
          <div className="mt-1 text-center">
          <p className="text-xs font-semibold text-primary">{format(event.date, 'dd')}</p>
          <p className="text-xs text-muted-foreground -mt-0.5">{format(event.date, 'MMM')}</p>
        </div>
      </div>
      
      <div className="ml-6 flex-1"> 
          <div className="bg-card/60 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
          <div className="p-3 pb-2">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-semibold text-md text-primary flex items-center">
                {getEventTypeIcon(event)}
                {event.title}
              </h4>
              <div className="flex items-center space-x-1">
                {onEditEvent && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary hover:bg-primary/10" onClick={() => onEditEvent(event)}>
                    <Edit3 className="h-4 w-4" />
                    <span className="sr-only">Edit event</span>
                  </Button>
                )}
                {event.isDeletable && onDeleteEvent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete event</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete "{event.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 gap-2">
              <Badge variant="outline" className={cn("capitalize text-xs py-0 px-1.5 h-auto whitespace-nowrap", getEventTypeStyle(event.type))}>
                {event.type.replace(/_/g, ' ')}
              </Badge>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                  {countdownText && (
                      <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                          <Info className="h-3.5 w-3.5 mr-1" />
                          {countdownText}
                      </span>
                  )}
                  {!event.isAllDay && !isMidnight(event.date) && (
                      <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {format(event.date, 'h:mm a')}
                      </span>
                  )}
              </div>
            </div>
          </div>
          <div className="p-3 pt-1 text-sm space-y-2">
            {event.notes && <p className="text-foreground/80 line-clamp-3">{event.notes}</p>}
            
            <div className="space-y-1">
              {event.status && (
                <div className="text-xs mb-1 flex items-center">
                    Status:
                    <Badge variant={statusBadge.variant} className={cn("capitalize ml-1.5", statusBadge.className)}>
                    {event.status.replace(/-/g, ' ')}
                    </Badge>
                </div>
              )}
              {event.tags && (
                <div className="text-xs text-primary/90 flex items-center gap-1.5">
                  <Hash size={12}/>
                  <span>{event.tags}</span>
                </div>
              )}
              {event.url && (
                <div className="text-xs flex items-center gap-1.5">
                  <a href={event.url} target="_blank" rel="noopener noreferrer" title={event.url} className="text-accent hover:text-accent/80 flex items-center gap-1.5 hover:underline">
                    <LinkIcon size={12} />
                    <span>Link</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <Card 
      className="w-full h-full flex flex-col frosted-glass"
      style={{ minWidth: '320px', minHeight: '400px' }}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => onNavigateMonth('prev')} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="font-headline text-xl text-primary text-center">
            {format(currentDisplayMonth, 'MMMM yyyy')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onNavigateMonth('next')} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
          {(upcomingEvents.length === 0 && pastEvents.length === 0) ? (
            <div className="flex items-center justify-center h-full pt-16">
              <p className="text-foreground/70">No events for {format(currentDisplayMonth, 'MMMM yyyy')}.</p>
            </div>
          ) : (
              <div className="relative pl-5"> 
                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border/70 z-0" />
                <div className="space-y-6">
                  {upcomingEvents.map(event => renderEvent(event))}
                  
                  {pastEvents.length > 0 && (
                    <div className="relative">
                      <div className="absolute -left-[19px] top-4 flex flex-col items-center z-10">
                        <History className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="ml-6 flex-1">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="past-events" className="border-b-0">
                            <AccordionTrigger className="flex-no-wrap -ml-1 py-1 text-sm text-muted-foreground hover:no-underline hover:text-primary focus:text-primary">
                              <span>{pastEvents.length} Past Event(s) in {format(currentDisplayMonth, 'MMMM')}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-6 pt-6 opacity-70 relative">
                                <div className="absolute left-[-11px] top-6 bottom-0 w-0.5 bg-border/70 z-0" />
                                {pastEvents.reverse().map(event => renderEvent(event))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
