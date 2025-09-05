
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface SolvedProblemsCardProps {
    totalSolved: number;
}

export default function SolvedProblemsCard({ totalSolved }: SolvedProblemsCardProps) {
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-medium">Problems Solved</CardTitle>
                    <Badge variant="outline" className="mt-1 bg-green-500/20 text-green-300 border-green-500/50">0 Solved today</Badge>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-5xl sm:text-6xl font-bold">{totalSolved}</div>
            </CardContent>
        </Card>
    );
}
