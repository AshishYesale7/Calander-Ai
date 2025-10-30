'use client';
import SlidingTimelineView from '../../timeline/SlidingTimelineView';
import type { TimelineEvent } from '@/types';

interface SlidingTimelineWidgetProps {
  events: TimelineEvent[];
  onEditEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

export default function SlidingTimelineWidget({ events, onEditEvent, onDeleteEvent }: SlidingTimelineWidgetProps) {
  // This component needs state for month navigation, which should be managed in the main dashboard page.
  // For now, we'll pass a dummy handler.
  return <SlidingTimelineView events={events} currentDisplayMonth={new Date()} onNavigateMonth={() => {}} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />;
}
