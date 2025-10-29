'use client';

import { Flame } from "lucide-react";

const TodaysPlanPreview = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-3/4 h-2 bg-muted rounded-full"></div>
    </div>
);

const DailyStreakPreview = () => (
    <div className="w-full h-full flex items-center justify-center">
        <Flame className="h-8 w-8 text-orange-400" />
    </div>
);

const EventCalendarPreview = () => (
    <div className="w-full h-full"></div>
);

const DayTimetablePreview = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="w-3/4 h-3 bg-blue-500 rounded-full"></div>
        <div className="w-3/4 h-3 bg-purple-500 rounded-full"></div>
    </div>
);

const SlidingTimelinePreview = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
    </div>
);

const ImportantEmailsPreview = () => (
    <div className="w-full h-full"></div>
);

const NextMonthPreview = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-3/4 h-2 bg-muted rounded-full"></div>
    </div>
);


export const widgetList = [
    { 
        id: 'plan', 
        name: 'Today\'s Plan',
        preview: <TodaysPlanPreview />
    },
    { 
        id: 'streak', 
        name: 'Daily Streak',
        preview: <DailyStreakPreview />
    },
    { 
        id: 'calendar', 
        name: 'Event Calendar',
        preview: <EventCalendarPreview />
    },
    { 
        id: 'day-timetable', 
        name: 'Day Timetable',
        preview: <DayTimetablePreview />
    },
    { 
        id: 'timeline', 
        name: 'Sliding Timeline',
        preview: <SlidingTimelinePreview />
    },
    { 
        id: 'emails', 
        name: 'Important Emails',
        preview: <ImportantEmailsPreview />
    },
    { 
        id: 'next-month', 
        name: 'Next Month Highlights',
        preview: <NextMonthPreview />
    },
];
