
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import EventCalendarView from '../timeline/EventCalendarView';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ReactGridLayout = WidthProvider(RGL);

const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];

const useResizeObserver = (
  ref: React.RefObject<HTMLDivElement>,
  onResize: (height: number) => void
) => {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        onResize(entry.contentRect.height);
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, onResize]);
};

const GridItemWrapper = ({ id, onHeightChange, children }: { id: string, onHeightChange: (id: string, h: number) => void, children: React.ReactNode }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleResize = useCallback((height: number) => {
        const newGridHeight = Math.ceil((height + MARGIN[1]) / (ROW_HEIGHT + MARGIN[1]));
        onHeightChange(id, newGridHeight);
    }, [id, onHeightChange]);

    useResizeObserver(contentRef, handleResize);

    return <div ref={contentRef} className="h-full w-full">{children}</div>;
};

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children
}: any) {
  const { user } = useAuth();
  
  const initialLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 7, w: 12, h: 3, minW: 6, minH: 3 },
  ];
  
  const professionalLayout = initialLayout.filter(item => item.i !== 'streak');
  
  const [layout, setLayout] = useState(user?.userType === 'professional' ? professionalLayout : initialLayout);

  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    setLayout(newLayout);
  };
  
  const handleGridItemHeightChange = useCallback((id: string, h: number) => {
      setLayout(currentLayout => {
          const itemIndex = currentLayout.findIndex(item => item.i === id);
          if (itemIndex === -1) return currentLayout;
          
          const item = currentLayout[itemIndex];
          // Only update if the height is different and greater than minH
          if (item.h !== h && h >= (item.minH || 0)) {
              const newLayout = [...currentLayout];
              newLayout[itemIndex] = { ...item, h: h };
              return newLayout;
          }
          return currentLayout;
      });
  }, []);

  const components: { [key: string]: React.ReactNode } = {
    plan: <TodaysPlanCard />,
    streak: <DailyStreakCard />,
    calendar: <EventCalendarView events={activeEvents} month={activeDisplayMonth} onMonthChange={onMonthChange} onDayClick={onDayClick} onSync={onSync} isSyncing={isSyncing} onToggleTrash={onToggleTrash} isTrashOpen={isTrashOpen} />,
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  };
  
  return (
    <div className="relative">
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
      >
        {layout.map(item => {
          return (
            <div
              key={item.i}
              className="frosted-glass rounded-lg relative group transition-all duration-300 overflow-visible"
            >
              <div className="drag-handle absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-muted-foreground/30 rounded-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <GridItemWrapper id={item.i} onHeightChange={handleGridItemHeightChange}>
                 {components[item.i]}
               </GridItemWrapper>
            </div>
          )
        })}
      </ReactGridLayout>
      {children}
    </div>
  );
}
