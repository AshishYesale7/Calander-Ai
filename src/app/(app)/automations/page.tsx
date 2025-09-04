
'use client';
import { useState } from 'react';
import type { Shortcut } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, PlusCircle, Globe, Edit, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import EditShortcutModal from '@/components/workflows/EditShortcutModal';
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
import { useRouter } from 'next/navigation';

// Mock data for now, will be replaced with Firestore data
const mockWorkflows: Shortcut[] = [
    {
        id: '1',
        title: 'Open LeetCode',
        icon: 'Code',
        color: 'bg-green-500',
        actionType: 'url',
        actionValue: 'https://leetcode.com',
    },
    {
        id: '2',
        title: 'Open University Portal',
        icon: 'GraduationCap',
        color: 'bg-blue-500',
        actionType: 'url',
        actionValue: 'https://portal.university.edu',
    },
    {
        id: '3',
        title: 'Track Internships',
        icon: 'Briefcase',
        color: 'bg-indigo-500',
        actionType: 'in-app-route',
        actionValue: '/news',
    },
];

const ShortcutCard = ({ shortcut, onEdit, onDelete }: { shortcut: Shortcut; onEdit: (shortcut: Shortcut) => void; onDelete: (id: string) => void; }) => {
    const Icon = (LucideIcons as any)[shortcut.icon] || Globe;
    const router = useRouter();

    const handleClick = () => {
        if (shortcut.actionType === 'url') {
            window.open(shortcut.actionValue, '_blank', 'noopener,noreferrer');
        } else if (shortcut.actionType === 'in-app-route') {
            router.push(shortcut.actionValue);
        }
    };

    return (
        <div className="relative group">
             <Card 
                className={`frosted-glass shadow-lg flex flex-col justify-between p-4 h-36 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border-transparent hover:border-current`}
                style={{ backgroundColor: `hsl(var(--card) / 0.7)` }}
                onClick={handleClick}
            >
                <div className="flex justify-start">
                    <div className={`p-2 rounded-lg text-white ${shortcut.color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="font-semibold text-foreground break-words">{shortcut.title}</h3>
            </Card>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => {e.stopPropagation(); onEdit(shortcut);}}>
                    <Edit className="h-4 w-4"/>
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white hover:bg-red-500/50" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Shortcut?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the "{shortcut.title}" shortcut?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(shortcut.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};


export default function WorkflowsPage() {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>(mockWorkflows);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
    const { toast } = useToast();

    const handleOpenModal = (shortcut: Shortcut | null) => {
        setEditingShortcut(shortcut);
        setIsModalOpen(true);
    };

    const handleSaveShortcut = (shortcut: Shortcut) => {
        const isEditing = shortcuts.some(s => s.id === shortcut.id);
        if (isEditing) {
            setShortcuts(shortcuts.map(s => s.id === shortcut.id ? shortcut : s));
            toast({ title: 'Shortcut Updated' });
        } else {
            setShortcuts([...shortcuts, shortcut]);
            toast({ title: 'Shortcut Created' });
        }
        setIsModalOpen(false);
    };

    const handleDeleteShortcut = (id: string) => {
        setShortcuts(shortcuts.filter(s => s.id !== id));
        toast({ title: 'Shortcut Deleted' });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
                    <LayoutGrid className="mr-3 h-8 w-8 text-accent" />
                    Workflows
                </h1>
                <p className="text-foreground/80 mt-1">
                    Create your own shortcuts to automate tasks and open frequently used links.
                </p>
            </div>

             <Card className="frosted-glass shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">Your Shortcuts</CardTitle>
                    <CardDescription>Click a tile to run the workflow. Add new shortcuts to personalize your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {shortcuts.map(shortcut => (
                            <ShortcutCard key={shortcut.id} shortcut={shortcut} onEdit={handleOpenModal} onDelete={handleDeleteShortcut} />
                        ))}
                         <button 
                            onClick={() => handleOpenModal(null)}
                            className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-accent transition-colors"
                        >
                            <PlusCircle className="h-8 w-8" />
                            <span className="mt-2 text-sm font-medium">Add Shortcut</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <EditShortcutModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                shortcutToEdit={editingShortcut}
                onSave={handleSaveShortcut}
            />
        </div>
    );
}
