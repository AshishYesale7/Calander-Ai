
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, Bot, Mail, MessageSquare, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const automationTasks = [
    { title: 'Morning Briefing', description: 'Summarize today\'s events and important emails.', icon: Bot, status: 'Active' },
    { title: 'Meeting Follow-up', description: 'Draft follow-up email with action items after meetings.', icon: Mail, status: 'Active' },
    { title: 'Weekly Progress Report', description: 'Generate a summary of goals and tasks completed this week.', icon: MessageSquare, status: 'Inactive' },
    { title: 'Schedule Deep Work', description: 'Automatically find and book 2-hour focus blocks in your calendar.', icon: Clock, status: 'Active' },
];

export default function AutomationTab() {
  return (
    <div className="flex flex-col h-full p-4 bg-muted/30">
        <header className="flex items-center justify-between mb-4">
            <div>
                <h3 className="font-semibold text-lg text-primary">Automations</h3>
                <p className="text-sm text-muted-foreground">Automate your repetitive tasks.</p>
            </div>
            <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Automation
            </Button>
        </header>
        <ScrollArea className="flex-1 -mx-4">
            <div className="px-4 space-y-3">
                {automationTasks.map(task => (
                    <Card key={task.title} className="frosted-glass bg-card/80">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <task.icon className="h-5 w-5 text-accent" />
                                <div>
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    <CardDescription className="text-xs">{task.description}</CardDescription>
                                </div>
                            </div>
                            <span className={`text-xs font-semibold ${task.status === 'Active' ? 'text-green-400' : 'text-gray-500'}`}>
                                {task.status}
                            </span>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
