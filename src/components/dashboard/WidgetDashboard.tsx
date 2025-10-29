
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
import { responsiveStudentLayouts, responsiveProfessionalLayouts, LAYOUT_VERSION as CODE_LAYOUT_VERSION } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';
import { saveLayout, getLayout, type VersionedLayouts } from '@/services/layoutService';
import DayTimetableViewWidget from '../timeline/DayTimetableViewWidget';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import '@/app/widgets-canvas.css';


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
    setIsPlannerMaximized,
    isEditMode,
    setIsEditMode,
}: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [versionedLayouts, setVersionedLayouts] = useState<VersionedLayouts>({
    version: CODE_LAYOUT_VERSION,
    layouts: user?.userType === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts,
  });

  const [currentLayouts, setCurrentLayouts] = useState<Layouts>(versionedLayouts.layouts);
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [currentCols, setCurrentCols] = useState(12);
  const [currentContainerWidth, setCurrentContainerWidth] = useState(0);
  
  const layoutInitialized = useRef(false);

  const getLayoutKey = useCallback(() => {
    if (!user) return null;
    const role = user.userType || 'student';
    return `dashboard-layouts-${'${user.uid}'}-${'${role}'}`;
  }, [user]);

  const getDefaultLayouts = useCallback(() => {
    const role = user?.userType || 'student';
    return role === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts;
  }, [user?.userType]);

  useEffect(() => {
    const loadLayouts = async () => {
      if (!user || layoutInitialized.current) return;
      layoutInitialized.current = true;
      
      const layoutKey = getLayoutKey();
      const role = user.userType || 'student';

      const localLayoutPromise = new Promise<VersionedLayouts | null>((resolve) => {
        if (layoutKey) {
          const savedLayoutsLocal = localStorage.getItem(layoutKey);
          if (savedLayoutsLocal) {
            try { resolve(JSON.parse(savedLayoutsLocal)); } catch { resolve(null); }
          } else { resolve(null); }
        } else { resolve(null); }
      });
      
      const cloudLayoutPromise = getLayout(user.uid, role);

      const [localResult, cloudResult] = await Promise.all([localLayoutPromise, cloudLayoutPromise]);

      const defaultLayouts: VersionedLayouts = { version: CODE_LAYOUT_VERSION, layouts: getDefaultLayouts() };

      let finalLayouts: VersionedLayouts;
      
      const localVersion = localResult?.version || 0;
      const cloudVersion = cloudResult?.version || 0;
      const codeVersion = CODE_LAYOUT_VERSION;

      if (localVersion >= cloudVersion && localVersion >= codeVersion) {
        finalLayouts = localResult!;
      } else if (cloudVersion > localVersion && cloudVersion >= codeVersion) {
        finalLayouts = cloudResult!;
        if (layoutKey) localStorage.setItem(layoutKey, JSON.stringify(cloudResult));
      } else {
        finalLayouts = defaultLayouts;
        if (layoutKey) localStorage.removeItem(layoutKey);
        if (codeVersion > cloudVersion) {
          saveLayout(user.uid, role, defaultLayouts);
        }
      }
      
      setVersionedLayouts(finalLayouts);
      setCurrentLayouts(finalLayouts.layouts);
      setIsLayoutLoaded(true);
    };

    if(user) loadLayouts();
  }, [user, getLayoutKey, getDefaultLayouts]);

  useEffect(() => {
    return () => {
      if (isLayoutLoaded && user) {
        const role = user.userType || 'student';
        saveLayout(user.uid, role, versionedLayouts).catch(err => {
            console.error("Layout Sync Error on cleanup:", err);
        });
      }
    };
  }, [versionedLayouts, user, isLayoutLoaded]);
  
  const saveCurrentLayout = (newLayouts: Layouts) => {
    if (!isLayoutLoaded || !user) return;
    
    const layoutKey = getLayoutKey();
    if (!layoutKey) return;

    setVersionedLayouts(currentVersionedLayouts => {
      const newVersion = (currentVersionedLayouts.version || 0) + 1;
      const dataToSave: VersionedLayouts = { version: newVersion, layouts: newLayouts };
      try {
          localStorage.setItem(layoutKey, JSON.stringify(dataToSave));
      } catch (error) {
          console.warn("Could not save layout to local storage.", error);
      }
      return dataToSave;
    });
  };

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    if (!isLayoutLoaded) return;
    setCurrentLayouts(allLayouts);
  };

  const handleAccordionToggle = useCallback((isOpen: boolean, contentHeight: number) => {
    const layouts = currentLayouts;
    const currentLayoutForBreakpoint = layouts[currentBreakpoint as keyof Layouts];
    if (!currentLayoutForBreakpoint) return;

    const newLayout = currentLayoutForBreakpoint.map(item => {
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
    setCurrentLayouts(newLayouts);
    saveCurrentLayout(newLayouts);

  }, [currentLayouts, currentBreakpoint]);

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

  const finalLayoutsArray = useMemo(() => {
    const role = user?.userType || 'student';
    const baseLayouts = currentLayouts[currentBreakpoint as keyof Layouts] || getDefaultLayouts()[currentBreakpoint as keyof Layouts];
    
    if (role === 'professional') {
        return baseLayouts.filter(item => item.i !== 'streak');
    }
    return baseLayouts;
  }, [currentLayouts, user?.userType, currentBreakpoint, getDefaultLayouts]);

  const getLayoutWithDynamicMins = useCallback((layout: Layout[]) => {
    if (!layout) return [];
    const minW = calculateMinW(colWidth);
    return layout.map(item => ({
        ...item,
        minW,
        minH: calculateMinH(item.i === 'day-timetable'),
    }));
  }, [colWidth]);

  const layoutsWithDynamicMins = useMemo(() => {
    const newLayouts: Layouts = {};
    for (const breakpoint in currentLayouts) {
        newLayouts[breakpoint] = getLayoutWithDynamicMins(currentLayouts[breakpoint]);
    }
    return newLayouts;
  }, [currentLayouts, getLayoutWithDynamicMins]);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditMode(true);
  };
  
  if (!isLayoutLoaded) {
      return <div className="h-full w-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  
  return (
    <div className="relative" onContextMenu={handleContextMenu}>
      {isEditMode && (
        <div
          className="edit-mode-overlay"
          onClick={() => {
            setIsEditMode(false);
          }}
        />
      )}
      <div className="relative z-20">
        <ResponsiveReactGridLayout
            className="layout"
            layouts={layoutsWithDynamicMins}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={ROW_HEIGHT}
            margin={MARGIN}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType="vertical"
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            onDragStop={(layout) => saveCurrentLayout({ ...currentLayouts, [currentBreakpoint]: layout })}
            onResizeStop={(layout) => saveCurrentLayout({ ...currentLayouts, [currentBreakpoint]: layout })}
            onBreakpointChange={(newBreakpoint, newCols) => {
                setCurrentBreakpoint(newBreakpoint);
                setCurrentCols(newCols);
            }}
            onWidthChange={(containerWidth) => {
                setCurrentContainerWidth(containerWidth);
            }}
        >
            {finalLayoutsArray.map(item => {
            if (!components[item.i]) return null;
            return (
                <div
                key={item.i}
                className="group relative"
                onClick={(e) => {
                    if (isEditMode) e.stopPropagation();
                }}
                >
                {isEditMode && (
                    <div className="remove-widget-button">
                    -
                    </div>
                )}
                <div className="drag-handle absolute top-1 left-1/2 -translate-x-1/2 h-1 w-8 bg-muted-foreground/30 rounded-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                <div className={cn("w-full h-full", item.i === 'plan' && 'overflow-hidden')}>
                    {components[item.i]}
                </div>
                </div>
            )
            })}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
}
