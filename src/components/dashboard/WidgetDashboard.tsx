
'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { responsiveStudentLayouts, responsiveProfessionalLayouts, LAYOUT_VERSION as CODE_LAYOUT_VERSION } from '@/data/layout-data';
import { useToast } from '@/hooks/use-toast';
import { saveLayout, getLayout, type VersionedLayouts } from '@/services/layoutService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import '@/app/widgets-canvas.css';
import { widgetList } from '@/components/layout/widget-previews';

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


interface WidgetDashboardProps {
  components: { [key: string]: ReactNode };
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  hiddenWidgets?: Set<string>;
  onToggleWidget: (id: string) => void;
}

export default function WidgetDashboard({ components, isEditMode, setIsEditMode, hiddenWidgets = new Set(), onToggleWidget }: WidgetDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [currentCols, setCurrentCols] = useState(12);
  const [currentContainerWidth, setCurrentContainerWidth] = useState(0);

  const getDefaultLayouts = useCallback(() => {
    const role = user?.userType || 'student';
    return role === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts;
  }, [user?.userType]);

  const [versionedLayouts, setVersionedLayouts] = useState<VersionedLayouts>({
    version: CODE_LAYOUT_VERSION,
    layouts: getDefaultLayouts(),
    hidden: [],
  });

  const [currentLayouts, setCurrentLayouts] = useState<Layouts>(versionedLayouts.layouts);
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const layoutInitialized = useRef(false);
  
  const [debouncedLayouts, setDebouncedLayouts] = useState<Layouts | null>(null);

  useEffect(() => {
    if (debouncedLayouts && user) {
      const handler = setTimeout(() => {
        const layoutKey = `dashboard-layouts-${user.uid}-${user.userType || 'student'}`;
        const newVersion = (versionedLayouts.version || 0) + 1;
        const dataToSave: VersionedLayouts = { 
          version: newVersion, 
          layouts: debouncedLayouts, 
          hidden: Array.from(hiddenWidgets) 
        };

        setVersionedLayouts(dataToSave);
        localStorage.setItem(layoutKey, JSON.stringify(dataToSave));

        saveLayout(user.uid, user.userType || 'student', dataToSave);

      }, 1000);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [debouncedLayouts, user, versionedLayouts.version, hiddenWidgets]);

  const getLayoutKey = useCallback(() => {
    if (!user) return null;
    const role = user.userType || 'student';
    return `dashboard-layouts-${user.uid}-${role}`;
  }, [user]);

  useEffect(() => {
    const loadLayouts = async () => {
      if (!user || layoutInitialized.current) return;
      layoutInitialized.current = true;
      
      const layoutKey = getLayoutKey();
      const role = user.userType || 'student';

      const localLayoutPromise = new Promise<VersionedLayouts | null>((resolve) => {
        if (layoutKey) {
          const savedLayoutsLocal = localStorage.getItem(layoutKey);
          if (savedLayoutsLocal) try { resolve(JSON.parse(savedLayoutsLocal)); } catch { resolve(null); } else resolve(null);
        } else resolve(null);
      });
      
      const cloudLayoutPromise = getLayout(user.uid, role);

      const [localResult, cloudResult] = await Promise.all([localLayoutPromise, cloudLayoutPromise]);

      const defaultLayouts: VersionedLayouts = { version: CODE_LAYOUT_VERSION, layouts: getDefaultLayouts(), hidden: [] };

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
      if (finalLayouts.hidden) {
          finalLayouts.hidden.forEach(id => {
            onToggleWidget(id);
          });
      }
      setIsLayoutLoaded(true);
    };

    if(user) loadLayouts();
  }, [user, getLayoutKey, getDefaultLayouts, onToggleWidget]);
  
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setCurrentLayouts(allLayouts);
    setDebouncedLayouts(allLayouts);
  };
  
  const finalLayoutsArray = useMemo(() => {
    const role = user?.userType || 'student';
    const baseLayouts = currentLayouts[currentBreakpoint as keyof Layouts] || getDefaultLayouts()[currentBreakpoint as keyof Layouts];
    
    const allAvailableWidgets = new Set(widgetList.map(w => w.id));
    const filteredBase = baseLayouts.filter(item => allAvailableWidgets.has(item.i));

    if (role === 'professional') {
        return filteredBase.filter(item => item.i !== 'streak');
    }
    return filteredBase;
  }, [currentLayouts, user?.userType, currentBreakpoint, getDefaultLayouts]);

  const colWidth = (currentContainerWidth - (currentCols + 1) * MARGIN[0]) / currentCols;

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


  if (!isLayoutLoaded) {
      return <div className="h-full w-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  
  return (
    <div 
      className={cn("relative h-full", isEditMode && "edit-mode-active")}
      onContextMenu={(e) => { e.preventDefault(); setIsEditMode(true); }}
      onClick={() => { if (isEditMode) setIsEditMode(false); }}
    >
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
            {finalLayoutsArray.map(item => {
              if (hiddenWidgets.has(item.i) || !components[item.i]) return null;
              return (
                  <div key={item.i} className="group" onClick={(e) => isEditMode && e.stopPropagation()}>
                    {isEditMode && (
                      <>
                        <button className="remove-widget-button" onClick={() => onToggleWidget(item.i)}>-</button>
                        <div className="drag-handle"></div>
                      </>
                    )}
                    {components[item.i]}
                  </div>
              )
            })}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
}
