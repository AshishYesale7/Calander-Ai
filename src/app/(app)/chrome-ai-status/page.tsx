// Chrome AI Status Page
// Dedicated page for checking and testing Chrome AI integration

import ChromeAIStatusComponent from '@/components/chrome-ai-status';

export default function ChromeAIStatusPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chrome AI Status</h1>
        <p className="text-gray-600">
          Check the status of Chrome AI APIs and test the integration for the Google Chrome AI Hackathon 2025.
        </p>
      </div>
      
      <ChromeAIStatusComponent />
    </div>
  );
}