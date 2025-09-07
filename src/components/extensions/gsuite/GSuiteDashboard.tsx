
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GSuiteLogo } from "@/components/logo/GSuiteLogo";
import { 
    Home, 
    Link as LinkIcon, 
    FileText, 
    Settings, 
    BarChart3, 
    Cloud, 
    Star, 
    Sparkles,
    Smartphone,
    Trash2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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
        case 'slide': return <FileText className="h-5 w-5 text-yellow-500" />;
        default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
}

const NavLink = ({ icon: Icon, label, isActive }: { icon: React.ElementType, label: string, isActive?: boolean }) => (
    <a
        href="#"
        className={cn(
            "flex items-center gap-4 px-4 py-2 text-sm font-medium rounded-full transition-colors",
            isActive
                ? "bg-[#C2E7FF] text-[#0B57D0]"
                : "text-gray-700 hover:bg-gray-100"
        )}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </a>
);


const InfoCard = ({ title, value, subtext, icon: Icon, iconBgColor }: { title: string, value: string, subtext?: string, icon: React.ElementType, iconBgColor: string }) => (
    <Card className="bg-white border shadow-none hover:shadow-sm transition-shadow">
        <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
             <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white", iconBgColor)}>
                <Icon className="h-6 w-6"/>
            </div>
            <div>
                <p className="text-2xl font-semibold text-gray-800">{value}</p>
                {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
            </div>
        </CardContent>
    </Card>
);


export default function GSuiteDashboard() {
    
    const gsuiteBgStyle = {
        backgroundColor: '#FCFCFC',
    };

    return (
        <div className="min-h-full w-full bg-white text-gray-800 flex" style={gsuiteBgStyle}>
            {/* Left Sidebar */}
            <div className="w-64 border-r border-gray-200 p-4 flex-shrink-0 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="p-2">
                        <GSuiteLogo />
                    </div>
                    <nav className="space-y-1">
                        <NavLink icon={Home} label="Home" isActive />
                        <NavLink icon={Cloud} label="Storage" />
                        <NavLink icon={Star} label="Benefits" />
                        <NavLink icon={Sparkles} label="Google AI" />
                    </nav>
                </div>
                 <div className="space-y-1 text-xs text-gray-600">
                    <a href="#" className="block p-2 rounded-md hover:bg-gray-100">Send Feedback</a>
                    <a href="#" className="block p-2 rounded-md hover:bg-gray-100">Privacy Policy</a>
                    <a href="#" className="block p-2 rounded-md hover:bg-gray-100">Terms of Service</a>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Storage and more with Google</h1>
                        <p className="mt-2 text-gray-600">Link your documents, manage your files, and get AI-powered insights.</p>
                        <Button className="mt-6 bg-[#0B57D0] hover:bg-[#0A4CB5] text-white rounded-full px-6 py-2 h-auto text-sm">Learn More</Button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Storage Card */}
                        <Card className="bg-white border shadow-none hover:shadow-sm transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-gray-600">Storage</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4">
                                <div className="relative h-20 w-20">
                                    <svg className="h-full w-full" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3"></path>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#FBBF24" strokeWidth="3" strokeDasharray="87, 100" strokeDashoffset="0"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-bold text-gray-800">87%</span>
                                        <span className="text-xs text-gray-500">used</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">13.08 GB of 15 GB</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Backup Card */}
                        <InfoCard title="Backup" value="OnePlus Nord" subtext="3 days ago" icon={Smartphone} iconBgColor="bg-gray-400"/>
                        
                        {/* Clean up space Card */}
                        <InfoCard title="Clean up space" value="6 GB+" subtext="to clean up" icon={Trash2} iconBgColor="bg-blue-500"/>
                    </div>
                    
                    <div className="mt-12">
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
            </main>
        </div>
    );
}
