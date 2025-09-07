
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Image from "next/image";
import { usePlugin } from "@/hooks/use-plugin";

export default function PlaceholderDashboard() {
    const { activePlugin } = usePlugin();

    if (!activePlugin) return null;

    const LogoComponent = activePlugin.logo;

    return (
        <div className="p-8 min-h-full w-full bg-muted/30 flex items-center justify-center">
             <Card className="frosted-glass text-center p-12 max-w-lg mx-auto">
                <CardHeader>
                    <div className="mx-auto w-24 h-24 flex items-center justify-center bg-card/60 rounded-2xl border border-border/30 mb-6">
                        {typeof LogoComponent === 'string' ? (
                            <Image src={LogoComponent} alt={activePlugin.name} width={64} height={64} className="object-contain" />
                        ) : (
                            <LogoComponent className="h-16 w-16 text-foreground" />
                        )}
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">
                        {activePlugin.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Wrench className="h-12 w-12 text-accent mx-auto mb-4" />
                    <p className="text-lg font-semibold">Under Construction</p>
                    <p className="text-foreground/70 mt-1">
                        The full dashboard for this plugin is coming soon!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
