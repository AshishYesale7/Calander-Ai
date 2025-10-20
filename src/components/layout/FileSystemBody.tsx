
'use client';

import { useState } from 'react';
import { Folder, File, Upload, FolderPlus, MoreVertical, ChevronRight } from 'lucide-react';

const mockFiles = {
    'root': [
        { name: 'Documents', type: 'folder', id: 'doc1' },
        { name: 'Images', type: 'folder', id: 'img1' },
        { name: 'project-notes.md', type: 'file', id: 'file1', size: '2 KB' },
        { name: 'roadmap.pdf', type: 'file', id: 'file2', size: '1.2 MB' },
        { name: 'onboarding-video.mp4', type: 'file', id: 'file6', size: '25.6 MB' },
        { name: 'design-assets.zip', type: 'file', id: 'file7', size: '10.1 MB' },
        { name: 'client-feedback.docx', type: 'file', id: 'file8', size: '128 KB' },
    ],
    'doc1': [
        { name: 'meeting-notes-q1.docx', type: 'file', id: 'file3', size: '24 KB' },
    ],
    'img1': [
         { name: 'logo.png', type: 'file', id: 'file4', size: '15 KB' },
         { name: 'screenshot-1.png', type: 'file', id: 'file5', size: '432 KB' },
    ]
};

type FileType = {
    name: string;
    type: 'folder' | 'file';
    id: string;
    size?: string;
}

const FileSystemBody = () => {
    const [currentPath, setCurrentPath] = useState('root');
    const [pathHistory, setPathHistory] = useState([{ id: 'root', name: 'Home' }]);

    const files = (mockFiles as Record<string, FileType[]>)[currentPath] || [];

    const handleItemClick = (item: FileType) => {
        if (item.type === 'folder') {
            setCurrentPath(item.id);
            setPathHistory(prev => [...prev, {id: item.id, name: item.name}]);
        }
        // Handle file click (e.g., open preview) later
    };

    const handleBreadcrumbClick = (pathId: string, index: number) => {
        setCurrentPath(pathId);
        setPathHistory(prev => prev.slice(0, index + 1));
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-black/30 p-4">
            {/* Header with breadcrumbs and actions */}
            <header className="flex-shrink-0 flex justify-between items-center mb-4">
                <nav className="flex items-center text-sm text-gray-400">
                    {pathHistory.map((p, index) => (
                        <div key={p.id} className="flex items-center">
                            <button 
                                onClick={() => handleBreadcrumbClick(p.id, index)} 
                                className="hover:text-white"
                            >
                                {p.name}
                            </button>
                            {index < pathHistory.length - 1 && <ChevronRight className="h-4 w-4 mx-1" />}
                        </div>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-md">
                        <Upload size={16} />
                        <span className="hidden sm:inline">Upload</span>
                    </button>
                     <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-md">
                        <FolderPlus size={16} />
                        <span className="hidden sm:inline">New Folder</span>
                    </button>
                </div>
            </header>

            {/* File grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pr-2">
                {files.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="group flex flex-col items-center justify-center p-2 rounded-lg bg-gray-800/40 hover:bg-gray-700/60 cursor-pointer transition-colors aspect-square"
                    >
                        <div className="relative">
                            {item.type === 'folder' ? (
                                <Folder className="h-12 w-12 text-yellow-400" />
                            ) : (
                                <File className="h-12 w-12 text-blue-300" />
                            )}
                            <button className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white">
                                <MoreVertical size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-200 mt-2 truncate w-full">{item.name}</p>
                        {item.size && (
                             <p className="text-[10px] text-gray-500">{item.size}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileSystemBody;
