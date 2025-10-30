'use client';

import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export default function WidgetGhost() {
    return (
        <Card className="w-full h-full frosted-glass flex items-center justify-center p-4">
            <div className="w-full space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4">
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </Card>
    )
}
