
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Dot } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { TimelineEvent } from "@/types"
import { format, isSameDay, getYear } from "date-fns"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  mode?: 'month' | 'year' | 'day';
  events?: TimelineEvent[];
  onCaptionClick?: () => void;
  onMonthSelect?: (month: number) => void;
  onYearChange?: (direction: 'prev' | 'next') => void;
  onPrevClick?: () => void;
  onNextClick?: () => void;
}

const getEventColorStyle = (event: TimelineEvent) => {
    return { '--event-color': event.color || '#64748b' } as React.CSSProperties;
};


function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = 'month',
  events = [],
  month,
  onMonthChange,
  onCaptionClick,
  onMonthSelect,
  onYearChange,
  onPrevClick,
  onNextClick,
  ...props
}: CalendarProps) {

  const getCaptionLabel = () => {
    const selectedDay = props.selected as Date;
    if (mode === 'day' && selectedDay) {
        return format(selectedDay, 'PPP');
    }
    if (mode === 'year' && month) {
        return format(month, 'yyyy');
    }
    if (month) {
        return format(month, 'MMMM yyyy');
    }
    return 'Select Date';
  }
  
  if (mode === 'year') {
    return (
      <div className={cn("p-3 w-full", className)}>
         <div className="flex justify-center pt-1 relative items-center">
            <button 
              className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1")}
              onClick={() => onYearChange && onYearChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={onCaptionClick} className="text-sm md:text-base font-medium cursor-pointer hover:text-accent transition-colors">
              {month && format(month, 'yyyy')}
            </button>
            <button 
              className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1")}
              onClick={() => onYearChange && onYearChange('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              onClick={() => onMonthSelect && onMonthSelect(i)}
              className="p-2 rounded-md text-center text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              {format(new Date(2000, i, 1), 'MMM')}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  if (mode === 'day' && props.selected) {
    const selectedDay = props.selected as Date;
    const allDayEvents = events.filter(e => e.isAllDay);
    const timedEvents = events.filter(e => !e.isAllDay).sort((a,b) => a.date.getTime() - b.date.getTime());

    return (
        <div className="w-full p-1">
             <div className="flex justify-center pt-1 relative items-center">
                <button 
                  onClick={onPrevClick}
                  className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => onMonthSelect && onMonthSelect(selectedDay.getMonth())} className="text-sm md:text-base font-medium cursor-pointer hover:text-accent transition-colors">
                  {getCaptionLabel()}
                </button>
                <button
                  className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1")}
                  onClick={onNextClick}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div className="mt-4 space-y-2">
                {allDayEvents.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-1">All-day</h4>
                        {allDayEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-2 p-1.5 rounded-md" style={getEventColorStyle(event)}>
                                <div className="w-1.5 h-1.5 rounded-full bg-[--event-color]"></div>
                                <span className="text-sm">{event.title}</span>
                            </div>
                        ))}
                    </div>
                )}
                 {timedEvents.length > 0 && (
                    <div>
                         <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Timed</h4>
                        {timedEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-2 p-1.5 rounded-md" style={getEventColorStyle(event)}>
                                <div className="w-1.5 h-1.5 rounded-full bg-[--event-color]"></div>
                                <span className="text-sm font-medium w-20">{format(event.date, 'h:mm a')}</span>
                                <span className="text-sm">{event.title}</span>
                            </div>
                        ))}
                    </div>
                 )}
                 {events.length === 0 && <p className="text-sm text-center text-muted-foreground pt-8">No events for this day.</p>}
            </div>
        </div>
    );
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        row: "flex w-full mt-2",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      month={month}
      onMonthChange={onMonthChange}
      onPrevClick={onPrevClick}
      onNextClick={onNextClick}
      {...props}
      captionLayout="buttons"
      captionLabel={
        <button onClick={onCaptionClick} className={cn(classNames?.caption_label)}>
          {getCaptionLabel()}
        </button>
      }
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
