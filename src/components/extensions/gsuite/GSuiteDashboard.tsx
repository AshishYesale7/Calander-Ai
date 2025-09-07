
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GSuiteLogo } from "@/components/logo/GSuiteLogo";
import { Link2, FileText, Settings, Zap } from "lucide-react";

export default function GSuiteDashboard() {
    
    const gsuiteBgStyle = {
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={gsuiteBgStyle}>
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <GSuiteLogo className="h-20 w-20 mx-auto" />
                    <h1 className="text-4xl font-bold font-headline text-gray-800 mt-4">
                        GSuite Integration
                    </h1>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">Link your Google Drive files to timeline events and get AI-powered summaries.</p>
                </header>

                <div className="space-y-8">
                    <Card className="frosted-glass bg-white/60 border-gray-200/80">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-primary text-xl">Connection Status</CardTitle>
                                <CardDescription className="text-foreground/80">Manage your Google account connection.</CardDescription>
                            </div>
                            {/* In a real scenario, this would check auth state */}
                            <Button variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                <Link2 className="mr-2 h-4 w-4" /> Already Connected
                            </Button>
                        </CardHeader>
                    </Card>

                    <Card className="frosted-glass bg-white/60 border-gray-200/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                               <FileText className="text-accent" /> File Permissions
                            </CardTitle>
                            <CardDescription className="text-foreground/80">
                                This plugin can only access Google Drive files that you explicitly link to an event.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-32 flex items-center justify-center text-center text-gray-500">
                                <p>Link a file from the event creation modal to get started.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
