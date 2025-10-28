
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Responsive, WidthProvider, type Layouts } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { defaultLayouts, responsiveStudentLayouts, responsiveProfessionalLayouts } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const ROW_HEIGHT = 100; // The height of one grid row in pixels.

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

  const handleLayoutChange = (currentLayout: RGL.Layout[], allLayouts: Layouts) => {
    const layoutKey = getLayoutKey();
    if (layoutKey && isLayoutLoaded) {
        try {
            // We save all breakpoint layouts to preserve responsiveness
            localStorage.setItem(layoutKey, JSON.stringify(allLayouts));
            setLayouts(allLayouts); // Update state with all layouts
        } catch (error) {
            toast({
              title: "Layout Save Error",
              description: "Could not save your widget layout.",
              variant: "destructive"
            });
        }
    }
  };

  const updatePlanWidgetHeight = useCallback((contentHeight: number, breakpoint: string) => {
    setLayouts(currentLayouts => {
        const newLayouts = { ...currentLayouts };
        const currentBreakpointLayout = newLayouts[breakpoint] || [];
        
        const newBreakpointLayout = currentBreakpointLayout.map(item => {
            if (item.i === 'plan') {
                const requiredPixels = contentHeight + 80 + 48; // header + padding
                const newHeightInUnits = Math.ceil(requiredPixels / ROW_HEIGHT);
                return { ...item, h: Math.max(2, newHeightInUnits) };
            }
            return item;
        });

        newLayouts[breakpoint] = newBreakpointLayout;
        
        // Also apply a compact height for other breakpoints to avoid layout shifts on resize
        for (const bp in newLayouts) {
            if (bp !== breakpoint) {
                newLayouts[bp] = newLayouts[bp].map(item => {
                    if (item.i === 'plan') {
                        return { ...item, h: 2 }; // Set to collapsed height
                    }
                    return item;
                });
            }
        }
        
        // Persist the change
        const layoutKey = getLayoutKey();
        if (layoutKey) {
            localStorage.setItem(layoutKey, JSON.stringify(newLayouts));
        }

        return newLayouts;
    });
}, [getLayoutKey]);

  const handleAccordionToggle = (isOpen: boolean, contentHeight: number, breakpoint: string) => {
    if (isOpen) {
        updatePlanWidgetHeight(contentHeight, breakpoint);
    } else {
        // Reset to default collapsed height on all breakpoints
        setLayouts(currentLayouts => {
            const newLayouts = { ...currentLayouts };
            for (const bp in newLayouts) {
                newLayouts[bp] = newLayouts[bp].map(item => {
                    if (item.i === 'plan') {
                        // Use default height from the template
                        const defaultH = getDefaultLayouts()[bp as keyof Layouts]?.find(l => l.i === 'plan')?.h || 2;
                        return { ...item, h: defaultH };
                    }
                    return item;
                });
            }
            const layoutKey = getLayoutKey();
            if (layoutKey) {
                localStorage.setItem(layoutKey, JSON.stringify(newLayouts));
            }
            return newLayouts;
        });
    }
  };

  const components: { [key: string]: React.ReactNode } = useMemo(() => ({
    plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
    streak: <DailyStreakCard />,
    calendar: calendarWidget,
    timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
    emails: <ImportantEmailsCard />,
    'next-month': <NextMonthHighlightsCard events={activeEvents} />,
  }), [handleAccordionToggle, calendarWidget, activeEvents, onDeleteEvent, onEditEvent, activeDisplayMonth, onNavigateMonth]);
  
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
      >
        {finalLayouts.lg?.map(item => {
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
