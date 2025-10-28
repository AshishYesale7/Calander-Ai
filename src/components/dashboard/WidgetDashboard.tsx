
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
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { saveLayout, getLayout } from '@/services/layoutService';
import { useToast } from '@/hooks/use-toast';

const ReactGridLayout = WidthProvider(RGL);
const ROW_HEIGHT = 100; // The height of one grid row in pixels.
const LAYOUT_STORAGE_KEY = 'dashboard-layout';

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();

  const professionalLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 0, y: 1, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'emails', x: 6, y: 5, w: 6, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 5, w: 6, h: 5, minW: 6, minH: 3 },
  ];

  const studentLayout = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 1, minW: 4, minH: 1 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'calendar', x: 0, y: 1, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 4 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'next-month', x: 0, y: 6, w: 8, h: 3, minW: 6, minH: 3 },
  ];

  const getDefaultLayout = () => user?.userType === 'professional' ? professionalLayout : studentLayout;

  const [layout, setLayout] = useState(getDefaultLayout());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);

  useEffect(() => {
    // Load layout from storage on mount
    const loadLayout = async () => {
      let savedLayout = null;
      // 1. Try local storage first for speed
      try {
        const localLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (localLayout) {
          savedLayout = JSON.parse(localLayout);
        }
      } catch (e) {
        console.warn("Could not parse local layout", e);
      }

      // 2. If user is logged in, try Firestore for cross-device sync
      if (user) {
        try {
          const firestoreLayout = await getLayout(user.uid);
          if (firestoreLayout) {
            savedLayout = firestoreLayout;
          }
        } catch (e) {
          console.warn("Could not fetch layout from Firestore.", e);
        }
      }
      
      // If we have a saved layout, use it. Otherwise, use the default.
      if (savedLayout && Array.isArray(savedLayout)) {
        setLayout(savedLayout);
      } else {
        setLayout(getDefaultLayout());
      }
      setIsLayoutLoaded(true);
    };

    loadLayout();
  }, [user]);

  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    // This function is called by ReactGridLayout on any change
    setLayout(newLayout);
    // Save to local storage for immediate persistence
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.warn("Could not save layout to local storage", e);
    }
    // Save to Firestore for cross-device sync
    if (user) {
      saveLayout(user.uid, newLayout).catch(err => {
        toast({
          title: "Layout Sync Error",
          description: "Could not save your widget layout to the cloud.",
          variant: "destructive"
        })
      });
    }
  };

  const handleAccordionToggle = (isOpen: boolean, contentHeight: number) => {
    const currentLayout = layout; // Use the stateful layout
    const newLayout = currentLayout.map(item => {
      if (item.i === 'plan') {
        let newHeightInUnits;
        if (isOpen) {
          const requiredPixels = contentHeight + 80 + 48; // header + padding
          newHeightInUnits = Math.ceil(requiredPixels / ROW_HEIGHT);
        } else {
          newHeightInUnits = 1; // Collapsed height
        }
        return { ...item, h: Math.max(1, newHeightInUnits) };
      }
      return item;
    });
    setLayout(newLayout);
  };
  
  const components: { [key: string]: React.ReactNode } = {
    plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
    streak: <DailyStreakCard />,
    calendar: <EventCalendarView events={activeEvents} month={activeDisplayMonth} onMonthChange={onMonthChange} onDayClick={onDayClick} onSync={onSync} isSyncing={isSyncing} onToggleTrash={onToggleTrash} isTrashOpen={isTrashOpen} />,
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  };
  
  if (!isLayoutLoaded) {
      return null; // Or a loading spinner
  }

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
        onLayoutChange={handleLayoutChange}
      >
        {layout.map(item => {
          // Only render components that are in the current layout
          if (!components[item.i]) return null;
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
