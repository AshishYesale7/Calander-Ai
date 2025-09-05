
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function SolvedProblemsCard() {
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-medium">Solved Problems</CardTitle>
                    <Badge variant="outline" className="mt-1 bg-cyan-500/20 border-cyan-500/40 text-cyan-300">0 Solved today</Badge>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-5xl sm:text-6xl font-bold">2386</div>
            </CardContent>
        </Card>
    );
}
