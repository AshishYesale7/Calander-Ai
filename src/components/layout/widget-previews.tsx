
'use client';

import { Button } from '../ui/button';
import { Plus, Minus, Flame, Bot, Calendar, Download, List, Clock, Mail, BarChart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Specific preview for Daily Streak
const DailyStreakPreview = () => (
    <Flame className="h-8 w-8 text-orange-400" />
);

// Generic placeholder for most widgets
const PreviewPlaceholder = ({ icon: Icon }: { icon: React.ElementType }) => (
    <Icon className="h-8 w-8 text-muted-foreground" />
);


export const widgetList = [
    { 
        id: 'plan', 
        name: 'Today\'s Plan',
        preview: <PreviewPlaceholder icon={Bot} />
    },
    { 
        id: 'streak', 
        name: 'Daily Streak',
        preview: <DailyStreakPreview />
    },
    { 
        id: 'calendar', 
        name: 'Event Calendar',
        preview: <PreviewPlaceholder icon={Calendar} />
    },
    { 
        id: 'day-timetable', 
        name: 'Day Timetable',
        preview: <PreviewPlaceholder icon={Clock} />
    },
    { 
        id: 'timeline', 
        name: 'Sliding Timeline',
        preview: <PreviewPlaceholder icon={List} />
    },
    { 
        id: 'emails', 
        name: 'Important Emails',
        preview: <PreviewPlaceholder icon={Mail} />
    },
    { 
        id: 'next-month', 
        name: 'Next Month Highlights',
        preview: <PreviewPlaceholder icon={BarChart} />
    },
    {
        id: 'sync',
        name: 'Google Sync',
        preview: <PreviewPlaceholder icon={RefreshCw} />
    },
    {
        id: 'data',
        name: 'Data Management',
        preview: <PreviewPlaceholder icon={Download} />
    }
];

interface WidgetPreviewsProps {
    hiddenWidgets: Set<string>;
    onToggleWidget: (id: string) => void;
}

export default function WidgetPreviews({ hiddenWidgets, onToggleWidget }: WidgetPreviewsProps) {
    
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h4 className="font-medium leading-none">Manage Widgets</h4>
                <p className="text-sm text-muted-foreground">
                    Add or remove widgets from your dashboard.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {widgetList.map(widget => {
                    const isHidden = hiddenWidgets.has(widget.id);
                    return (
                        <div key={widget.id} className="group relative p-2 border border-border/50 bg-background/50 rounded-md">
                            <p className="text-sm font-semibold truncate">{widget.name}</p>
                            <div className="mt-2 h-16 w-full bg-muted/30 rounded flex items-center justify-center">
                                {widget.preview}
                            </div>
                            <Button
                                size="icon"
                                variant={isHidden ? 'default' : 'destructive'}
                                className={cn(
                                    "absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                    isHidden ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                                )}
                                onClick={() => onToggleWidget(widget.id)}
                            >
                                {isHidden ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
