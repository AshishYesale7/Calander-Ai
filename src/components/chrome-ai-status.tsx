// Chrome AI Status Component
// Shows real-time status of Chrome AI APIs for debugging

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { chromeAIDemo } from '@/utils/chromeAiDemo';

interface ChromeAIStatus {
  available: boolean;
  apis: {
    languageModel: boolean;
    summarizer: boolean;
    writer: boolean;
    rewriter: boolean;
    translator: boolean;
    proofreader: boolean;
  };
  geminoNano: boolean;
  message: string;
}

export function ChromeAIStatusComponent() {
  const [status, setStatus] = useState<ChromeAIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const result = await chromeAIDemo.checkChromeAIAvailability();
      setStatus(result);
    } catch (error) {
      console.error('Error checking Chrome AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setTesting(true);
    try {
      const results = await chromeAIDemo.runAllDemos();
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusBadge = (available: boolean) => {
    return (
      <Badge variant={available ? "default" : "destructive"} className="ml-2">
        {available ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Available
          </>
        )}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            Checking Chrome AI Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>Could not check Chrome AI status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Chrome AI Status
            <Button onClick={checkStatus} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>{status.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overall Status */}
            <div className="space-y-2">
              <h3 className="font-semibold">Overall Status</h3>
              <div className="flex items-center">
                Chrome AI APIs
                {getStatusBadge(status.available)}
              </div>
              <div className="flex items-center">
                Gemini Nano
                {getStatusBadge(status.geminoNano)}
              </div>
            </div>

            {/* Individual APIs */}
            <div className="space-y-2">
              <h3 className="font-semibold">Individual APIs</h3>
              {Object.entries(status.apis).map(([api, available]) => (
                <div key={api} className="flex items-center">
                  {api.charAt(0).toUpperCase() + api.slice(1)}
                  {getStatusBadge(available)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!status.available && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Setup Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              Chrome AI APIs are not available. Follow these steps to enable them:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Install Chrome Canary or Chrome Dev
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto text-orange-600"
                  onClick={() => window.open('https://www.google.com/chrome/canary/', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Download Canary
                </Button>
              </li>
              <li>
                Enable Chrome AI flags at chrome://flags/
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto text-orange-600"
                  onClick={() => window.open('chrome://flags/', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Flags
                </Button>
              </li>
              <li>Restart Chrome after enabling flags</li>
              <li>
                Download Gemini Nano model at chrome://components/
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto text-orange-600"
                  onClick={() => window.open('chrome://components/', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Components
                </Button>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Test Section */}
      {status.available && (
        <Card>
          <CardHeader>
            <CardTitle>Test Chrome AI APIs</CardTitle>
            <CardDescription>
              Run tests to verify all APIs are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={testing} className="mb-4">
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <h3 className="font-semibold">Test Results</h3>
                
                {/* Successful Tests */}
                {Object.entries(testResults.demos).map(([api, result]) => (
                  <div key={api} className="border rounded p-3">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium">{api} Test</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {typeof result === 'string' ? result.substring(0, 200) + '...' : JSON.stringify(result)}
                    </div>
                  </div>
                ))}

                {/* Errors */}
                {testResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Errors</h4>
                    {testResults.errors.map((error: string, index: number) => (
                      <div key={index} className="border border-red-200 rounded p-3 bg-red-50">
                        <div className="flex items-center mb-1">
                          <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                          <span className="text-red-800 text-sm">{error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Console Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Console Commands</CardTitle>
          <CardDescription>
            Run these commands in the browser console for manual testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm bg-gray-100 p-4 rounded">
            <div>// Check if Chrome AI is available</div>
            <div className="text-blue-600">console.log(window.ai);</div>
            <div className="mt-2">// Check Gemini Nano status</div>
            <div className="text-blue-600">console.log(await window.ai?.languageModel?.capabilities());</div>
            <div className="mt-2">// Run our demo tests</div>
            <div className="text-blue-600">const demo = new ChromeAIDemo();</div>
            <div className="text-blue-600">await demo.runAllDemos();</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChromeAIStatusComponent;