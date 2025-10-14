
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // Check initial status
    if (typeof window !== 'undefined') {
        if (!window.navigator.onLine) {
            handleOffline();
        }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-[40%] -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div className="flex items-center gap-2 p-2 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700 shadow-lg backdrop-blur-md">
            <LoadingSpinner size="sm" className="text-slate-400 h-3 w-3" />
            <span className="text-xs font-medium">Reconnecting...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
