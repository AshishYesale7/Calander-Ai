
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Check, ChefHat, Loader2, CalendarPlus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Contest } from "@/ai/flows/fetch-coding-stats-flow";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpcomingContestsProps {
    contests?: Contest[];
    onAddContest: (contest: Contest) => Promise<boolean>;
}

export default function UpcomingContests({ contests = [], onAddContest }: UpcomingContestsProps) {
    const [added, setAdded] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState<number | null>(null);

    const handleAdd = async (contest: Contest) => {
        setIsLoading(contest.id);
        const success = await onAddContest(contest);
        if (success) {
            setAdded(prev => new Set(prev).add(contest.id));
        }
        setIsLoading(null);
    };

    if (contests.length === 0) {
        return (
            <Card className="frosted-glass bg-card/60">
                 <CardHeader>
                    <CardTitle className="text-lg font-semibold">Upcoming Contests</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="text-center text-sm text-muted-foreground py-8">
                        No upcoming contests found on Codeforces.
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Upcoming Contests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {contests.map(contest => {
                    const isAdded = added.has(contest.id);
                    const contestDate = new Date(contest.startTimeSeconds * 1000);
                    return (
                        <div key={contest.id} className="p-3 rounded-lg bg-background/40 flex items-start gap-4">
                            <div className="text-center w-10 flex-shrink-0">
                                <p className="text-xs text-muted-foreground">{format(contestDate, 'MMM')}</p>
                                <p className="text-lg font-bold">{format(contestDate, 'dd')}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Image src="https://cdn.iconscout.com/icon/free/png-256/free-code-forces-3628695-3030187.png" alt="Codeforces" width={16} height={16} className="rounded-full" />
                                    <h4 className="font-semibold truncate">{contest.name}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {format(contestDate, 'dd MMM yyyy - hh:mm a')}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {Math.round(contest.durationSeconds / 3600)} hrs
                                    </Badge>
                                    <Button 
                                        size="sm" 
                                        className="h-7 px-2 text-xs" 
                                        variant={isAdded ? "default" : "outline"} 
                                        onClick={() => handleAdd(contest)}
                                        disabled={isAdded || isLoading === contest.id}
                                    >
                                        {isLoading === contest.id ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : isAdded ? (
                                            <Check className="h-3 w-3 mr-1" />
                                        ) : (
                                            <CalendarPlus className="h-3 w-3 mr-1" />
                                        )}
                                        {isLoading === contest.id ? 'Adding...' : isAdded ? 'Added' : 'Add to Calendar'}
                                    </Button>
                                </div>
                            </div>
                            <a href={`https://codeforces.com/contests/${contest.id}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 self-center">
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </a>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
