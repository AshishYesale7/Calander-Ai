
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { reclaimUserAccount } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { differenceInDays } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReclamationModal() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [reclaimState, setReclaimState] = useState<'prompt' | 'confirmed'>('prompt');
    const [isReclaiming, setIsReclaiming] = useState(false);
    
    const deletionDate = useMemo(() => {
        if (user?.deletionScheduledAt) {
            return new Date(user.deletionScheduledAt);
        }
        return null;
    }, [user?.deletionScheduledAt]);
    
    const daysRemaining = useMemo(() => {
        if (!deletionDate) return 0;
        const remaining = differenceInDays(deletionDate, new Date());
        return Math.max(0, remaining);
    }, [deletionDate]);

    useEffect(() => {
        if (reclaimState === 'confirmed') {
            const timer = setTimeout(async () => {
                await refreshUser();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [reclaimState, refreshUser]);

    const handleReclaim = async () => {
        if (!user) return;
        setIsReclaiming(true);
        try {
            await reclaimUserAccount(user.uid);
            setReclaimState('confirmed');
        } catch (error: any) {
            toast({ title: 'Error', description: `Could not reclaim account: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsReclaiming(false);
        }
    };

    const handleCancel = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AlertDialog open={true} onOpenChange={() => {}}>
            <AlertDialogContent className="frosted-glass" hideCloseButton={true}>
                <AnimatePresence mode="wait">
                    {reclaimState === 'prompt' && (
                        <motion.div key="prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reclaim Your Account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This account is scheduled for permanent deletion in{' '}
                                    <span className="font-bold text-destructive">{daysRemaining} day{daysRemaining !== 1 && 's'}</span>.
                                    You can reclaim your account now, or cancel to proceed with deletion.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel onClick={handleCancel}>Cancel & Sign Out</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReclaim} disabled={isReclaiming}>
                                    {isReclaiming && <LoadingSpinner size="sm" className="mr-2" />}
                                    Reclaim My Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </motion.div>
                    )}
                    {reclaimState === 'confirmed' && (
                        <motion.div key="confirmed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <AlertDialogTitle>Welcome Back!</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your account has been restored. Reloading your dashboard...
                            </AlertDialogDescription>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AlertDialogContent>
        </AlertDialog>
    );
}
