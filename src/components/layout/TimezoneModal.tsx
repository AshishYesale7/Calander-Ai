
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTimezone } from '@/hooks/use-timezone';
import { timezones } from '@/lib/timezones';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface TimezoneModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const TimezoneSelector = ({ value, onSelect, disabled }: { value: string, onSelect: (value: string) => void, disabled?: boolean }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    <span className="truncate">{value || "Select timezone..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px] sm:w-[400px]" align="start">
                <Command>
                    <CommandInput placeholder="Search timezone..." />
                    <CommandList>
                        <ScrollArea className="h-72">
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup>
                                {timezones.map((tz) => (
                                    <CommandItem
                                        key={tz}
                                        value={tz}
                                        onSelect={(currentValue) => {
                                            onSelect(currentValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === tz ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tz}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function TimezoneModal({ isOpen, onOpenChange }: TimezoneModalProps) {
    const { timezone, setTimezone, isMounted } = useTimezone();
    const [isAutomatic, setIsAutomatic] = useState(true);
    const [currentTime, setCurrentTime] = useState('');

    const detectedTimezone = isMounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    useEffect(() => {
        if (isOpen) {
            const storedTz = localStorage.getItem('futuresight-user-timezone');
            setIsAutomatic(!storedTz);
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
           const now = new Date();
           setCurrentTime(now.toLocaleDateString(undefined, {
               weekday: 'long',
               year: 'numeric',
               month: 'long',
               day: 'numeric',
               hour: 'numeric',
               minute: '2-digit',
               second: '2-digit',
               timeZoneName: 'short',
               timeZone: timezone,
           }));
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timezone]);

    const handleAutoToggle = (checked: boolean) => {
        setIsAutomatic(checked);
        if (checked) {
            // When toggling to automatic, clear the stored preference and set to detected
            localStorage.removeItem('futuresight-user-timezone');
            setTimezone(detectedTimezone);
        } else {
            // When switching to manual, it keeps the currently active timezone
            setTimezone(timezone);
        }
    };
    
    const handleManualSelect = (tz: string) => {
        setIsAutomatic(false);
        setTimezone(tz);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md frosted-glass">
                <DialogHeader>
                    <DialogTitle className="font-headline text-lg text-primary flex items-center">
                        <Globe className="mr-2 h-5 w-5" /> Date & Time Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage how dates and times are displayed across the app.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="p-4 rounded-lg bg-background/50 border space-y-4">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="auto-datetime" className="font-medium">Set date and time automatically</Label>
                            <Switch id="auto-datetime" checked disabled />
                        </div>
                        <Separator/>
                        <div className="flex items-center justify-between text-sm">
                            <Label>Date and time</Label>
                            <span className="text-muted-foreground">{currentTime}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-background/50 border space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-timezone" className="font-medium">Set time zone automatically</Label>
                            <Switch id="auto-timezone" checked={isAutomatic} onCheckedChange={handleAutoToggle} />
                        </div>
                        <Separator/>
                        <div className="flex items-center justify-between text-sm">
                            <Label>Time zone</Label>
                            <TimezoneSelector value={timezone} onSelect={handleManualSelect} disabled={isAutomatic} />
                        </div>
                        <Separator/>
                         <div className="flex items-center justify-between text-sm">
                            <Label>Closest city</Label>
                            <span className="text-muted-foreground">{timezone.split('/').pop()?.replace(/_/g, ' ') || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
