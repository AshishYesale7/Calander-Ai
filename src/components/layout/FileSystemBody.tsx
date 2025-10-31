
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, File as FileIcon, Upload, FolderPlus, MoreVertical, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

type FileType = {
    name: string;
    type: 'folder' | 'file';
    id: string;
    size?: string;
}

const FileSystemBody = () => {
    const [pathHistory, setPathHistory] = useState([{ id: 'root', name: 'My Drive' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<FileType[]>([]);
    const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchFiles = useCallback(async (folderId: string = 'root') => {
        if (!user || !isGoogleConnected) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/google/drive/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, folderId }),
            });
            const data = await response.json();
            if (data.success) {
                setFiles(data.files);
            } else {
                throw new Error(data.message || 'Failed to fetch files.');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, isGoogleConnected, toast]);

    useEffect(() => {
        if (user) {
            fetch('/api/auth/google/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            })
            .then(res => res.json())
            .then(data => setIsGoogleConnected(data.isConnected));
        }
    }, [user]);

    useEffect(() => {
        if (isGoogleConnected) {
            fetchFiles();
        }
    }, [isGoogleConnected, fetchFiles]);

    const handleItemClick = (item: FileType) => {
        if (item.type === 'folder') {
            setPathHistory(prev => [...prev, { id: item.id, name: item.name }]);
            fetchFiles(item.id);
        }
        // Handle file click (e.g., open preview) later
    };

    const handleBreadcrumbClick = (pathId: string, index: number) => {
        setPathHistory(prev => prev.slice(0, index + 1));
        fetchFiles(pathId);
    }

    const handleConnectGoogle = () => {
        if (!user) return;
        const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'google-drive' })).toString('base64');
        const authUrl = `/api/auth/google/redirect?state=${encodeURIComponent(state)}`;
        window.open(authUrl, '_blank', 'width=500,height=600');
    };

    if (isGoogleConnected === null) {
        return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (!isGoogleConnected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Connect Google Drive</h3>
                <p className="text-sm text-muted-foreground mt-1">See and manage your Google Drive files directly here.</p>
                <Button onClick={handleConnectGoogle} className="mt-4">Connect to Google Drive</Button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-black/30 p-4">
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchFiles(pathHistory[pathHistory.length-1].id)}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            ) : files.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">This folder is empty.</div>
            ) : (
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
                                    <FileIcon className="h-12 w-12 text-blue-300" />
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
            )}
        </div>
    );
};

export default FileSystemBody;
