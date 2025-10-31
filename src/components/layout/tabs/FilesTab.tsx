
'use client';

import React, { useState } from 'react';
import { Folder, File as FileIcon, Upload, MoreVertical, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const mockFiles = [
    { name: 'Project Alpha', type: 'folder', modified: '2 hours ago' },
    { name: 'Meeting Notes Q2', type: 'folder', modified: '1 day ago' },
    { name: 'design_mockup_v3.fig', type: 'file', modified: '3 days ago', size: '12.5 MB' },
    { name: 'presentation.pptx', type: 'file', modified: '5 days ago', size: '4.2 MB' },
    { name: 'research_paper.pdf', type: 'file', modified: '1 week ago', size: '800 KB' },
];

export default function FilesTab() {
  return (
    <div className="flex flex-col h-full p-4 bg-muted/30">
        <div className="flex-shrink-0 mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search files..." className="pl-9" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted-foreground">
                        <th className="p-2 font-medium">Name</th>
                        <th className="p-2 font-medium">Modified</th>
                        <th className="p-2 font-medium">Size</th>
                        <th className="p-2 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {mockFiles.map((file) => (
                        <tr key={file.name} className="border-b border-border/30 hover:bg-muted/50">
                            <td className="p-2 font-medium flex items-center gap-2">
                                {file.type === 'folder' ? <Folder className="h-4 w-4 text-yellow-500" /> : <FileIcon className="h-4 w-4 text-blue-400" />}
                                {file.name}
                            </td>
                            <td className="p-2 text-muted-foreground">{file.modified}</td>
                            <td className="p-2 text-muted-foreground">{file.size || '--'}</td>
                            <td className="p-2 text-right">
                                <button><MoreVertical className="h-4 w-4 text-muted-foreground"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
         <footer className="pt-4 border-t border-border/30">
            <p className="text-xs text-center text-muted-foreground">
                Google Drive integration coming soon.
            </p>
        </footer>
    </div>
  );
}
