
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
import { HardDrive, Upload, Download, Eraser, Trash2, Shield, Info } from 'lucide-react';
import { exportUserData, importUserData, formatUserData } from '@/services/dataBackupService';
import { anonymizeUserAccount } from '@/services/userService';
import { saveAs } from 'file-saver';
import { auth } from '@/lib/firebase';

export default function DangerZoneSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFormatting, setIsFormatting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleExportData = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
          const data = await exportUserData(user.uid);
          saveAs(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'futuresight-backup.json');
        } catch (error) {
           toast({ title: 'Export Failed', variant: 'destructive' });
        } finally {
          setIsExporting(false);
        }
    };
    
    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;
        setIsImporting(true);
        try {
          const data = JSON.parse(await e.target.files[0].text());
          await importUserData(user.uid, data);
          toast({ title: 'Import successful', description: 'Reloading...' });
          window.location.reload();
        } catch (error: any) {
          toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
        } finally {
          setIsImporting(false);
        }
    };

    const handleFormatData = async () => {
        if (!user) return;
        setIsFormatting(true);
        try {
            await formatUserData(user.uid);
            toast({ title: 'Data Formatted', description: 'Your account data has been cleared. Reloading...' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Could not format data.', variant: 'destructive'});
        } finally {
            setIsFormatting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            await anonymizeUserAccount(user.uid);
            toast({ title: 'Account Deletion Initiated', description: 'Your account is scheduled for deletion in 30 days.'});
            await auth.signOut();
            window.location.href = '/';
        } catch (error: any) {
            toast({ title: 'Error', description: 'Could not initiate account deletion.', variant: 'destructive'});
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="font-medium flex items-center"><HardDrive className="mr-2 h-4 w-4" /> Data Management</h3>
                <p className="text-sm text-muted-foreground">Export all your app data to a JSON file, or import a backup to restore your account.</p>
                <div className="flex gap-2">
                <Button onClick={handleExportData} variant="outline" disabled={isExporting} className="w-full">
                    {isExporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Exporting...' : 'Export My Data'}
                </Button>
                <Button onClick={handleImportClick} variant="outline" disabled={isImporting} className="w-full">
                    {isImporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isImporting ? 'Importing...' : 'Import from Backup'}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                </div>
            </div>
            
            <div className="space-y-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                <h3 className="font-medium flex items-center text-destructive"><Shield className="mr-2 h-4 w-4" /> Danger Zone</h3>
                <p className="text-sm text-destructive/80">These are irreversible actions. Please proceed with caution.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/20 hover:text-destructive w-full">
                        {isFormatting ? <LoadingSpinner size="sm" className="mr-2" /> : <Eraser className="mr-2 h-4 w-4" />}
                        Format All Data
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete all your data (goals, skills, events, etc.) but keep your account and subscription active. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleFormatData}>Format Data</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        {isDeleting ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete My Account
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will anonymize your profile and schedule your account and all associated data for permanent deletion in 30 days. You can log back in within this period to reclaim your account. This action cannot be undone after 30 days.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </div>
            </div>
        </div>
    );
}
