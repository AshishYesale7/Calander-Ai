'use client';

import type { Layout, Layouts } from 'react-grid-layout';

// NEW: Layout version. Increment this when you make breaking changes to default layouts.
export const LAYOUT_VERSION = 4;

// --- Student Layouts ---
const studentLayoutLg: Layout[] = [
  { i: "plan", x: 0, y: 0, w: 12, h: 1, minH: 1 },
  { i: "streak", x: 7, y: 1, w: 5, h: 2, minW: 3, minH: 2 },
  { i: "calendar", x: 0, y: 1, w: 6, h: 5, minW: 3, minH: 5 },
  { i: "day-timetable", x: 0, y: 6, w: 6, h: 5, minW: 3, minH: 3 },
  { i: "timeline", x: 6, y: 11, w: 6, h: 4, minW: 3, minH: 4 },
  { i: "emails", x: 6, y: 6, w: 6, h: 5, minW: 3, minH: 4 },
  { i: "next-month", x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 3 },
  { i: "sync", x: 0, y: 11, w: 3, h: 2 },
  { i: "data", x: 3, y: 11, w: 3, h: 2 },
];

const studentLayoutMd: Layout[] = [
  { i: "plan", x: 0, y: 0, w: 10, h: 1 },
  { i: "streak", x: 6, y: 2, w: 4, h: 3 },
  { i: "calendar", x: 0, y: 2, w: 5, h: 5 },
  { i: "day-timetable", x: 5, y: 5, w: 5, h: 4 },
  { i: "timeline", x: 0, y: 7, w: 5, h: 3 },
  { i: "emails", x: 0, y: 11, w: 10, h: 4 },
  { i: "next-month", x: 5, y: 9, w: 5, h: 2 },
  { i: "sync", x: 0, y: 15, w: 5, h: 2 },
  { i: "data", x: 5, y: 15, w: 5, h: 2 },
];

const studentLayoutSm: Layout[] = studentLayoutMd.map(item => ({ ...item, w: 6 }));
const studentLayoutXs: Layout[] = studentLayoutSm.map(item => ({ ...item, w: 4 }));
const studentLayoutXxs: Layout[] = studentLayoutSm.map(item => ({ ...item, w: 2 }));


export const responsiveStudentLayouts: Layouts = {
    lg: studentLayoutLg,
    md: studentLayoutMd,
    sm: studentLayoutSm,
    xs: studentLayoutXs,
    xxs: studentLayoutXxs,
};


// --- Professional Layouts ---
const professionalLayoutLg: Layout[] = [
  { i: "plan", x: 0, y: 0, w: 12, h: 1 },
  { i: "calendar", x: 0, y: 1, w: 6, h: 5 },
  { i: "day-timetable", x: 6, y: 1, w: 6, h: 6 },
  { i: "timeline", x: 6, y: 7, w: 6, h: 4 },
  { i: "emails", x: 0, y: 6, w: 6, h: 5 },
  { i: "next-month", x: 0, y: 11, w: 6, h: 4 },
  { i: "sync", x: 0, y: 15, w: 3, h: 2 },
  { i: "data", x: 3, y: 15, w: 3, h: 2 },
];

const professionalLayoutMd: Layout[] = professionalLayoutLg.map(item => ({...item, w: item.w > 6 ? 10 : 5}));
const professionalLayoutSm: Layout[] = professionalLayoutMd.map(item => ({ ...item, w: 6 }));
const professionalLayoutXs: Layout[] = professionalLayoutSm.map(item => ({ ...item, w: 4 }));
const professionalLayoutXxs: Layout[] = professionalLayoutSm.map(item => ({ ...item, w: 2 }));


export const responsiveProfessionalLayouts: Layouts = {
    lg: professionalLayoutLg,
    md: professionalLayoutMd,
    sm: professionalLayoutSm,
    xs: professionalLayoutXs,
    xxs: professionalLayoutXxs,
};
