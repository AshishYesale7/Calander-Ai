
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { responsiveStudentLayouts, responsiveProfessionalLayouts } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';
import { saveLayout, getLayout } from '@/services/layoutService';
import DayTimetableViewWidget from '@/components/timeline/DayTimetableViewWidget';

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];

// --- NEW HELPER FUNCTIONS ---
const PIXEL_TO_GRID_UNITS = {
  MIN_W_PX: 280,
  MIN_H_PX: 200,
  TIMETABLE_MIN_H_PX: 500, // Increased from 400
};

// Calculates the minimum width in grid units based on a pixel value
const calculateMinW = (colWidth: number): number => {
  if (colWidth <= 0) return 1;
  const { MIN_W_PX } = PIXEL_TO_GRID_UNITS;
  const contentWidth = MIN_W_PX - MARGIN[0];
  const gridUnits = Math.max(1, Math.ceil(contentWidth / (colWidth + MARGIN[0])));
  return gridUnits;
};

// Calculates the minimum height in grid units based on a pixel value
const calculateMinH = (isTimetable: boolean): number => {
  const { MIN_H_PX, TIMETABLE_MIN_H_PX } = PIXEL_TO_GRID_UNITS;
  const targetHeight = isTimetable ? TIMETABLE_MIN_H_PX : MIN_H_PX;
  const contentHeight = targetHeight - MARGIN[1];
  const gridUnits = Math.max(1, Math.ceil(contentHeight / (ROW_HEIGHT + MARGIN[1])));
  return gridUnits;
};
// --- END NEW HELPER FUNCTIONS ---


export default function WidgetDashboard({
    activeEvents, onMonthChange, onDayClick, onSync,
    isSyncing, onToggleTrash, isTrashOpen, activeDisplayMonth,
    onNavigateMonth, onDeleteEvent, onEditEvent, handleOpenEditModal,
    calendarWidget,
    dayTimetableWidget
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLayoutKey = useCallback(() => user ? `dashboard-layouts-${user.uid}` : null, [user]);
  
  const getDefaultLayouts = useCallback(() => {
    return user?.userType === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts;
  }, [user?.userType]);

  const [layouts, setLayouts] = useState<Layouts>(getDefaultLayouts());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [currentCols, setCurrentCols] = useState(12);
  const [currentContainerWidth, setCurrentContainerWidth] = useState(0);
  
  const layoutInitialized = useRef(false);

  useEffect(() => {
    const loadLayouts = async () => {
      const layoutKey = getLayoutKey();
      if (!layoutKey) {
        setLayouts(getDefaultLayouts());
        setIsLayoutLoaded(true);
        return;
      }
      
      try {
          const savedLayoutsLocal = localStorage.getItem(layoutKey);
          if (savedLayoutsLocal) {
            setLayouts(JSON.parse(savedLayoutsLocal));
          } else {
             const savedLayoutsFirestore = await getLayout(user!.uid);
             if (savedLayoutsFirestore) {
                setLayouts(savedLayoutsFirestore);
                localStorage.setItem(layoutKey, JSON.stringify(savedLayoutsFirestore));
             } else {
                setLayouts(getDefaultLayouts());
             }
          }
      } catch (e) {
          console.warn("Could not parse layouts from storage. Using default.", e);
          setLayouts(getDefaultLayouts());
      } finally {
          setIsLayoutLoaded(true);
      }
    };

    if (!layoutInitialized.current && user) {
        loadLayouts();
        layoutInitialized.current = true;
    }
  }, [user, getLayoutKey, getDefaultLayouts]);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const layoutKey = getLayoutKey();
    if (layoutKey && isLayoutLoaded) {
        try {
            localStorage.setItem(layoutKey, JSON.stringify(allLayouts));
            saveLayout(user!.uid, allLayouts).catch(err => {
                toast({
                  title: "Layout Sync Error",
                  description: "Could not save your widget layout to the cloud.",
                  variant: "destructive"
                });
            });
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
                const requiredPixels = contentHeight + 80;
                const requiredRows = Math.ceil(requiredPixels / (ROW_HEIGHT + MARGIN[1]));
                return { ...item, h: Math.max(2, requiredRows) };
            } else {
                const defaultH = getDefaultLayouts()[currentBreakpoint as keyof Layouts]?.find(l => l.i === 'plan')?.h || 2;
                return { ...item, h: defaultH };
            }
        }
        return item;
    });
    
    const newLayouts = { ...layouts, [currentBreakpoint]: newLayout };
    handleLayoutChange(newLayout, newLayouts);
  }, [layouts, currentBreakpoint, getDefaultLayouts, handleLayoutChange]);

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
    'day-timetable': dayTimetableWidget,
  }), [handleAccordionToggle, calendarWidget, activeEvents, onDeleteEvent, onEditEvent, activeDisplayMonth, onNavigateMonth, dayTimetableWidget]);

  const colWidth = (currentContainerWidth - (currentCols + 1) * MARGIN[0]) / currentCols;

  const getLayoutWithDynamicMins = (breakpoint: string) => {
    const layout = finalLayouts[breakpoint] || [];
    if (breakpoint === 'lg') {
        return layout;
    }
    const minW = calculateMinW(colWidth);
    return layout.map(item => ({
        ...item,
        minW,
        minH: calculateMinH(item.i === 'day-timetable'),
    }));
  };

  const layoutsWithDynamicMins = useMemo(() => {
    const newLayouts: Layouts = {};
    for (const breakpoint in finalLayouts) {
        newLayouts[breakpoint] = getLayoutWithDynamicMins(breakpoint);
    }
    return newLayouts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBreakpoint, colWidth, finalLayouts]);

  if (!isLayoutLoaded) {
      return null;
  }
  
  return (
    <div className="relative">
      <ResponsiveReactGridLayout
        className="layout"
        layouts={layoutsWithDynamicMins}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(newBreakpoint, newCols) => {
            setCurrentBreakpoint(newBreakpoint);
            setCurrentCols(newCols);
        }}
        onWidthChange={(containerWidth) => {
            setCurrentContainerWidth(containerWidth);
        }}
      >
        {(finalLayouts[currentBreakpoint] || []).map(item => {
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
      </ResponsiveReactGridLayout>
    </div>
  );
}
