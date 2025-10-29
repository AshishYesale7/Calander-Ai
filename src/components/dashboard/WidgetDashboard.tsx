
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
import { responsiveStudentLayouts, responsiveProfessionalLayouts, LAYOUT_VERSION } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';
import { saveLayout, getLayout } from '@/services/layoutService';
import DayTimetableViewWidget from '@/components/timeline/DayTimetableViewWidget';
import MaximizedPlannerView from '@/components/planner/MaximizedPlannerView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];

const PIXEL_TO_GRID_UNITS = {
  MIN_W_PX: 280,
  MIN_H_PX: 200,
  TIMETABLE_MIN_H_PX: 300,
};

const calculateMinW = (colWidth: number): number => {
  if (colWidth <= 0) return 1;
  const { MIN_W_PX } = PIXEL_TO_GRID_UNITS;
  const contentWidth = MIN_W_PX - MARGIN[0];
  const gridUnits = Math.max(1, Math.ceil(contentWidth / (colWidth + MARGIN[0])));
  return gridUnits;
};

const calculateMinH = (isTimetable: boolean): number => {
  const { MIN_H_PX, TIMETABLE_MIN_H_PX } = PIXEL_TO_GRID_UNITS;
  const targetHeight = isTimetable ? TIMETABLE_MIN_H_PX : MIN_H_PX;
  const contentHeight = targetHeight - MARGIN[1];
  const gridUnits = Math.max(1, Math.ceil(contentHeight / (ROW_HEIGHT + MARGIN[1])));
  return gridUnits;
};

