
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle } from "lucide-react";

interface SolvedProblemsCardProps {
    totalSolved: number;
}

export default function SolvedProblemsCard({ totalSolved }: SolvedProblemsCardProps) {
    return (
        <Card className="frosted-glass bg-card/60 p-6 relative overflow-hidden">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Problems Solved</CardTitle>
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/50">
                    <CheckCircle className="h-3 w-3 mr-1"/> 0 Solved today
                </Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4 flex items-center justify-center">
                <div className="text-7xl sm:text-8xl font-bold">{totalSolved}</div>
                <Trophy className="absolute -bottom-4 -right-4 h-24 w-24 text-yellow-500/10" strokeWidth={1} />
            </CardContent>
        </Card>
    );
}
