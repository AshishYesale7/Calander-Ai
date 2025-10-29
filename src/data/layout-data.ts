
'use client';

import type { Layout, Layouts } from 'react-grid-layout';

// --- Student Layouts ---
const studentLayoutLg: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4 },
  { i: 'streak', x: 6, y: 0, w: 6, h: 2, minH: 2, minW: 3 },
  { i: 'calendar', x: 0, y: 2, w: 6, h: 5, minH: 4, minW: 4 },
  { i: 'day-timetable', x: 6, y: 2, w: 6, h: 5, minH: 4, minW: 4 },
  { i: 'timeline', x: 0, y: 7, w: 4, h: 4, minH: 3, minW: 3 },
  { i: 'emails', x: 4, y: 7, w: 4, h: 5, minH: 4, minW: 3 },
  { i: 'next-month', x: 8, y: 7, w: 4, h: 3, minH: 3, minW: 4 },
];

const studentLayoutMd: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 10, h: 2, minH: 2, minW: 1 },
  { i: 'streak', x: 0, y: 2, w: 10, h: 2, minH: 2, minW: 1 },
  { i: 'calendar', x: 0, y: 4, w: 5, h: 4, minH: 4, minW: 1 },
  { i: 'day-timetable', x: 5, y: 4, w: 5, h: 4, minH: 4, minW: 1 },
  { i: 'timeline', x: 0, y: 8, w: 10, h: 4, minH: 3, minW: 1 },
  { i: 'emails', x: 0, y: 12, w: 10, h: 5, minH: 4, minW: 1 },
  { i: 'next-month', x: 0, y: 17, w: 10, h: 3, minH: 3, minW: 1 },
];

const studentLayoutSm: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 1 },
  { i: 'streak', x: 0, y: 2, w: 6, h: 2, minH: 2, minW: 1 },
  { i: 'calendar', x: 0, y: 4, w: 6, h: 4, minH: 4, minW: 1 },
  { i: 'day-timetable', x: 0, y: 8, w: 6, h: 4, minH: 4, minW: 1 },
  { i: 'timeline', x: 0, y: 12, w: 6, h: 4, minH: 3, minW: 1 },
  { i: 'emails', x: 0, y: 16, w: 6, h: 5, minH: 4, minW: 1 },
  { i: 'next-month', x: 0, y: 21, w: 6, h: 3, minH: 3, minW: 1 },
];

export const responsiveStudentLayouts: Layouts = {
    lg: studentLayoutLg,
    md: studentLayoutMd,
    sm: studentLayoutSm,
    xs: studentLayoutSm.map(l => ({ ...l, w: 4 })), // Reuse sm layout with different width
    xxs: studentLayoutSm.map(l => ({ ...l, w: 2 })), // Reuse sm layout with different width
};

// --- Professional Layouts ---
const professionalLayoutLg: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4 },
  { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minH: 4, minW: 4 },
  { i: 'day-timetable', x: 6, y: 5, w: 6, h: 6, minH: 4, minW: 4 },
  { i: 'timeline', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 3 },
  { i: 'emails', x: 0, y: 6, w: 6, h: 5, minH: 4, minW: 3 },
  { i: 'next-month', x: 6, y: 11, w: 6, h: 4, minH: 3, minW: 4 },
];

const professionalLayoutMd: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 10, h: 2, minH: 2, minW: 1 },
  { i: 'calendar', x: 0, y: 2, w: 5, h: 4, minH: 4, minW: 1 },
  { i: 'day-timetable', x: 5, y: 2, w: 5, h: 4, minH: 4, minW: 1 },
  { i: 'timeline', x: 0, y: 6, w: 10, h: 4, minH: 3, minW: 1 },
  { i: 'emails', x: 0, y: 10, w: 10, h: 5, minH: 4, minW: 1 },
  { i: 'next-month', x: 0, y: 15, w: 10, h: 4, minH: 3, minW: 1 },
];

const professionalLayoutSm: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 1 },
  { i: 'calendar', x: 0, y: 2, w: 6, h: 4, minH: 4, minW: 1 },
  { i: 'day-timetable', x: 0, y: 6, w: 6, h: 4, minH: 4, minW: 1 },
  { i: 'timeline', x: 0, y: 10, w: 6, h: 4, minH: 3, minW: 1 },
  { i: 'emails', x: 0, y: 14, w: 6, h: 5, minH: 4, minW: 1 },
  { i: 'next-month', x: 0, y: 19, w: 6, h: 4, minH: 3, minW: 1 },
];

export const responsiveProfessionalLayouts: Layouts = {
    lg: professionalLayoutLg,
    md: professionalLayoutMd,
    sm: professionalLayoutSm,
    xs: professionalLayoutSm.map(l => ({ ...l, w: 4 })),
    xxs: professionalLayoutSm.map(l => ({ ...l, w: 2 })),
};
