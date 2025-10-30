'use client';
import NextMonthHighlightsCard from '../../timeline/NextMonthHighlightsCard';
import type { TimelineEvent } from '@/types';

interface NextMonthHighlightsWidgetProps {
  events: TimelineEvent[];
}

export default function NextMonthHighlightsWidget({ events }: NextMonthHighlightsWidgetProps) {
  return <NextMonthHighlightsCard events={events} />;
}
