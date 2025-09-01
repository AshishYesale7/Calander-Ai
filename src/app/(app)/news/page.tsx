
'use client';
import { useState, useRef } from 'react';
import type { DeadlineItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Search, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { trackDeadlines, type TrackDeadlinesOutput } from '@/ai/flows/track-deadlines-flow';
import { useApiKey } from '@/hooks/use-api-key';
import DeadlineTimeline from '@/components/news/DeadlineTimeline';

export default function NewsPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TrackDeadlinesOutput | null>(null);
  const { toast } = useToast();
  const { apiKey } = useApiKey();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({ title: "Keyword Required", description: "Please enter a topic to search for." });
      return;
    }
    setIsLoading(true);
    setResults(null);
    try {
      const response = await trackDeadlines({ keyword, apiKey });
      if (response.deadlines.length === 0) {
        toast({
          title: "No Deadlines Found",
          description: `The AI could not find any specific upcoming deadlines for "${keyword}". Try a broader term.`,
        });
      }
      // Sort deadlines by date before setting them
      response.deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setResults(response);
    } catch (error) {
      console.error('Error tracking deadlines:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        toast({
            title: 'AI Service Unavailable',
            description: 'The tracking model is temporarily overloaded. Please try again later.',
            variant: 'destructive',
        });
      } else {
        toast({
            title: 'Error',
            description: 'Failed to track deadlines. Your API key may be invalid or the service is down.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
          <Newspaper className="mr-3 h-8 w-8 text-accent" />
          AI Opportunity Tracker
        </h1>
        <p className="text-foreground/80 mt-1">
          Enter a topic, exam, or company to find and track important upcoming deadlines.
        </p>
      </div>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Track a New Topic
          </CardTitle>
          <CardDescription>
            For example: "GATE 2025", "Google Summer of Code", or "Microsoft SWE Internships".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="bg-input/50"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !keyword.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2"/>
                  Tracking...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Find Deadlines
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
          <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">The AI is searching for deadlines...</p>
          </div>
      )}

      {results && results.deadlines.length > 0 && (
        <Card className="frosted-glass shadow-lg">
           <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">
                    Timeline for "{keyword}"
                </CardTitle>
                <CardDescription>
                    Key dates and deadlines found by the AI. Click an event for more details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DeadlineTimeline deadlines={results.deadlines} />
            </CardContent>
        </Card>
      )}

    </div>
  );
}
