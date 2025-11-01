'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { createNotification } from '@/services/notificationService';
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';
import { useFirebaseNotificationContext } from '@/components/notifications/FirebaseNotificationProvider';

export default function BrowserNotificationTesting() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isTestingBrowser, setIsTestingBrowser] = useState(false);
  const [autoTestInterval, setAutoTestInterval] = useState<NodeJS.Timeout | null>(null);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testCount, setTestCount] = useState(0);

  // Get browser notification context
  const {
    isListening,
    browserNotificationStatus,
    requestBrowserPermission
  } = useFirebaseNotificationContext();

  // Browser notification test functions
  const testNotifications = [
    {
      type: 'new_follower',
      message: 'John Doe started following you!',
      link: '/profile/john-doe',
      title: '👥 New Follower'
    },
    {
      type: 'reminder',
      message: 'Your team meeting starts in 15 minutes',
      link: '/calendar',
      title: '⏰ Calendar Reminder'
    },
    {
      type: 'call',
      message: 'Incoming call from Sarah Johnson',
      link: '/call/sarah',
      title: '📞 Call Notification'
    },
    {
      type: 'achievement',
      message: 'Congratulations! You completed 7 days in a row!',
      link: '/achievements',
      title: '🏆 Achievement'
    },
    {
      type: 'event',
      message: 'Your "Project Review" meeting is starting now',
      link: '/calendar/event/123',
      title: '📅 Event Starting'
    },
    {
      type: 'deadline',
      message: 'Project proposal deadline is tomorrow!',
      link: '/tasks/proposal',
      title: '🚨 Deadline Alert'
    }
  ];

  const handleTestBrowserNotification = async (testType?: string) => {
    if (!user) return;
    
    setIsTestingBrowser(true);
    try {
      const notification = testType 
        ? testNotifications.find(n => n.type === testType) || testNotifications[0]
        : testNotifications[Math.floor(Math.random() * testNotifications.length)];

      // Test Firebase notification (will trigger browser notification automatically)
      await createNotification({
        userId: user.uid,
        type: notification.type,
        message: notification.message,
        link: notification.link
      });

      toast({ 
        title: 'Browser Notification Sent!', 
        description: `${notification.title}: ${notification.message}` 
      });
      
      setTestCount(prev => prev + 1);
    } catch (error: any) {
      toast({ 
        title: 'Test Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsTestingBrowser(false);
    }
  };

  const handleDirectBrowserTest = async () => {
    try {
      const notification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
      await clientNotificationTrigger.triggerCustomNotification(
        notification.type,
        notification.message,
        notification.link
      );
      toast({ 
        title: 'Direct Browser Notification Sent!', 
        description: notification.title 
      });
    } catch (error: any) {
      toast({ 
        title: 'Direct Test Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const startAutoTesting = () => {
    if (isAutoTesting) {
      // Stop auto testing
      if (autoTestInterval) {
        clearInterval(autoTestInterval);
        setAutoTestInterval(null);
      }
      setIsAutoTesting(false);
      toast({ title: 'Auto Testing Stopped' });
    } else {
      // Start auto testing
      setIsAutoTesting(true);
      setTestCount(0);
      toast({ 
        title: 'Auto Testing Started', 
        description: 'Sending a test notification every 10 seconds' 
      });
      
      const interval = setInterval(() => {
        handleTestBrowserNotification();
      }, 10000); // Every 10 seconds
      
      setAutoTestInterval(interval);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoTestInterval) {
        clearInterval(autoTestInterval);
      }
    };
  }, [autoTestInterval]);

  return (
    <>
      <Separator/>
      <div className="space-y-4">
        <h3 className="font-medium flex items-center"><Brain className="mr-2 h-4 w-4" /> Browser Notifications</h3>
        <p className="text-sm text-muted-foreground">Test your Firebase → Browser notification system with real scenarios like follows, reminders, and calls.</p>
        
        {/* Status Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Firebase Listener</div>
            <div className={`text-sm font-medium ${isListening ? 'text-green-600' : 'text-red-600'}`}>
              {isListening ? '✅ Active' : '❌ Inactive'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Browser Support</div>
            <div className={`text-sm font-medium ${browserNotificationStatus.isSupported ? 'text-green-600' : 'text-red-600'}`}>
              {browserNotificationStatus.isSupported ? '✅ Supported' : '❌ Not Supported'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Tests Sent</div>
            <div className="text-sm font-medium text-blue-600">{testCount}</div>
          </div>
        </div>

        {/* Browser Permission */}
        {browserNotificationStatus.isSupported && !browserNotificationStatus.isGranted && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">Browser notifications need permission to work</p>
            <Button onClick={requestBrowserPermission} size="sm" variant="outline">
              Enable Browser Notifications
            </Button>
          </div>
        )}

        {/* Test Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">💡 How to Test</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Switch to another tab to make this tab inactive</li>
            <li>Click any test button below</li>
            <li>Browser notification should appear outside the browser</li>
            <li>Click the notification to return to this tab</li>
          </ol>
        </div>

        {/* Test Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={() => handleTestBrowserNotification()} 
              variant="outline" 
              size="sm"
              disabled={isTestingBrowser}
            >
              {isTestingBrowser && <LoadingSpinner size="sm" className="mr-2"/>}
              🎲 Random Test
            </Button>
            <Button 
              onClick={handleDirectBrowserTest} 
              variant="outline" 
              size="sm"
            >
              ⚡ Direct Test
            </Button>
          </div>

          {/* Specific Test Types */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button 
              onClick={() => handleTestBrowserNotification('new_follower')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              👥 Follow
            </Button>
            <Button 
              onClick={() => handleTestBrowserNotification('reminder')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              ⏰ Reminder
            </Button>
            <Button 
              onClick={() => handleTestBrowserNotification('call')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              📞 Call
            </Button>
            <Button 
              onClick={() => handleTestBrowserNotification('achievement')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              🏆 Achievement
            </Button>
            <Button 
              onClick={() => handleTestBrowserNotification('event')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              📅 Event
            </Button>
            <Button 
              onClick={() => handleTestBrowserNotification('deadline')} 
              variant="ghost" 
              size="sm"
              disabled={isTestingBrowser}
            >
              🚨 Deadline
            </Button>
          </div>

          {/* Auto Testing */}
          <div className="pt-2 border-t">
            <Button 
              onClick={startAutoTesting} 
              variant={isAutoTesting ? "destructive" : "secondary"}
              size="sm"
              className="w-full"
            >
              {isAutoTesting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2"/>
                  Stop Auto Testing
                </>
              ) : (
                '🚀 Start Auto Testing (10s intervals)'
              )}
            </Button>
            {isAutoTesting && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Sending notifications every 10 seconds. Switch tabs to see them!
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}