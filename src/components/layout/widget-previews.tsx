
'use client';

import { Flame } from "lucide-react";

// Generic placeholder for most widgets
const PreviewPlaceholder = () => (
    <p className="text-xs text-muted-foreground italic">Preview</p>
);

// Specific preview for Daily Streak
const DailyStreakPreview = () => (
    <Flame className="h-8 w-8 text-orange-400" />
);

export const widgetList = [
    { 
        id: 'plan', 
        name: 'Today\'s Plan',
        preview: <PreviewPlaceholder />
    },
    { 
        id: 'streak', 
        name: 'Daily Streak',
        preview: <DailyStreakPreview />
    },
    { 
        id: 'calendar', 
        name: 'Event Calendar',
        preview: <PreviewPlaceholder />
    },
    { 
        id: 'day-timetable', 
        name: 'Day Timetable',
        preview: <PreviewPlaceholder />
    },
    { 
        id: 'timeline', 
        name: 'Sliding Timeline',
        preview: <PreviewPlaceholder />
    },
    { 
        id: 'emails', 
        name: 'Important Emails',
        preview: <PreviewPlaceholder />
    },
    { 
        id: 'next-month', 
        name: 'Next Month Highlights',
        preview: <PreviewPlaceholder />
    },
];
