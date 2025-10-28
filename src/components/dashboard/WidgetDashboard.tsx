
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { defaultLayouts } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';

const ReactGridLayout = WidthProvider(RGL);
const ROW_HEIGHT = 100; // The height of one grid row in pixels.

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children, calendarWidget
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLayoutKey = () => user ? `dashboard-layout-${user.uid}` : null;

  const getDefaultLayout = () => {
    const layout = user?.userType === 'professional' ? defaultLayouts.professional : defaultLayouts.student;
    // Filter out streak card for professionals
    return user?.userType === 'professional' ? layout.filter(item => item.i !== 'streak') : layout;
  };

  const [layout, setLayout] = useState(getDefaultLayout());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);

  useEffect(() => {
    // Load layout from storage on mount
    const loadLayout = () => {
      const layoutKey = getLayoutKey();
      if (!layoutKey) {
        setLayout(getDefaultLayout());
        setIsLayoutLoaded(true);
        return;
      }
      
      try {
          const savedLayout = localStorage.getItem(layoutKey);
          if (savedLayout) {
            setLayout(JSON.parse(savedLayout));
          } else {
            setLayout(getDefaultLayout());
          }
      } catch (e) {
          console.warn("Could not parse layout from localStorage. Using default.", e);
          setLayout(getDefaultLayout());
      } finally {
          setIsLayoutLoaded(true);
      }
    };

    loadLayout();
  }, [user]);

  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    const layoutKey = getLayoutKey();
    if (layoutKey && isLayoutLoaded) { // Only save after initial layout is loaded
        try {
            localStorage.setItem(layoutKey, JSON.stringify(newLayout));
            setLayout(newLayout);
        } catch (error) {
            toast({
              title: "Layout Save Error",
              description: "Could not save your widget layout.",
              variant: "destructive"
            });
        }
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
          newHeightInUnits = 2; // Collapsed height
        }
        return { ...item, h: Math.max(2, newHeightInUnits) };
      }
      return item;
    });
    // This state update will trigger onLayoutChange and save to localStorage
    setLayout(newLayout);
  };
  
  const components: { [key: string]: React.ReactNode } = {
    plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
    streak: <DailyStreakCard />,
    calendar: calendarWidget, // Use the passed calendar widget
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  };
  
  if (!isLayoutLoaded) {
      return null; // Or a loading spinner
  }

  // Filter layout based on user type again to ensure streak card is not shown for professionals
  const finalLayout = user?.userType === 'professional' 
    ? layout.filter(item => item.i !== 'streak') 
    : layout;

  return (
    <div className="relative">
      <ReactGridLayout
        className="layout"
        layout={finalLayout}
        cols={12}
        rowHeight={ROW_HEIGHT}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
      >
        {finalLayout.map(item => {
          // Only render components that are in the current layout
          if (!components[item.i]) return null;
          return (
            <div
              key={item.i}
              className="group relative"
              style={{
                minWidth: item.minW ? `${item.minW * (1200 / 12)}px` : '400px',
                minHeight: item.minH ? `${item.minH * 100}px` : '400px',
              }}
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
