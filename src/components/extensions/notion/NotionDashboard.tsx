
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotionLogo } from "@/components/logo/NotionLogo";
import { Database, Link2, Settings, Zap } from "lucide-react";

export default function NotionDashboard() {
    
    const notionBgStyle = {
        backgroundImage: 'linear-gradient(145deg, hsl(0, 0%, 7%), hsl(0, 0%, 12%))',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={notionBgStyle}>
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <NotionLogo className="h-20 w-20 mx-auto text-white" />
                    <h1 className="text-4xl font-bold font-headline text-white/95 mt-4">
                        Notion Integration
                    </h1>
                    <p className="text-white/70 mt-2 max-w-lg mx-auto">Connect your Notion workspace to automatically sync tasks, notes, and projects.</p>
                </header>

                <div className="space-y-8">
                    <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-primary text-xl">Connection Status</CardTitle>
                                <CardDescription>Manage your Notion connection.</CardDescription>
                            </div>
                            <Button variant="secondary" className="bg-white/90 text-black hover:bg-white">
                                <Link2 className="mr-2 h-4 w-4" /> Connect to Notion
                            </Button>
                        </CardHeader>
                    </Card>

                    <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                               <Database className="text-accent" /> Synced Database
                            </CardTitle>
                            <CardDescription>
                                Select a database from your Notion workspace to sync with your timeline.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-40 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                                <p className="font-semibold text-white/80">No Database Selected</p>
                                <p className="text-sm text-white/50 mt-1">Connect to Notion to see your available databases.</p>
                                <Button variant="outline" className="mt-4 bg-transparent border-white/20 hover:bg-white/10">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Choose Database
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                     <Card className="frosted-glass bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                               <Zap className="text-accent"/> Recent Activity
                            </CardTitle>
                            <CardDescription>
                                A log of the latest items synced from your Notion database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-32 flex items-center justify-center text-center text-white/40">
                                <p>Once connected, recent activity will appear here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
