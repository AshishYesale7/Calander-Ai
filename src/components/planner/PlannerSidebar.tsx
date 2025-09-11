
'use client';
import { cn } from '@/lib/utils';
import { Mail, Calendar, Star, Columns, Clock, Palette } from 'lucide-react';
import type { ActivePlannerView, MaxViewTheme } from './MaximizedPlannerView';

interface PlannerSidebarProps {
  activeView: ActivePlannerView;
  setActiveView: (view: ActivePlannerView) => void;
  viewTheme: MaxViewTheme;
}

export default function PlannerSidebar({ activeView, setActiveView, viewTheme }: PlannerSidebarProps) {
  const mainSections = [
    { id: 'gmail', icon: Mail, label: 'Gmail', badge: 0 },
    { id: 'today', icon: Calendar, label: 'Today' },
    { id: 'upcoming', icon: Star, label: 'Upcoming' },
    { id: 'all_tasks', icon: Columns, label: 'All tasks' },
  ];

  const projectSections = [
    { id: 'book', color: 'bg-red-500', label: 'Book' },
    { id: 'newsletter', color: 'bg-green-500', label: 'Newsletter' },
    { id: 'fitness', color: 'bg-yellow-500', label: 'Fitness' },
    { id: 'work', color: 'bg-indigo-500', label: 'Work' },
    { id: 'film', color: 'bg-blue-500', label: 'Film' },
  ];
  
  const utilitySections = [
    { id: 'statistics', icon: Clock, label: 'Statistics' },
    { id: 'daily_planning', icon: Palette, label: 'Daily Planning' },
  ];

  const sidebarClasses = viewTheme === 'dark' ? 'bg-gray-900/50 text-gray-300' : 'bg-[#fff8ed] text-gray-700';
  const buttonClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-stone-200';
  const activeBtnClasses = viewTheme === 'dark' ? 'bg-gray-700/50 text-white' : 'bg-stone-200 text-gray-900';
  const headingClasses = viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
  const separatorClasses = viewTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200';
  const badgeClasses = viewTheme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600';

  return (
    <div className={cn("p-2 flex flex-col gap-4 h-full text-xs", sidebarClasses)}>
        <div className="space-y-1">
            {mainSections.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveView(s.id)}
                    className={cn(
                        "w-full flex items-center justify-between gap-3 p-1.5 rounded-md",
                        buttonClasses,
                        activeView === s.id && cn('font-semibold', activeBtnClasses)
                    )}
                >
                    <div className="flex items-center gap-3">
                       <s.icon size={16} /><span>{s.label}</span>
                    </div>
                    {s.badge > 0 && <span className={cn("text-xs font-bold px-1.5 rounded-full", badgeClasses)}>{s.badge}</span>}
                </button>
            ))}
        </div>

        <div className="space-y-2">
            <h3 className={cn("text-[10px] font-bold px-1.5 mb-1 tracking-wider uppercase", headingClasses)}>Projects</h3>
             {projectSections.map(p => (
                 <button key={p.id} onClick={() => setActiveView(p.id)} className={cn("w-full flex items-center gap-3 p-1.5 rounded-md", buttonClasses, activeView === p.id && cn('font-semibold', activeBtnClasses))}>
                     <span className={cn("h-2.5 w-2.5 rounded-full", p.color)}></span>
                     <span>{p.label}</span>
                 </button>
             ))}
        </div>

        <div className="space-y-2">
             <h3 className={cn("text-[10px] font-bold px-1.5 mb-1 tracking-wider uppercase", headingClasses)}>Tags</h3>
        </div>

        <div className={cn("mt-auto border-t pt-2 space-y-1", separatorClasses)}>
             {utilitySections.map(u => (
                <button key={u.id} onClick={() => setActiveView(u.id)} className={cn("w-full flex items-center gap-3 p-1.5 rounded-md", buttonClasses, activeView === u.id && cn('font-semibold', activeBtnClasses))}>
                    <u.icon size={16} /><span>{u.label}</span>
                </button>
             ))}
        </div>
         <div className="shrink-0">
            <div className={cn("h-px w-full my-1", separatorClasses)}></div>
            <div className={cn("flex items-center gap-2 p-1.5 rounded-md", buttonClasses, "cursor-pointer")}>
                <span className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">!</span>
            </div>
        </div>
    </div>
  );
}
