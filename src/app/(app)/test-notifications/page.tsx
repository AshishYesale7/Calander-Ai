'use client';

import React from 'react';
import { NotificationTester } from '@/components/notifications/NotificationTester';

/**
 * Test page for browser notifications
 * Visit /test-notifications to test the notification system
 */
export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔔 Browser Notifications Test
          </h1>
          <p className="text-gray-600">
            Test your Firebase → Browser notification integration
          </p>
        </div>

        <div className="grid gap-8">
          {/* Main Tester */}
          <NotificationTester />

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 Complete Testing Guide
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🎯 What This Tests</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li><strong>Follow Notifications:</strong> When someone follows you</li>
                  <li><strong>Calendar Reminders:</strong> Meeting and event notifications</li>
                  <li><strong>Call Notifications:</strong> Incoming call alerts</li>
                  <li><strong>Achievements:</strong> Goal completion notifications</li>
                  <li><strong>Events:</strong> Calendar event start notifications</li>
                  <li><strong>Deadlines:</strong> Urgent deadline alerts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">🔧 How It Works</h3>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Your app listens to Firebase database changes in real-time</li>
                  <li>When a new notification is added to <code className="bg-gray-100 px-1 rounded">/users/{'{userId}'}/notifications</code></li>
                  <li>The system automatically triggers a browser notification</li>
                  <li>Chrome AI enhances the message (if available)</li>
                  <li>Notification appears outside the browser window</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">🧪 Testing Steps</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li><strong>Enable Permissions:</strong> Click "Enable Browser Notifications" if needed</li>
                    <li><strong>Switch Tabs:</strong> Open another tab to make this tab inactive</li>
                    <li><strong>Trigger Test:</strong> Click any "Firebase Test" button above</li>
                    <li><strong>See Notification:</strong> Browser notification should appear</li>
                    <li><strong>Click Notification:</strong> Should bring you back to this tab</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">🚀 Real-World Usage</h3>
                <p className="text-sm text-gray-600 mb-2">
                  In your actual app, notifications are triggered automatically when:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Someone follows you (Firebase adds notification → Browser notification shows)</li>
                  <li>Calendar reminder fires (Firebase adds notification → Browser notification shows)</li>
                  <li>Someone calls you (Firebase adds notification → Browser notification shows)</li>
                  <li>Any other Firebase notification is created</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">🤖 Chrome AI Enhancement</h3>
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <p className="text-sm text-purple-800 mb-2">
                    If you're using Chrome Canary with Chrome AI flags enabled:
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                    <li>Notification messages are automatically improved</li>
                    <li>Example: "Meeting in 15 minutes" → "Your team meeting starts in 15 minutes! 📅"</li>
                    <li>Falls back to original message if Chrome AI is unavailable</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Support */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🌐 Browser Support
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-green-700 mb-2">✅ Fully Supported</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Chrome (all versions)</li>
                  <li>• Firefox (22+)</li>
                  <li>• Safari (7+)</li>
                  <li>• Edge (14+)</li>
                  <li>• Chrome Canary (with Chrome AI)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-red-700 mb-2">❌ Not Supported</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Internet Explorer</li>
                  <li>• Very old mobile browsers</li>
                  <li>• Browsers with notifications disabled</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}