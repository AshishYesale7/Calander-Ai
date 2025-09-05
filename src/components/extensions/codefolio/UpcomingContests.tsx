
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Check, ChefHat } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const contests = [
    {
        id: 1,
        platform: 'Codeforces',
        platformIcon: 'https://codeforces.org/s/0/favicon.ico',
        title: 'Starters 151',
        date: '11 Sep 2024',
        time: '08:00 PM - 10:00 PM',
        duration: '2 hrs'
    },
    {
        id: 2,
        platform: 'LeetCode',
        platformIcon: 'https://leetcode.com/favicon.ico',
        title: 'Weekly Contest 143',
        date: '12 Sep 2024',
        time: '02:30 PM - 04:30 PM',
        duration: '2 hrs'
    },
];

export default function UpcomingContests() {
    const [added, setAdded] = useState<Set<number>>(new Set([1]));

    const handleAdd = (id: number) => {
        setAdded(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    return (
        <div className="space-y-3">
            {contests.map(contest => {
                const isAdded = added.has(contest.id);
                return (
                    <div key={contest.id} className="p-3 rounded-lg bg-card/60 frosted-glass flex items-start gap-4">
                        <div className="text-center w-8 flex-shrink-0">
                            <p className="text-xs text-muted-foreground">{contest.date.split(' ')[1]}</p>
                            <p className="text-lg font-bold">{contest.date.split(' ')[0]}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Image src={contest.platformIcon} alt={contest.platform} width={16} height={16} className="rounded-full" />
                                <h4 className="font-semibold truncate">{contest.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{contest.date} - {contest.time}</p>
                            <div className="flex items-center justify-between mt-2">
                                <Badge variant="secondary" className="text-xs">{contest.duration}</Badge>
                                <Button size="sm" className="h-6 px-2 text-xs" variant={isAdded ? "default" : "outline"} onClick={() => handleAdd(contest.id)}>
                                    {isAdded ? (
                                        <Check className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ChefHat className="h-3 w-3 mr-1" />
                                    )}
                                    {isAdded ? 'Added' : 'Add'}
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 self-center">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                )
            })}
        </div>
    )
}
