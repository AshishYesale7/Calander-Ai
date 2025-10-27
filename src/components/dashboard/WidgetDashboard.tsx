
'use client';

import React, { useState } from 'react';
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
const ROW_HEIGHT = 100; // The height of one grid row in pixels.

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children
}: any) {
  const { user } = useAuth();
  
  const professionalLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 0, y: 2, w: 6, h: 3, minW: 3, minH: 3 },
    { i: 'emails', x: 6, y: 5, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 5, w: 6, h: 5, minW: 6, minH: 3 },
  ];

  const studentLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 7, w: 12, h: 3, minW: 6, minH: 3 },
  ];

  const initialLayout = user?.userType === 'professional' ? professionalLayout : studentLayout;

  const [layout, setLayout] = useState(initialLayout);

  const handleAccordionToggle = (isOpen: boolean, contentHeight: number) => {
    setLayout(prevLayout => 
      prevLayout.map(item => {
        if (item.i === 'plan') {
          let newHeightInUnits;
          if (isOpen) {
            // Calculate required height in grid units, adding some padding.
            // 80px is roughly the header height, and 48px is bottom padding.
            const requiredPixels = contentHeight + 80 + 48;
            newHeightInUnits = Math.ceil(requiredPixels / ROW_HEIGHT);
          } else {
            // Return to collapsed height
            newHeightInUnits = 2;
          }
          return { ...item, h: Math.max(2, newHeightInUnits) }; // Ensure minimum height
        }
        return item;
      })
    );
  };
  
  const components: { [key: string]: React.ReactNode } = {
    plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
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
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onLayoutChange={(newLayout) => setLayout(newLayout)}
      >
        {layout.map(item => {
          return (
            <div
              key={item.i}
              className="group relative"
            >
              <div className="drag-handle absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-muted-foreground/30 rounded-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
              <div className={cn("w-full h-full", item.i === 'plan' && 'overflow-hidden')}>
                {components[item.i]}
              </div>
            </div>
          )
        })}
      </ReactGridLayout>
      {children}
    </div>
  );
}
