
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

const ReactGridLayout = WidthProvider(RGL);

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children
}: any) {
  const { user } = useAuth();
  
  const initialLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 7, w: 12, h: 3, minW: 6, minH: 3 },
  ];
  
  const layout = user?.userType === 'professional'
    ? initialLayout.filter(item => item.i !== 'streak')
    : initialLayout;
  
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
        rowHeight={100}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
      >
        {layout.map(item => {
          return (
            <div
              key={item.i}
              className="frosted-glass rounded-lg relative group transition-all duration-300 overflow-hidden"
            >
              <div className="drag-handle absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-muted-foreground/30 rounded-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
              {components[item.i]}
            </div>
          )
        })}
      </ReactGridLayout>
      {children}
    </div>
  );
}
