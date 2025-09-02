
'use client';

import { useState, useMemo } from 'react';
import type { TimelineEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, RotateCcw, X, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

interface TrashPanelProps {
  deletedEvents: TimelineEvent[];
  onRestore: (eventId: string) => void;
  onPermanentDelete: (eventId: string) => void;
  onClose: () => void;
}

export default function TrashPanel({ deletedEvents, onRestore, onPermanentDelete, onClose }: TrashPanelProps) {
    const { toast } = useToast();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isAllSelected = useMemo(() => {
        return deletedEvents.length > 0 && selectedIds.size === deletedEvents.length;
    }, [selectedIds, deletedEvents]);

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(deletedEvents.map(e => e.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBulkRestore = () => {
        selectedIds.forEach(id => onRestore(id));
        toast({ title: 'Events Restored', description: `${selectedIds.size} event(s) have been restored.` });
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        selectedIds.forEach(id => onPermanentDelete(id));
        toast({ title: 'Events Deleted', description: `${selectedIds.size} event(s) have been permanently deleted.` });
        setSelectedIds(new Set());
    };

    const handleRestore = (event: TimelineEvent) => {
        onRestore(event.id);
        toast({ title: 'Event Restored', description: `"${event.title}" has been restored to your calendar.` });
    };

    return (
        <Card className="frosted-glass flex flex-col h-full w-full rounded-l-none border-l-0">
            <CardHeader className="p-4 flex-col gap-2 border-b border-border/30">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-lg text-primary">Recently Deleted</CardTitle>
                        <CardDescription className="text-xs">Items are cleared after 3 days.</CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                {selectedIds.size > 0 ? (
                     <div className="flex items-center justify-between gap-2 animate-in fade-in duration-300">
                         <span className="text-sm font-medium">{selectedIds.size} selected</span>
                         <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={handleBulkRestore} className="h-7">
                                 <RotateCcw className="h-4 w-4 mr-2"/> Restore
                             </Button>
                             <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="h-7">
                                         <Trash2 className="h-4 w-4 mr-2"/> Delete All
                                     </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent className="frosted-glass">
                                     <AlertDialogHeader>
                                         <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                                         <AlertDialogDescription>This will permanently delete the selected {selectedIds.size} event(s). This action cannot be undone.</AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                                         <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleBulkDelete}>Delete</AlertDialogAction>
                                     </AlertDialogFooter>
                                 </AlertDialogContent>
                             </AlertDialog>
                         </div>
                     </div>
                ) : null}
            </CardHeader>

            <CardContent className="p-2 pt-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                     <div className="space-y-1 p-2">
                        {deletedEvents.length > 0 ? (
                            <>
                                <div className="flex items-center p-2">
                                    <Checkbox
                                        id="select-all-trash"
                                        checked={isAllSelected}
                                        onCheckedChange={handleToggleSelectAll}
                                        aria-label="Select all"
                                    />
                                    <label htmlFor="select-all-trash" className="ml-3 text-sm font-medium">
                                        Select All
                                    </label>
                                </div>
                                <Separator className="my-1"/>
                                {deletedEvents.map(event => (
                                    <div key={event.id} className="p-2 rounded-md bg-background/30 hover:bg-background/50 transition-colors grid grid-cols-[auto,1fr,auto] items-center gap-3">
                                        <Checkbox 
                                            id={`select-${event.id}`}
                                            checked={selectedIds.has(event.id)}
                                            onCheckedChange={() => handleToggleSelection(event.id)}
                                            aria-label={`Select ${event.title}`}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                                            {event.deletedAt && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Info size={12}/> Deleted {formatDistanceToNow(event.deletedAt, { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => handleRestore(event)}>
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="frosted-glass">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete "{event.title}". This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onPermanentDelete(event.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            }
                           </>
                        ) : (
                            <div className="text-center py-16">
                                <Trash2 className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Trash is empty.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
