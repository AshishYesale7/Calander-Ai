
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GSuiteLogo } from "@/components/logo/GSuiteLogo";
import { Link2, FileText, Settings, Zap, Bot, Presentation, Sheet as SheetIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data for recently linked files
const mockLinkedFiles = [
    { id: 1, type: 'doc', name: 'Project Alpha - Meeting Notes', event: 'Phase 2 Kickoff' },
    { id: 2, type: 'sheet', name: 'Q3 Budget Planning', event: 'Finance Sync' },
    { id: 3, type: 'slide', name: 'Final Presentation Deck', event: 'Project Alpha Demo' },
];

const getFileIcon = (type: string) => {
    switch(type) {
        case 'doc': return <FileText className="h-5 w-5 text-blue-500" />;
        case 'sheet': return <SheetIcon className="h-5 w-5 text-green-500" />;
        case 'slide': return <Presentation className="h-5 w-5 text-yellow-500" />;
        default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
}

export default function GSuiteDashboard() {
    
    const gsuiteBgStyle = {
        backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={gsuiteBgStyle}>
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex items-center gap-4">
                    <GSuiteLogo />
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-gray-800">
                            GSuite Integration
                        </h1>
                        <p className="text-gray-600 mt-1">Link your Google Drive files to timeline events and get AI-powered summaries.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="frosted-glass bg-white/60 border-gray-200/80 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-700">
                                   <Bot className="text-accent" /> AI Document Summarizer
                                </CardTitle>
                                <CardDescription className="text-foreground/80">
                                    Link a Google Doc to an event and get an instant AI summary. Perfect for catching up on meeting notes or reports.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-gray-600">How it works:</h4>
                                    <ol className="list-decimal list-inside text-sm text-gray-500 space-y-1">
                                        <li>Create or edit an event on your timeline.</li>
                                        <li>Click the "Link Google Drive File" button.</li>
                                        <li>Select a document from your Google Drive.</li>
                                        <li>The AI will automatically generate a summary for you to view.</li>
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="frosted-glass bg-white/60 border-gray-200/80 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-gray-700">
                                   <Zap className="text-accent" /> Recent Activity
                                </CardTitle>
                                <CardDescription className="text-foreground/80">
                                    Here are the latest files you've linked to your timeline events.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mockLinkedFiles.map(file => (
                                        <div key={file.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50/50 border border-gray-200/60">
                                            <Avatar className="h-9 w-9 bg-white">
                                               <AvatarFallback className="bg-transparent">{getFileIcon(file.type)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-gray-800">{file.name}</p>
                                                <p className="text-xs text-gray-500">Linked to: {file.event}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className="frosted-glass bg-white/60 border-gray-200/80 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-700">Connection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="secondary" className="w-full bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 cursor-default">
                                    <Link2 className="mr-2 h-4 w-4" /> Already Connected
                                </Button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Permissions are managed via your Google account.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="frosted-glass bg-white/60 border-gray-200/80 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-700">Permissions</CardTitle>
                            </CardHeader>
                             <CardContent>
                                <p className="text-xs text-gray-600">
                                   This plugin can only access Google Drive files that you explicitly link to an event via the file picker. We do not have access to any other files.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
