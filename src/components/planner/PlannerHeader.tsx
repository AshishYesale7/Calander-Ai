
'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Minimize,
  Palette,
  UserPlus,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown
} from 'lucide-react';
import type { PlannerViewMode, MaxViewTheme } from './MaximizedPlannerView';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface PlannerHeaderProps {
  activeView: PlannerViewMode;
  date: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onTodayClick: () => void;
  onMinimize: () => void;
  onViewChange: (view: PlannerViewMode) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  viewTheme: MaxViewTheme;
  onToggleTheme: () => void;
}

export default function PlannerHeader({
  activeView,
  date,
  onNavigate,
  onTodayClick,
  onMinimize,
  onViewChange,
  onToggleSidebar,
  isSidebarOpen,
  viewTheme,
  onToggleTheme,
}: PlannerHeaderProps) {
  const getTitle = () => {
    switch(activeView) {
      case 'day': return format(date, 'MMM d, yyyy');
      case 'week': return `${format(startOfWeek(date, {weekStartsOn:0}), 'MMM d')} - ${format(endOfWeek(date, {weekStartsOn:0}), 'MMM d, yyyy')}`;
      case 'month': return format(date, 'MMMM yyyy');
    }
  };

  const headerClasses = viewTheme === 'dark'
    ? 'border-gray-700/50 text-gray-300 bg-[#171717]'
    : 'border-stone-200 bg-[#fff8ed] text-gray-700';
  const buttonClasses = viewTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-stone-200';
  const textClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const viewModeButtonContainer = viewTheme === 'dark' ? 'bg-black/50' : 'bg-[#faefdd]';

  return (
    <header className={cn("p-1 border-b flex justify-between items-center flex-shrink-0 text-xs", headerClasses)}>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={onToggleSidebar}>
                {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div className={cn("h-5 w-px", viewTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-300')} />
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={() => onNavigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className={cn("font-semibold px-2 text-sm", textClasses)}>{getTitle()}</h2>
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={() => onNavigate('next')}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" className={cn("h-7 px-2 text-xs", buttonClasses)} onClick={onTodayClick}>Today</Button>
        </div>
        
        {/* Desktop View Mode Buttons */}
        <div className={cn("hidden md:flex items-center gap-1 p-0.5 rounded-md", viewModeButtonContainer)}>
            <Button onClick={() => onViewChange('day')} variant={activeView === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs capitalize">Day</Button>
            <Button onClick={() => onViewChange('week')} variant={activeView === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs capitalize">Week</Button>
            <Button onClick={() => onViewChange('month')} variant={activeView === 'month' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs capitalize">Month</Button>
        </div>
        
        {/* Mobile Dropdown */}
        <div className="md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-xs capitalize">
                        {activeView}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onViewChange('day')}>Day</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewChange('week')}>Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewChange('month')}>Month</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={onToggleTheme}><Palette className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 hidden md:inline-flex", buttonClasses)}><UserPlus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)}><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onMinimize} aria-label="Minimize view" className={cn("h-7 w-7", buttonClasses)}>
                <Minimize className="h-4 w-4" />
            </Button>
        </div>
    </header>
  );
}
