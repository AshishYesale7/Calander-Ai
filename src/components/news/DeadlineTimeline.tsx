
'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeadlineItem } from '@/types';

interface DeadlineTimelineProps {
  deadlines: DeadlineItem[];
  onAddToCalendar: (deadline: DeadlineItem) => void;
}

const getCategoryClass = (category: DeadlineItem['category']) => {
  switch (category) {
    case 'Exam':
      return 'bg-red-500/80 border-red-700 text-white';
    case 'Internship':
      return 'bg-blue-500/80 border-blue-700 text-white';
    case 'Job':
      return 'bg-green-500/80 border-green-700 text-white';
    default:
      return 'bg-gray-500/80 border-gray-700 text-white';
  }
};

const getCategoryDotClass = (category: DeadlineItem['category']) => {
  switch (category) {
    case 'Exam': return 'bg-red-500';
    case 'Internship': return 'bg-blue-500';
    case 'Job': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};


export default function DeadlineTimeline({ deadlines, onAddToCalendar }: DeadlineTimelineProps) {
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineItem | null>(deadlines[0] || null);

  const handleSelect = (deadline: DeadlineItem) => {
    setSelectedDeadline(deadline);
  };
  
  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 pt-4">
      {/* The Timeline Visualization */}
      <div className="relative w-full">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border/50 -translate-y-1/2"></div>
        <div className="relative flex justify-between">
          {deadlines.map((deadline, index) => {
            const isSelected = selectedDeadline?.title === deadline.title && selectedDeadline?.date === deadline.date;
            return (
              <div
                key={index}
                className="relative flex flex-col items-center cursor-pointer group"
                onClick={() => handleSelect(deadline)}
              >
                <div
                  className={cn(
                    'h-3 w-3 rounded-full transition-all duration-300',
                    getCategoryDotClass(deadline.category),
                    isSelected ? 'ring-4 ring-offset-2 ring-offset-card ring-accent' : 'ring-2 ring-card group-hover:ring-accent',
                    isPast(new Date(deadline.date)) ? 'opacity-50' : 'opacity-100'
                  )}
                  style={{
                    transform: 'translateY(-50%)'
                  }}
                />
                <p className={cn(
                    "text-xs text-center mt-2 font-medium transition-colors",
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}>
                  {format(new Date(deadline.date), 'MMM d')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* The Details Card */}
      <div className="relative min-h-[180px]">
        <AnimatePresence mode="wait">
          {selectedDeadline && (
            <motion.div
              key={selectedDeadline.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Card className="bg-background/40">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="font-headline text-lg text-primary">{selectedDeadline.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(selectedDeadline.date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={cn(getCategoryClass(selectedDeadline.category))}>
                      {selectedDeadline.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/80">{selectedDeadline.description}</p>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={() => onAddToCalendar(selectedDeadline)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add to Calendar
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <a href={selectedDeadline.sourceUrl} target="_blank" rel="noopener noreferrer">
                        View Source <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
