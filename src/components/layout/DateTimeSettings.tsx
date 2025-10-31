'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTimezone } from '@/hooks/use-timezone';
import { timezones } from '@/lib/timezones';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

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

export default function DateTimeSettings() {
    const { timezone, setTimezone, isMounted } = useTimezone();
    const [isAutomatic, setIsAutomatic] = useState(true);
    const [currentTime, setCurrentTime] = useState('');

    const detectedTimezone = isMounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    useEffect(() => {
        if (isMounted) {
            const storedTz = localStorage.getItem('futuresight-user-timezone');
            setIsAutomatic(!storedTz);
        }
    }, [isMounted]);
    
    useEffect(() => {
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
    }, [timezone]);

    const handleAutoToggle = (checked: boolean) => {
        setIsAutomatic(checked);
        if (checked) {
            localStorage.removeItem('futuresight-user-timezone');
            setTimezone(detectedTimezone);
        } else {
            setTimezone(timezone);
        }
    };
    
    const handleManualSelect = (tz: string) => {
        setIsAutomatic(false);
        setTimezone(tz);
    }

    return (
        <div className="space-y-6 text-sm">
            <div className="p-4 rounded-lg bg-background/50 border space-y-4">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="auto-datetime" className="font-medium">Set date and time automatically</Label>
                    <Switch id="auto-datetime" checked disabled />
                </div>
                <Separator/>
                <div className="flex items-center justify-between">
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
                <div className="flex items-center justify-between">
                    <Label>Time zone</Label>
                    <TimezoneSelector value={timezone} onSelect={handleManualSelect} disabled={isAutomatic} />
                </div>
                <Separator/>
                 <div className="flex items-center justify-between">
                    <Label>Closest city</Label>
                    <span className="text-muted-foreground">{timezone.split('/').pop()?.replace(/_/g, ' ') || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}
