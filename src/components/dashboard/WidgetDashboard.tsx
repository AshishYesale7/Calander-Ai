
'use client';

import React, { useState, useEffect } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import EventCalendarView from '../timeline/EventCalendarView';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReactGridLayout = WidthProvider(RGL);

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children
}: any) {
  
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const layout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 7, w: 12, h: 3, minW: 6, minH: 3 },
  ];

  const components: { [key: string]: React.ReactNode } = {
    plan: <TodaysPlanCard />,
    streak: <DailyStreakCard />,
    calendar: <EventCalendarView events={activeEvents} month={activeDisplayMonth} onMonthChange={onMonthChange} onDayClick={onDayClick} onSync={onSync} isSyncing={isSyncing} onToggleTrash={onToggleTrash} isTrashOpen={isTrashOpen} />,
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  };
  
  const handlePointerDown = (id: string) => {
    longPressTimer.current = setTimeout(() => {
        setEditingWidgetId(id);
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setEditingWidgetId(id);
  };
  
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          // If the click is outside any widget's content area, exit edit mode.
          if (!target.closest('.react-grid-item')) {
              setEditingWidgetId(null);
          }
      };

      const handleEscapeKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
              setEditingWidgetId(null);
          }
      };

      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscapeKey);
      };
  }, []);

  return (
    <div className="relative">
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onDragStart={() => setEditingWidgetId(null)}
        onResizeStart={() => setEditingWidgetId(null)}
      >
        {layout.map(item => {
          const isEditing = editingWidgetId === item.i;
          return (
            <div
              key={item.i}
              className={cn(
                "frosted-glass overflow-hidden rounded-lg relative group transition-all duration-300",
                isEditing && "ring-2 ring-blue-500 shadow-2xl"
              )}
              onPointerDown={() => handlePointerDown(item.i)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp} // Clear timer if pointer leaves
              onContextMenu={(e) => handleContextMenu(e, item.i)}
            >
              <div className="drag-handle absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-muted-foreground/30 rounded-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-full h-full pt-4">
                {components[item.i]}
              </div>
              {isEditing && (
                 <div className="widget-resize-handles">
                    <div className="widget-resize-handle nw"></div>
                    <div className="widget-resize-handle n"></div>
                    <div className="widget-resize-handle ne"></div>
                    <div className="widget-resize-handle w"></div>
                    <div className="widget-resize-handle e"></div>
                    <div className="widget-resize-handle sw"></div>
                    <div className="widget-resize-handle s"></div>
                    <div className="widget-resize-handle se"></div>
                </div>
              )}
            </div>
          )
        })}
      </ReactGridLayout>
      {children}
    </div>
  );
}