export default function WidgetDashboard({
    activeEvents,
    onMonthChange,
    onDayClick,
    onSync,
    isSyncing,
    onToggleTrash,
    isTrashOpen,
    activeDisplayMonth,
    onNavigateMonth,
    onDeleteEvent,
    onEditEvent,
    handleOpenEditModal,
    calendarWidget,
    selectedDateForDayView,
    closeDayTimetableView,
    handleEventStatusUpdate,
    setIsPlannerMaximized
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLayoutKey = useCallback(() => {
    if (!user) return null;
    const role = user.userType || 'student';
    return `dashboard-layouts-${user.uid}-${role}`;
  }, [user]);

  const getDefaultLayouts = useCallback(() => {
    const role = user?.userType || 'student';
    return role === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts;
  }, [user?.userType]);

  const [layouts, setLayouts] = useState<Layouts>(getDefaultLayouts());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [currentCols, setCurrentCols] = useState(12);
  const [currentContainerWidth, setCurrentContainerWidth] = useState(0);
  
  const layoutInitialized = useRef(false);

  useEffect(() => {
    const loadLayouts = async () => {
      if (!user) {
        setLayouts(getDefaultLayouts());
        setIsLayoutLoaded(true);
        return;
      }
      
      const role = user.userType || 'student';
      const layoutKey = getLayoutKey();

      try {
          if (layoutKey) {
            const savedLayoutsLocal = localStorage.getItem(layoutKey);
            if (savedLayoutsLocal) {
              const parsedLayouts = JSON.parse(savedLayoutsLocal);
              if (parsedLayouts.version === LAYOUT_VERSION) {
                  setLayouts(parsedLayouts.layouts);
                  setIsLayoutLoaded(true);
                  return; 
              }
            }
          }
          
          const savedLayoutsFirestore = await getLayout(user.uid, role);
          if (savedLayoutsFirestore && savedLayoutsFirestore.version === LAYOUT_VERSION) {
             setLayouts(savedLayoutsFirestore.layouts);
             if (layoutKey) {
                localStorage.setItem(layoutKey, JSON.stringify(savedLayoutsFirestore));
             }
          } else {
             setLayouts(getDefaultLayouts());
          }
      } catch (e) {
          console.warn("Could not parse layouts from storage. Using default.", e);
          setLayouts(getDefaultLayouts());
      } finally {
          setIsLayoutLoaded(true);
      }
    };

    if (user && !layoutInitialized.current) {
        loadLayouts();
        layoutInitialized.current = true;
    }
  }, [user, getLayoutKey, getDefaultLayouts]);

  // Effect to save layout to Firestore when component unmounts or user/layouts change
  useEffect(() => {
    // This function will be called on cleanup
    return () => {
      if (layoutInitialized.current && isLayoutLoaded && user) {
        const layoutKey = getLayoutKey();
        const role = user.userType || 'student';
        if (layoutKey) {
            const dataToSave = { version: LAYOUT_VERSION, layouts };
            saveLayout(user.uid, role, dataToSave).catch(err => {
                // We show a toast only if the save fails on cleanup, but don't block.
                console.error("Layout Sync Error on cleanup:", err);
            });
        }
      }
    };
  }, [layouts, user, isLayoutLoaded, getLayoutKey]);


  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const layoutKey = getLayoutKey();
    if (!layoutKey || !isLayoutLoaded || !user) return;
    
    // Save to local storage immediately for a snappy feel
    try {
        const dataToSave = { version: LAYOUT_VERSION, layouts: allLayouts };
        localStorage.setItem(layoutKey, JSON.stringify(dataToSave));
    } catch (error) {
        // Don't toast here as it would be too noisy.
        console.warn("Could not save layout to local storage.", error);
    }
    setLayouts(allLayouts);
  };

  const handleAccordionToggle = useCallback((isOpen: boolean, contentHeight: number) => {
    const currentLayout = layouts[currentBreakpoint as keyof Layouts];
    if (!currentLayout) return;

    const newLayout = currentLayout.map(item => {
        if (item.i === 'plan') {
            if (isOpen) {
                const headerHeight = 80;
                const requiredPixels = contentHeight + headerHeight;
                const requiredRows = Math.ceil(requiredPixels / (ROW_HEIGHT + MARGIN[1]));
                return { ...item, h: Math.max(2, requiredRows) };
            } else {
                return { ...item, h: 1 };
            }
        }
        return item;
    });

    const newLayouts = { ...layouts, [currentBreakpoint]: newLayout };
    handleLayoutChange(newLayout, newLayouts);
  }, [layouts, currentBreakpoint]);

  const components: { [key: string]: React.ReactNode } = useMemo(() => {
      const dayTimetableViewWidget = (
        <DayTimetableViewWidget
            date={selectedDateForDayView}
            events={activeEvents}
            onClose={closeDayTimetableView}
            onDeleteEvent={onDeleteEvent}
            onEditEvent={onEditEvent}
            onEventStatusChange={handleEventStatusUpdate}
            onMaximize={() => setIsPlannerMaximized(true)}
        />
      );

      return {
        plan: <TodaysPlanCard onAccordionToggle={handleAccordionToggle} />,
        streak: <DailyStreakCard />,
        calendar: calendarWidget,
        timeline: <SlidingTimelineView events={activeEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={onNavigateMonth} />,
        emails: <ImportantEmailsCard />,
        'next-month': <NextMonthHighlightsCard events={activeEvents} />,
        'day-timetable': dayTimetableViewWidget,
    }
  }, [handleAccordionToggle, calendarWidget, activeEvents, onDeleteEvent, onEditEvent, activeDisplayMonth, onNavigateMonth, selectedDateForDayView, closeDayTimetableView, handleEventStatusUpdate, setIsPlannerMaximized]);

  const colWidth = (currentContainerWidth - (currentCols + 1) * MARGIN[0]) / currentCols;

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

  const getLayoutWithDynamicMins = useCallback((breakpoint: string) => {
    const layout = finalLayouts[breakpoint as keyof Layouts] || [];
    const minW = calculateMinW(colWidth);
    return layout.map(item => ({
        ...item,
        minW,
        minH: calculateMinH(item.i === 'day-timetable'),
    }));
  }, [colWidth, finalLayouts]);

  const layoutsWithDynamicMins = useMemo(() => {
    const newLayouts: Layouts = {};
    for (const breakpoint in finalLayouts) {
        newLayouts[breakpoint] = getLayoutWithDynamicMins(breakpoint);
    }
    return newLayouts;
  }, [currentBreakpoint, getLayoutWithDynamicMins, finalLayouts]);

  if (!isLayoutLoaded) {
      return <div className="h-full w-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
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
        {(finalLayouts[currentBreakpoint as keyof Layouts] || []).map(item => {
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
