
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

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];

interface WidgetDashboardProps {
  components: { [key: string]: ReactNode };
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
}

export default function WidgetDashboard({ components, isEditMode, setIsEditMode }: WidgetDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [versionedLayouts, setVersionedLayouts] = useState<VersionedLayouts>({
    version: CODE_LAYOUT_VERSION,
    layouts: user?.userType === 'professional' ? responsiveProfessionalLayouts : responsiveStudentLayouts,
    hidden: [],
  });

  const [currentLayouts, setCurrentLayouts] = useState<Layouts>(versionedLayouts.layouts);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set(versionedLayouts.hidden));
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const layoutInitialized = useRef(false);

  const getLayoutKey = useCallback(() => {
    if (!user) return null;
    const role = user.userType || 'student';
    return `dashboard-layouts-${user.uid}-${role}`;
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
          if (savedLayoutsLocal) try { resolve(JSON.parse(savedLayoutsLocal)); } catch { resolve(null); } else resolve(null);
        } else resolve(null);
      });
      
      const cloudLayoutPromise = getLayout(user.uid, role);

      const [localResult, cloudResult] = await Promise.all([localLayoutPromise, cloudLayoutPromise]);

      const defaultLayouts: VersionedLayouts = { version: CODE_LAYOUT_VERSION, layouts: getDefaultLayouts(), hidden: [] };

      let finalLayouts: VersionedLayouts;
      const localVersion = localResult?.version || 0;
      const cloudVersion = cloudResult?.version || 0;
      
      if (localVersion >= cloudVersion && localVersion >= CODE_LAYOUT_VERSION) {
        finalLayouts = localResult!;
      } else if (cloudVersion > localVersion && cloudVersion >= CODE_LAYOUT_VERSION) {
        finalLayouts = cloudResult!;
        if (layoutKey) localStorage.setItem(layoutKey, JSON.stringify(cloudResult));
      } else {
        finalLayouts = defaultLayouts;
        if (layoutKey) localStorage.removeItem(layoutKey);
        if (CODE_LAYOUT_VERSION > cloudVersion) saveLayout(user.uid, role, defaultLayouts);
      }
      
      setVersionedLayouts(finalLayouts);
      setCurrentLayouts(finalLayouts.layouts);
      setHiddenWidgets(new Set(finalLayouts.hidden || []));
      setIsLayoutLoaded(true);
    };

    if(user) loadLayouts();
  }, [user, getLayoutKey, getDefaultLayouts]);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    if (!isLayoutLoaded) return;
    setCurrentLayouts(allLayouts);
  };
  
  useEffect(() => {
    if (!isLayoutLoaded || !user) return;
  
    const timeoutId = setTimeout(async () => {
      const layoutKey = getLayoutKey();
      if (!layoutKey) return;
  
      const newVersion = (versionedLayouts.version || 0) + 1;
      const dataToSave: VersionedLayouts = { 
        version: newVersion, 
        layouts: currentLayouts, 
        hidden: Array.from(hiddenWidgets) 
      };
  
      setVersionedLayouts(dataToSave);
      localStorage.setItem(layoutKey, JSON.stringify(dataToSave));
      await saveLayout(user.uid, user.userType || 'student', dataToSave);
    }, 1000); // Debounce for 1 second
  
    return () => clearTimeout(timeoutId);
  }, [currentLayouts, hiddenWidgets, isLayoutLoaded, user, getLayoutKey, versionedLayouts.version]);


  const handleToggleWidget = (id: string) => {
    const newHidden = new Set(hiddenWidgets);
    if (newHidden.has(id)) {
      newHidden.delete(id);
    } else {
      newHidden.add(id);
    }
    setHiddenWidgets(newHidden);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditMode(true);
  };
  
  if (!isLayoutLoaded) {
      return <div className="h-full w-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  
  return (
    <div 
      className={cn("relative h-full", isEditMode && "edit-mode-active")}
      onContextMenu={handleContextMenu}
      onClick={() => isEditMode && setIsEditMode(false)}
    >
      <div className="relative z-20">
        <ResponsiveReactGridLayout
            className="layout"
            layouts={currentLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={ROW_HEIGHT}
            margin={MARGIN}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
        >
            {Object.keys(components).map(key => {
              if (hiddenWidgets.has(key)) return null;
              return (
                  <div key={key} className="group" onClick={(e) => isEditMode && e.stopPropagation()}>
                    {isEditMode && (
                      <>
                        <button className="remove-widget-button" onClick={() => handleToggleWidget(key)}>-</button>
                        <div className="drag-handle"></div>
                      </>
                    )}
                    {components[key]}
                  </div>
              )
            })}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
}

    