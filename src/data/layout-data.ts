
'use client';

import type { Layout, Layouts } from 'react-grid-layout';

// This function generates a basic stacked layout for smaller screens.
// It now assigns sensible default heights and removes sizing constraints
// to ensure widgets are resizable and stack compactly on smaller devices.
const generateStackedLayout = (layout: Layout[], cols: number): Layout[] => {
  let y = 0;
  return layout.map((item) => {
    
    // Assign a smaller, more appropriate default height for stacked views.
    // Taller widgets like the calendar get more space.
    const newHeight = (item.i === 'calendar' || item.i === 'day-timetable' || item.i === 'emails' || item.i === 'timeline') ? 4 : 2;

    const newItem: Layout = {
      ...item,
      x: 0,
      y: y,
      w: cols, // Take full width of the current breakpoint.
      h: newHeight, // Use the new, smaller height.
      minW: undefined, // Remove constraints for fluid resizing.
      minH: undefined,
    };
    
    y += newHeight; // Stack items based on their new height.
    return newItem;
  });
};


// --- Student Layout ---
export const studentLayouts: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4, },
  { i: 'streak', x: 6, y: 0, w: 6, h: 2, minH: 2, minW: 3, },
  { i: 'calendar', x: 0, y: 2, w: 6, h: 5, minH: 4, minW: 4, },
  { i: 'day-timetable', x: 6, y: 2, w: 6, h: 5, minH: 4, minW: 4, },
  { i: 'timeline', x: 0, y: 7, w: 4, h: 4, minH: 3, minW: 3, },
  { i: 'emails', x: 4, y: 7, w: 4, h: 5, minH: 4, minW: 3, },
  { i: 'next-month', x: 8, y: 7, w: 4, h: 3, minH: 3, minW: 4, },
];
export const responsiveStudentLayouts: Layouts = {
    lg: studentLayouts,
    md: generateStackedLayout(studentLayouts, 10),
    sm: generateStackedLayout(studentLayouts, 6),
    xs: generateStackedLayout(studentLayouts, 4),
    xxs: generateStackedLayout(studentLayouts, 2),
};


// --- Professional Layout ---
export const professionalLayouts: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4, },
  { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minH: 4, minW: 4, },
  { i: 'day-timetable', x: 6, y: 5, w: 6, h: 6, minH: 4, minW: 4, },
  { i: 'timeline', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 3, },
  { i: 'emails', x: 0, y: 6, w: 6, h: 5, minH: 4, minW: 3, },
  { i: 'next-month', x: 6, y: 11, w: 6, h: 4, minH: 3, minW: 4, },
];
export const responsiveProfessionalLayouts: Layouts = {
    lg: professionalLayouts,
    md: generateStackedLayout(professionalLayouts, 10),
    sm: generateStackedLayout(professionalLayouts, 6),
    xs: generateStackedLayout(professionalLayouts, 4),
    xxs: generateStackedLayout(professionalLayouts, 2),
};
