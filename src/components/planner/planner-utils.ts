'use client';
import type { TimelineEvent } from '@/types';
import { isSameDay } from 'date-fns';

export interface EventWithLayout extends TimelineEvent {
  layout: { top: number; height: number; left: string; width: string; zIndex: number; };
}

export interface LayoutCalculationResult {
  eventsWithLayout: EventWithLayout[];
  maxConcurrentColumns: number;
}

export function calculateEventLayouts(
  timedEvents: TimelineEvent[],
  hourHeightPx: number
): LayoutCalculationResult {
  const minuteHeightPx = hourHeightPx / 60;
  let maxConcurrentColumns = 1;

  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      if (!(startDate instanceof Date) || isNaN(startDate.valueOf())) {
         return null; 
      }
      const start = startDate.getHours() * 60 + startDate.getMinutes();
      let endValue;
      if (endDate && endDate instanceof Date && !isNaN(endDate.valueOf())) {
        if (endDate.getDate() !== startDate.getDate()) {
          endValue = 24 * 60; 
        } else {
          endValue = endDate.getHours() * 60 + endDate.getMinutes();
        }
      } else {
        endValue = start + 60; 
      }
      endValue = Math.max(start + 15, endValue); 
      return {
        ...e,
        originalIndex: idx,
        startInMinutes: start,
        endInMinutes: endValue,
      };
    })
    .filter(e => e !== null) 
    .sort((a, b) => { 
      if (!a || !b) return 0;
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return (b.endInMinutes - b.startInMinutes) - (a.endInMinutes - a.startInMinutes);
    });

  const layoutResults: EventWithLayout[] = [];
  
  let i = 0;
  while (i < events.length) {
    if (!events[i]) { i++; continue; }
    let currentGroup = [events[i]!];
    let maxEndInGroup = events[i]!.endInMinutes;
    for (let j = i + 1; j < events.length; j++) {
      if (!events[j]) continue;
      if (events[j]!.startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]!);
        maxEndInGroup = Math.max(maxEndInGroup, events[j]!.endInMinutes);
      } else {
        break; 
      }
    }
    
    currentGroup.sort((a,b) => a.originalIndex - b.originalIndex);

    const columns: { event: typeof events[0]; columnOrder: number }[][] = [];
    for (const event of currentGroup) {
      if(!event) continue;
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.event!.endInMinutes <= event.startInMinutes) {
          columns[c].push({event, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([{event, columnOrder: columns.length}]);
      }
    }
    
    const numColsInGroup = columns.length;
    maxConcurrentColumns = Math.max(maxConcurrentColumns, numColsInGroup);

    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        if (!event) continue;
        const colIdx = item.columnOrder;
        
        const colWidthPercentage = 100 / numColsInGroup;
        const gapPercentage = numColsInGroup > 1 ? 0.5 : 0; 
        const actualColWidth = colWidthPercentage - (gapPercentage * (numColsInGroup - 1) / numColsInGroup);
        const leftOffset = colIdx * (actualColWidth + gapPercentage);

        layoutResults.push({
          ...event,
          layout: {
            top: event.startInMinutes * minuteHeightPx,
            height: Math.max(15, (event.endInMinutes - event.startInMinutes) * minuteHeightPx), 
            left: `${leftOffset}%`,
            width: `${actualColWidth}%`,
            zIndex: 10 + colIdx, 
          },
        } as EventWithLayout);
      }
    }
    i += currentGroup.length; 
  }
  
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return { eventsWithLayout: layoutResults, maxConcurrentColumns };
}

export function calculateWeeklyEventLayouts(timedEvents: TimelineEvent[]): EventWithLayout[] {
  const HOUR_SLOT_HEIGHT = 50;
  const minuteHeightPx = HOUR_SLOT_HEIGHT / 60;
  
  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      if (!(startDate instanceof Date) || isNaN(startDate.valueOf())) return null;

      const start = startDate.getHours() * 60 + startDate.getMinutes();
      let endValue;
      if (endDate && endDate instanceof Date && !isNaN(endDate.valueOf()) && isSameDay(startDate, endDate)) {
        endValue = endDate.getHours() * 60 + endDate.getMinutes();
      } else {
        endValue = start + 60; // Default to 1 hour
      }
      endValue = Math.max(start + 15, endValue); // Min 15 mins

      return { ...e, originalIndex: idx, startInMinutes: start, endInMinutes: endValue };
    })
    .filter(e => e !== null)
    .sort((a, b) => a!.startInMinutes - b!.startInMinutes || (b!.endInMinutes - b!.startInMinutes) - (a!.endInMinutes - a!.startInMinutes));

  const layoutResults: EventWithLayout[] = [];
  
  let i = 0;
  while (i < events.length) {
    if (!events[i]) { i++; continue; }
    let currentGroup = [events[i]!];
    let maxEndInGroup = events[i]!.endInMinutes;
    for (let j = i + 1; j < events.length; j++) {
      if (!events[j]) continue;
      if (events[j]!.startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]!);
        maxEndInGroup = Math.max(maxEndInGroup, events[j]!.endInMinutes);
      } else { break; }
    }

    const columns: { event: typeof events[0]; columnOrder: number }[][] = [];
    for (const event of currentGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.event!.endInMinutes <= event!.startInMinutes) {
          columns[c].push({event: event!, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([{event: event!, columnOrder: columns.length}]);
      }
    }

    const numColsInGroup = columns.length;
    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        if (!event) continue;
        const colIdx = item.columnOrder;
        
        const colWidthPercentage = 100 / numColsInGroup;
        const gapPercentage = 1;
        const actualColWidth = colWidthPercentage - gapPercentage;
        const leftOffset = colIdx * colWidthPercentage;

        layoutResults.push({
          ...event,
          layout: {
            top: event.startInMinutes * minuteHeightPx,
            height: Math.max(15, (event.endInMinutes - event.startInMinutes) * minuteHeightPx),
            left: `${leftOffset}%`,
            width: `${actualColWidth}%`,
            zIndex: 10 + colIdx,
          },
        } as EventWithLayout);
      }
    }
    i += currentGroup.length;
  }
  return layoutResults;
}