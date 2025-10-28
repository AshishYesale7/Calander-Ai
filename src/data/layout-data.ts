
import type { Layout, Layouts } from 'react-grid-layout';

export const studentLayouts: Layout[] = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4 },
    { i: 'streak', x: 6, y: 0, w: 6, h: 2, minH: 2, minW: 3 },
    { i: 'calendar', x: 0, y: 2, w: 4, h: 5, minH: 4, minW: 3 },
    { i: 'timeline', x: 4, y: 2, w: 4, h: 4, minH: 3, minW: 3 },
    { i: 'emails', x: 8, y: 2, w: 4, h: 5, minH: 4, minW: 3 },
    { i: 'next-month', x: 0, y: 7, w: 8, h: 3, minH: 3, minW: 4 },
];

export const professionalLayouts: Layout[] = [
    { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4 },
    { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minH: 4, minW: 6 },
    { i: 'timeline', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 3 },
    { i: 'emails', x: 6, y: 5, w: 6, h: 5, minH: 4, minW: 3 },
    { i: 'next-month', x: 0, y: 6, w: 6, h: 5, minH: 3, minW: 4 },
];

export const defaultLayouts = {
    student: studentLayouts,
    professional: professionalLayouts
};


// Function to generate a stacked layout for a given breakpoint
const generateStackedLayout = (layout: Layout[], cols: number): Layout[] => {
    return layout.map((item, index) => ({
      ...item,
      x: 0,
      y: index * (item.h), // Stack them vertically
      w: cols, // Full width for the breakpoint
    }));
};

// Generate responsive layouts
const generateResponsiveLayouts = (desktopLayout: Layout[]): Layouts => ({
    lg: desktopLayout,
    md: generateStackedLayout(desktopLayout, 10),
    sm: generateStackedLayout(desktopLayout, 6),
    xs: generateStackedLayout(desktopLayout, 4),
    xxs: generateStackedLayout(desktopLayout, 2),
});

export const responsiveStudentLayouts: Layouts = generateResponsiveLayouts(studentLayouts);
export const responsiveProfessionalLayouts: Layouts = generateResponsiveLayouts(professionalLayouts);
