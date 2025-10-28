
'use client';

import React, { useState, useEffect } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import TodaysPlanCard from '../timeline/TodaysPlanCard';
import DailyStreakCard from './DailyStreakCard';
import SlidingTimelineView from '../timeline/SlidingTimelineView';
import ImportantEmailsCard from '../timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '../timeline/NextMonthHighlightsCard';
import { GripVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { getLayout, saveLayout } from '@/services/layoutService';
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

  const getDefaultLayout = () => {
    const layout = user?.userType === 'professional' ? defaultLayouts.professional : defaultLayouts.student;
    // Filter out streak card for professionals
    return user?.userType === 'professional' ? layout.filter(item => item.i !== 'streak') : layout;
  };

  const [layout, setLayout] = useState(getDefaultLayout());
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);

  useEffect(() => {
    // Load layout from storage on mount
    const loadLayout = async () => {
      if (!user) {
        setLayout(getDefaultLayout());
        setIsLayoutLoaded(true);
        return;
      }
      
      try {
          const firestoreLayout = await getLayout(user.uid);
          if (firestoreLayout && firestoreLayout.length > 0) {
            setLayout(firestoreLayout);
          } else {
            setLayout(getDefaultLayout());
          }
      } catch (e) {
          console.warn("Could not fetch layout from Firestore. Using default.", e);
          setLayout(getDefaultLayout());
      } finally {
          setIsLayoutLoaded(true);
      }
    };

    loadLayout();
  }, [user]);

  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    setLayout(newLayout);
    if (user && isLayoutLoaded) { // Only save after initial layout is loaded
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
    // This state update will trigger onLayoutChange and save to Firestore
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
