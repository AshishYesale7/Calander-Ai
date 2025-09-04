
'use client';
import { useState, useEffect, type FC } from 'react';
import shortid from 'shortid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Globe, Palette } from 'lucide-react';
import type { Shortcut } from '@/types';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconList = Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'icons' && /^[A-Z]/.test(key));

const colorList = [
    'bg-slate-500', 'bg-gray-500', 'bg-zinc-500', 'bg-neutral-500', 'bg-stone-500',
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

interface EditShortcutModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  shortcutToEdit: Shortcut | null;
  onSave: (shortcut: Shortcut) => void;
}

const EditShortcutModal: FC<EditShortcutModalProps> = ({ isOpen, onOpenChange, shortcutToEdit, onSave }) => {
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('Globe');
    const [color, setColor] = useState('bg-blue-500');
    const [actionType, setActionType] = useState<'url' | 'in-app-route'>('url');
    const [actionValue, setActionValue] = useState('');

    useEffect(() => {
        if (shortcutToEdit) {
            setTitle(shortcutToEdit.title);
            setIcon(shortcutToEdit.icon);
            setColor(shortcutToEdit.color);
            setActionType(shortcutToEdit.actionType);
            setActionValue(shortcutToEdit.actionValue);
        } else {
            setTitle('');
            setIcon('Globe');
            setColor('bg-blue-500');
            setActionType('url');
            setActionValue('');
        }
    }, [shortcutToEdit, isOpen]);

    const { toast } = useToast();

    const handleSave = () => {
        if (!title.trim()) {
            toast({ title: "Title is required", variant: "destructive" });
            return;
        }
         if (actionType === 'url' && !actionValue.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i)) {
            toast({ title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://", variant: "destructive" });
            return;
        }

        const newShortcut: Shortcut = {
            id: shortcutToEdit?.id || shortid.generate(),
            title,
            icon,
            color,
            actionType,
            actionValue,
        };
        onSave(newShortcut);
    };

    const IconPreview = (LucideIcons as any)[icon] || Globe;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg frosted-glass">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl text-primary">
                        {shortcutToEdit ? 'Edit Shortcut' : 'Create New Shortcut'}
                    </DialogTitle>
                    <DialogDescription>
                        Customize your workflow tile. Choose an icon, color, and action.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-4 rounded-lg text-white flex-shrink-0", color)}>
                            <IconPreview className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="title">Shortcut Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Open LeetCode"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <Label>Icon</Label>
                        <Select onValueChange={setIcon} value={icon}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-72">
                                     {iconList.map(iconName => (
                                        <SelectItem key={iconName} value={iconName}>
                                            <div className="flex items-center gap-2">
                                                {React.createElement((LucideIcons as any)[iconName], { className: "h-4 w-4" })}
                                                {iconName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label>Color</Label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                            {colorList.map(colorClass => (
                                <button
                                    key={colorClass}
                                    type="button"
                                    onClick={() => setColor(colorClass)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 transition-all",
                                        color === colorClass ? 'ring-2 ring-offset-2 ring-ring ring-offset-background' : 'border-transparent'
                                    )}
                                    style={{ backgroundColor: colorClass.replace('bg-', 'var(--tw-color-') + ')' }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <Label>Action</Label>
                        <p className="text-sm text-muted-foreground mb-2">What should this shortcut do when clicked?</p>
                        <div className="p-3 rounded-md border border-border/50 bg-background/30">
                            <Label htmlFor="action-value">Website URL</Label>
                             <Input
                                id="action-value"
                                value={actionValue}
                                onChange={(e) => setActionValue(e.target.value)}
                                placeholder="https://example.com"
                                disabled={actionType !== 'url'}
                            />
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Shortcut</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditShortcutModal;
