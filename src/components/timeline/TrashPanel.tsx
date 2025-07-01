
'use client';

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

interface TrashPanelProps {
  deletedEvents: TimelineEvent[];
  onRestore: (eventId: string) => void;
  onPermanentDelete: (eventId: string) => void;
  onClose: () => void;
}

export default function TrashPanel({ deletedEvents, onRestore, onPermanentDelete, onClose }: TrashPanelProps) {
    const { toast } = useToast();

    const handleRestore = (event: TimelineEvent) => {
        onRestore(event.id);
        toast({ title: 'Event Restored', description: `"${event.title}" has been restored to your calendar.` });
    };

    return (
        <Card className="frosted-glass flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 border-l border-border/30 rounded-l-none animate-in slide-in-from-right-20 duration-300">
            <CardHeader className="p-4 flex-row justify-between items-center">
                <div>
                    <CardTitle className="font-headline text-lg text-primary">Recently Deleted</CardTitle>
                    <CardDescription className="text-xs">Items are cleared after 3 days.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="space-y-2 p-2">
                        {deletedEvents.length > 0 ? (
                            deletedEvents.map(event => (
                                <div key={event.id} className="p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors">
                                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        {event.deletedAt && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Info size={12}/> Deleted {formatDistanceToNow(event.deletedAt, { addSuffix: true })}
                                            </p>
                                        )}
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
                                </div>
                            ))
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
