
'use client';

import type { Layout, Layouts } from 'react-grid-layout';

// Using the exact layouts the user specified to preserve minW and minH
export const studentLayouts: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4, },
  { i: 'streak', x: 6, y: 0, w: 6, h: 2, minH: 2, minW: 3, },
  { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minH: 4, minW: 3, },
  { i: 'timeline', x: 4, y: 2, w: 4, h: 4, minH: 3, minW: 3, },
  { i: 'emails', x: 8, y: 2, w: 4, h: 5, minH: 4, minW: 3, },
  { i: 'next-month', x: 0, y: 7, w: 8, h: 3, minH: 3, minW: 4, },
];

export const professionalLayouts: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4, },
  { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minH: 4, minW: 6, },
  { i: 'timeline', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 3, },
  { i: 'emails', x: 6, y: 5, w: 6, h: 5, minH: 4, minW: 3, },
  { i: 'next-month', x: 0, y: 6, w: 6, h: 5, minH: 3, minW: 4, },
];

// This function generates a basic stacked layout for smaller screens.
const generateStackedLayout = (layout: Layout[], cols: number): Layout[] => {
  let y = 0;
  return layout.map((item) => {
    const newItem = { ...item, x: 0, y: y, w: cols };
    y += item.h;
    return newItem;
  });
};

// Generate responsive layouts for different breakpoints
const generateResponsiveLayouts = (desktopLayout: Layout[]): Layouts => ({
    lg: desktopLayout, // Desktop
    md: generateStackedLayout(desktopLayout, 10), // Tablet
    sm: generateStackedLayout(desktopLayout, 6),  // Mobile Landscape
    xs: generateStackedLayout(desktopLayout, 4),  // Mobile Portrait
    xxs: generateStackedLayout(desktopLayout, 2), // Small Mobile
});

export const responsiveStudentLayouts: Layouts = generateResponsiveLayouts(studentLayouts);
export const responsiveProfessionalLayouts: Layouts = generateResponsiveLayouts(professionalLayouts);
