
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, File as FileIcon, MoreVertical, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, MicrosoftIcon } from '@/components/auth/SignInForm';

type FileType = {
    name: string;
    type: 'folder' | 'file';
    id: string;
    size?: string;
}

const FileSystemBody = () => {
    const [pathHistory, setPathHistory] = useState([{ id: 'root', name: 'My Drive' }]);
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<FileType[]>([]);
    const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
    const [isMicrosoftConnected, setIsMicrosoftConnected] = useState<boolean | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchFiles = useCallback(async (folderId: string = 'root') => {
        if (!user) {
             setIsLoading(false);
             return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('/api/google/drive/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, folderId }),
            });
            const data = await response.json();
            if (data.success) {
                setFiles(data.files || []);
                setIsGoogleConnected(true); // Connection is valid
            } else {
                throw new Error(data.message || 'Failed to fetch files.');
            }
        } catch (error: any) {
            // If fetching fails for any reason (e.g. auth error), set connected to false
            setIsGoogleConnected(false);
            // We don't show a toast here to avoid bothering the user if they're just not connected.
            console.error("Failed to fetch files, likely needs re-authentication:", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const checkConnections = useCallback(async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [googleRes, microsoftRes] = await Promise.all([
          fetch('/api/auth/google/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
          fetch('/api/auth/microsoft/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
        ]);
        
        const googleData = await googleRes.json();
        const microsoftData = await microsoftRes.json();
        
        setIsMicrosoftConnected(microsoftData.isConnected);

        if (googleData.isConnected) {
            // Attempt to fetch files to validate the connection
            await fetchFiles();
        } else {
            setIsGoogleConnected(false);
            setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        setIsGoogleConnected(false);
        setIsMicrosoftConnected(false);
      }
    }, [user, fetchFiles]);
    
    useEffect(() => {
        checkConnections();
    }, [user, checkConnections]);


    const handleItemClick = (item: FileType) => {
        if (item.type === 'folder') {
            setPathHistory(prev => [...prev, { id: item.id, name: item.name }]);
            fetchFiles(item.id);
        }
    };

    const handleBreadcrumbClick = (pathId: string, index: number) => {
        setPathHistory(prev => prev.slice(0, index + 1));
        fetchFiles(pathId);
    }

    const handleConnect = (provider: 'google' | 'microsoft') => {
        if (!user) return;
        const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: `${provider}-drive` })).toString('base64');
        const authUrl = `/api/auth/${provider}/redirect?state=${encodeURIComponent(state)}`;
        
        const authWindow = window.open(authUrl, '_blank', 'width=500,height=600,noopener,noreferrer');

        const handleAuthMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data === `auth-success-${provider}`) {
                authWindow?.close();
                toast({ title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`, description: 'Fetching your files...' });
                checkConnections();
                window.removeEventListener('message', handleAuthMessage);
            }
        };
        window.addEventListener('message', handleAuthMessage);
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (!isGoogleConnected && !isMicrosoftConnected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg text-white">Connect Cloud Storage</h3>
                <p className="text-sm text-muted-foreground mt-1">Access your files from Google Drive or OneDrive.</p>
                <div className="mt-6 space-y-3 w-full max-w-xs">
                   <Button onClick={() => handleConnect('google')} className="w-full">
                       <GoogleIcon /> Connect to Google Drive
                   </Button>
                   <Button onClick={() => handleConnect('microsoft')} variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-white/10">
                       <MicrosoftIcon /> Connect to OneDrive
                   </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-black/30 p-4">
            <header className="flex-shrink-0 flex justify-between items-center mb-4">
                <nav className="flex items-center text-sm text-gray-400 overflow-x-auto">
                    {pathHistory.map((p, index) => (
                        <div key={p.id} className="flex items-center flex-shrink-0">
                            <button 
                                onClick={() => handleBreadcrumbClick(p.id, index)} 
                                className="hover:text-white truncate"
                            >
                                {p.name}
                            </button>
                            {index < pathHistory.length - 1 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
                        </div>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchFiles(pathHistory[pathHistory.length-1].id)}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            {files.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    {isGoogleConnected ? "This folder is empty." : "Connect a service to view files."}
                </div>
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
