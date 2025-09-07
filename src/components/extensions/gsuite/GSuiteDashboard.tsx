
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GSuiteLogo } from "@/components/logo/GSuiteLogo";
import { 
    FileText, 
    BarChart3, 
    Link2
} from "lucide-react";
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
        case 'sheet': return <BarChart3 className="h-5 w-5 text-green-500" />;
        case 'slide': return <FileText className="h-5 w-5 text-yellow-500" />; // Using FileText as a stand-in for Slides
        default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
}


export default function GSuiteDashboard() {
    
    const gsuiteBgStyle = {
        backgroundColor: '#FCFCFC',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full w-full" style={gsuiteBgStyle}>
            <div className="max-w-4xl mx-auto relative z-10 text-gray-800">
                <header className="mb-12">
                     <GSuiteLogo />
                    <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mt-4">GSuite Integration</h1>
                    <p className="mt-2 text-gray-600">Link your Google Drive files to timeline events and get AI-powered summaries.</p>
                </header>

                <div className="space-y-8">
                    <Card className="bg-white border shadow-none hover:shadow-sm transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-medium text-gray-800">Connection Status</CardTitle>
                                <CardDescription>Manage your Google account connection.</CardDescription>
                            </div>
                            <Button className="bg-[#0B57D0] hover:bg-[#0A4CB5] text-white rounded-full px-5 py-2 h-auto text-sm">
                                Already Connected
                            </Button>
                        </CardHeader>
                    </Card>

                    <Card className="bg-white border shadow-none">
                         <CardHeader>
                            <CardTitle className="text-lg font-medium text-gray-800">File Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-gray-600">
                                This plugin can only access Google Drive files that you explicitly link to an event. It cannot see or access any other files in your Drive.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Link a file from the event creation modal to get started.
                            </p>
                        </CardContent>
                    </Card>
                    
                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-2xl font-semibold text-gray-900">Recently Linked Files</h2>
                             <a href="#" className="text-sm font-medium text-[#0B57D0] hover:underline">See all</a>
                        </div>
                        <div className="space-y-3">
                           {mockLinkedFiles.map(file => (
                                <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                                    <Avatar className="h-10 w-10 bg-white border">
                                       <AvatarFallback className="bg-transparent">{getFileIcon(file.type)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-800">{file.name}</p>
                                        <p className="text-xs text-gray-500">Linked to: {file.event}</p>
                                    </div>
                                    <Button variant="ghost" className="text-sm text-[#0B57D0] hover:bg-blue-50">View</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
