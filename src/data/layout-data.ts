
'use client';

import type { Layout, Layouts } from 'react-grid-layout';

// NEW: Layout version. Increment this when you make breaking changes to default layouts.
export const LAYOUT_VERSION = 3;

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
  { i: 'plan', x: 0, y: 0, w: 10, h: 2, minH: 2, minW: 4 },
  { i: 'streak', x: 0, y: 2, w: 10, h: 2, minH: 2, minW: 3 },
  { i: 'calendar', x: 0, y: 4, w: 5, h: 4, minH: 3, minW: 3 },
  { i: 'day-timetable', x: 5, y: 4, w: 5, h: 4, minH: 3, minW: 3 },
  { i: 'timeline', x: 0, y: 8, w: 10, h: 3, minH: 3, minW: 3 },
  { i: 'emails', x: 0, y: 11, w: 10, h: 4, minH: 3, minW: 3 },
  { i: 'next-month', x: 0, y: 15, w: 10, h: 3, minH: 3, minW: 3 },
];

const studentLayoutSm: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 2 },
  { i: 'streak', x: 0, y: 2, w: 6, h: 2, minH: 2, minW: 2 },
  { i: 'calendar', x: 0, y: 4, w: 6, h: 4, minH: 3, minW: 2 },
  { i: 'day-timetable', x: 0, y: 8, w: 6, h: 4, minH: 3, minW: 2 },
  { i: 'timeline', x: 0, y: 12, w: 6, h: 3, minH: 3, minW: 2 },
  { i: 'emails', x: 0, y: 15, w: 6, h: 4, minH: 3, minW: 2 },
  { i: 'next-month', x: 0, y: 19, w: 6, h: 3, minH: 3, minW: 2 },
];

const studentLayoutXs: Layout[] = studentLayoutSm.map(item => ({ ...item, w: 4, minW: 1 }));
const studentLayoutXxs: Layout[] = studentLayoutSm.map(item => ({ ...item, w: 2, minW: 1 }));


export const responsiveStudentLayouts: Layouts = {
    lg: studentLayoutLg,
    md: studentLayoutMd,
    sm: studentLayoutSm,
    xs: studentLayoutXs,
    xxs: studentLayoutXxs,
};


// --- Professional Layouts ---
const professionalLayoutLg: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 4 },
  { i: 'calendar', x: 6, y: 0, w: 6, h: 5, minH: 4, minW: 4 },
  { i: 'day-timetable', x: 6, y: 5, w: 6, h: 6, minH: 5, minW: 4 },
  { i: 'timeline', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 3 },
  { i: 'emails', x: 0, y: 6, w: 6, h: 5, minH: 4, minW: 3 },
  { i: 'next-month', x: 0, y: 11, w: 6, h: 4, minH: 3, minW: 4 },
];

const professionalLayoutMd: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 10, h: 2, minH: 2, minW: 4 },
  { i: 'calendar', x: 0, y: 2, w: 5, h: 4, minH: 3, minW: 3 },
  { i: 'day-timetable', x: 5, y: 2, w: 5, h: 4, minH: 4, minW: 3 },
  { i: 'timeline', x: 0, y: 6, w: 10, h: 3, minH: 3, minW: 3 },
  { i: 'emails', x: 0, y: 9, w: 10, h: 4, minH: 3, minW: 3 },
  { i: 'next-month', x: 0, y: 13, w: 10, h: 4, minH: 3, minW: 3 },
];

const professionalLayoutSm: Layout[] = [
  { i: 'plan', x: 0, y: 0, w: 6, h: 2, minH: 2, minW: 2 },
  { i: 'calendar', x: 0, y: 2, w: 6, h: 4, minH: 3, minW: 2 },
  { i: 'day-timetable', x: 0, y: 6, w: 6, h: 4, minH: 4, minW: 2 },
  { i: 'timeline', x: 0, y: 10, w: 6, h: 3, minH: 3, minW: 2 },
  { i: 'emails', x: 0, y: 13, w: 6, h: 4, minH: 3, minW: 2 },
  { i: 'next-month', x: 0, y: 17, w: 6, h: 4, minH: 3, minW: 2 },
];

const professionalLayoutXs: Layout[] = professionalLayoutSm.map(item => ({ ...item, w: 4, minW: 1 }));
const professionalLayoutXxs: Layout[] = professionalLayoutSm.map(item => ({ ...item, w: 2, minW: 1 }));


export const responsiveProfessionalLayouts: Layouts = {
    lg: professionalLayoutLg,
    md: professionalLayoutMd,
    sm: professionalLayoutSm,
    xs: professionalLayoutXs,
    xxs: professionalLayoutXxs,
};
