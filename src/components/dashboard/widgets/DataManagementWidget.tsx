'use client';
import { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Eraser } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { exportUserData, importUserData, formatUserData } from '@/services/dataBackupService';
import { saveAs } from 'file-saver';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { TimelineEvent } from '@/types';

interface DataManagementWidgetProps {
  events: TimelineEvent[];
  onImportComplete: () => void;
}

export default function DataManagementWidget({ events, onImportComplete }: DataManagementWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = useCallback(async () => {
    if (!user) return;
    setIsExporting(true);
    toast({ title: 'Exporting...', description: 'Gathering your data.' });
    try {
      const data = await exportUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `futuresight-backup-${new Date().toISOString().split('T')[0]}.json`);
      toast({ title: 'Export Complete' });
    } catch (error) {
      toast({ title: 'Export Failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }, [user, toast]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsImporting(true);
    toast({ title: 'Importing...', description: 'Parsing your data file.' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast({ title: 'Error', description: 'Could not read file.', variant: 'destructive' });
        setIsImporting(false);
        return;
      }
      try {
        const dataToImport = JSON.parse(content);
        await importUserData(user.uid, dataToImport);
        toast({ title: 'Import Successful', description: 'Data imported. Reloading...' });
        onImportComplete();
      } catch (error: any) {
        toast({ title: 'Import Failed', description: `Invalid file format: ${error.message}`, variant: 'destructive' });
      } finally {
        setIsImporting(false);
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  }, [user, toast, onImportComplete]);

  const handleFormatData = async () => {
    if(!user) return;
    setIsFormatting(true);
    try {
        await formatUserData(user.uid);
        toast({ title: 'Format Complete', description: 'Your account data has been cleared. Reloading...' });
        setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
        toast({ title: 'Format Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsFormatting(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col frosted-glass">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Data Management</CardTitle>
        <CardDescription>Export, import, or format your account data.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        <Button onClick={handleExportData} variant="outline" disabled={isExporting}>
          {isExporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
          {isExporting ? 'Exporting...' : 'Export My Data'}
        </Button>
        <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
          {isImporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
          {isImporting ? 'Importing...' : 'Import from Backup'}
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isFormatting}>
              {isFormatting ? <LoadingSpinner size="sm" className="mr-2" /> : <Eraser className="mr-2 h-4 w-4" />}
              {isFormatting ? 'Formatting...' : 'Format Data'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="frosted-glass">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to format your data?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all your events, goals, and settings, but will not delete your account. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFormatData} className="bg-destructive hover:bg-destructive/90">
                Yes, Format My Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
