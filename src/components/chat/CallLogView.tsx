
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/context/ChatContext';
import { db } from '@/lib/firebase';
import type { CallData } from '@/types';
import { subscribeToCallHistory, loadCallsFromLocal } from '@/services/chatService';
import { deleteCalls } from '@/services/callService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trash2, Phone, Video, ArrowUpRight, ArrowDownLeft, X, PhoneMissed } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { PublicUserProfile } from '@/types';


export default function CallLogView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { onInitiateCall } = useChat();
    const [callLog, setCallLog] = useState<CallData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const localCalls = loadCallsFromLocal(user.uid);
        setCallLog(localCalls);
        setIsLoading(false);

        const unsub = subscribeToCallHistory(user.uid, (calls) => {
            setCallLog(calls);
        });

        return () => unsub();
    }, [user]);

    const getCallIcon = (call: CallData) => {
        if (!user) return null;
        
        const isOutgoing = call.callerId === user.uid;
        const isDeclined = call.status === 'declined';
        const isMissed = isDeclined && !isOutgoing;
        const isRejected = isDeclined && isOutgoing;

        if (isMissed) return <PhoneMissed className="h-4 w-4 text-red-500" />;
        if (isRejected) return <X className="h-4 w-4 text-red-500" />;
        if (isOutgoing) return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
        return <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />;
    };
    
    const isAllSelected = useMemo(() => callLog.length > 0 && selectedIds.size === callLog.length, [selectedIds, callLog]);

    const handleToggleAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedIds(new Set(callLog.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleBulkDelete = async () => {
        if (!user || selectedIds.size === 0) return;
        const idsToDelete = Array.from(selectedIds);
        
        try {
            await deleteCalls(user.uid, idsToDelete);
            setSelectedIds(new Set());
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete call logs.", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center px-4 pt-4">
                <h2 className="text-lg font-semibold">Calls</h2>
                {selectedIds.size > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-7 animate-in fade-in duration-300">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete ({selectedIds.size})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="frosted-glass">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Call Logs?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the selected {selectedIds.size} call(s) from your history. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleBulkDelete}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex items-center px-2 py-2 border-b border-border/30">
                <Checkbox
                    id="select-all-calls"
                    checked={isAllSelected}
                    onCheckedChange={handleToggleAll}
                    className="mr-3 ml-2"
                />
                <label htmlFor="select-all-calls" className="text-sm font-medium">Select All</label>
            </div>
            <ScrollArea className="flex-1 mt-2">
                <div className="p-2 space-y-1">
                    {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : callLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-8">No recent calls.</p>
                    ) : callLog.map(call => (
                        <div key={call.id} className="p-2 rounded-lg flex items-center gap-3 hover:bg-muted">
                             <Checkbox 
                                id={`call-${call.id}`}
                                checked={selectedIds.has(call.id)}
                                onCheckedChange={() => handleToggleSelection(call.id)}
                            />
                             <Avatar className="h-12 w-12">
                                <AvatarImage src={call.otherUser?.photoURL || undefined} alt={call.otherUser?.displayName} />
                                <AvatarFallback>{call.otherUser?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{call.otherUser?.displayName}</h3>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {getCallIcon(call)}
                                    <span>{format(call.createdAt, 'p')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'audio')}><Phone className="h-5 w-5 text-accent hover:text-white dark:hover:text-black"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'video')}><Video className="h-5 w-5 text-accent hover:text-white dark:hover:text-black"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </>
    );
};
