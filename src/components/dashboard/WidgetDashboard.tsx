
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Responsive, WidthProvider, type Layouts } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { responsiveStudentLayouts, responsiveProfessionalLayouts } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';
import type { Layout } from 'react-grid-layout';


const ResponsiveReactGridLayout = WidthProvider(Responsive);
const ROW_HEIGHT = 100;

export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    children, calendarWidget
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLayoutKey = () => user ? `dashboard-layouts-${user.uid}` : null;
  
  const getDefaultLayouts = useCallback(() => {
    return user?.userType === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts;
  }, [user?.userType]);

  const [layouts, setLayouts] = useState<Layouts>(getDefaultLayouts());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  useEffect(() => {
    const loadLayouts = () => {
      const layoutKey = getLayoutKey();
      if (!layoutKey) {
        setLayouts(getDefaultLayouts());
        setIsLayoutLoaded(true);
        return;
      }
      
      try {
          const savedLayouts = localStorage.getItem(layoutKey);
          if (savedLayouts) {
            setLayouts(JSON.parse(savedLayouts));
          } else {
            setLayouts(getDefaultLayouts());
          }
      } catch (e) {
          console.warn("Could not parse layouts from localStorage. Using default.", e);
          setLayouts(getDefaultLayouts());
      } finally {
          setIsLayoutLoaded(true);
      }
    };

    loadLayouts();
  }, [user, getDefaultLayouts]);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const layoutKey = getLayoutKey();
    if (layoutKey && isLayoutLoaded) {
        try {
            localStorage.setItem(layoutKey, JSON.stringify(allLayouts));
            setLayouts(allLayouts);
        } catch (error) {
            toast({
              title: "Layout Save Error",
              description: "Could not save your widget layout.",
              variant: "destructive"
            });
        }
    }
  };

  const handleAccordionToggle = useCallback((isOpen: boolean, contentHeight: number) => {
    const currentLayouts = layouts[currentBreakpoint];
    if (!currentLayouts) return;
    
    const newLayout = currentLayouts.map(item => {
        if (item.i === 'plan') {
            if (isOpen) {
                // Margins (top/bottom) are 16px each. Row height is 100px.
                const requiredPixels = contentHeight + 80; // Header + padding
                const requiredRows = Math.ceil(requiredPixels / (ROW_HEIGHT + 16));
                return { ...item, h: Math.max(2, requiredRows) };
            } else {
                // Reset to default collapsed height
                const defaultH = getDefaultLayouts()[currentBreakpoint as keyof Layouts]?.find(l => l.i === 'plan')?.h || 2;
                return { ...item, h: defaultH };
            }
        }
        return item;
    });
    
    const newLayouts = { ...layouts, [currentBreakpoint]: newLayout };
    setLayouts(newLayouts);
    // Persist this change
    const layoutKey = getLayoutKey();
    if(layoutKey) localStorage.setItem(layoutKey, JSON.stringify(newLayouts));
  }, [layouts, currentBreakpoint, getLayoutKey, getDefaultLayouts]);

  const finalLayouts = useMemo(() => {
    if (user?.userType === 'professional') {
        const newLayouts: Layouts = {};
        for (const breakpoint in layouts) {
            newLayouts[breakpoint] = layouts[breakpoint].filter(item => item.i !== 'streak');
        }
        return newLayouts;
    }
    return layouts;
  }, [layouts, user?.userType]);

  const components: { [key: string]: React.ReactNode } = useMemo(() => ({
    plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
    streak: <DailyStreakCard />,
    calendar: calendarWidget,
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  }), [handleAccordionToggle, calendarWidget, activeEvents, onDeleteEvent, onEditEvent, activeDisplayMonth, onNavigateMonth]);

  if (!isLayoutLoaded) {
      return null;
  }
  
  return (
    <div className="relative">
      <ResponsiveReactGridLayout
        className="layout"
        layouts={finalLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={ROW_HEIGHT}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(newBreakpoint) => setCurrentBreakpoint(newBreakpoint)}
      >
        {(finalLayouts[currentBreakpoint] || []).map(item => {
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
      </ResponsiveReactGridLayout>
      {children}
    </div>
  );
}
