
'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Wand2 } from 'lucide-react';
import { useApiKey } from '@/hooks/use-api-key';
import { summarizeText } from '@/ai/flows/summarize-text-flow';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils'; // Import the cn utility

export default function SummarizerTab() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Input Required', description: 'Please enter some text to summarize.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setSummary('');
    try {
      const result = await summarizeText({ textToSummarize: inputText, apiKey });
      setSummary(result.summary);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate summary.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-muted/30">
      <header className="flex-shrink-0 mb-4">
        <h3 className="font-semibold text-lg text-primary flex items-center">
          <FileText className="mr-2 h-5 w-5" /> Text Summarizer
        </h3>
        <p className="text-sm text-muted-foreground">
          Paste any text to get a concise summary.
        </p>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-2">
          <label htmlFor="input-text" className="text-sm font-medium">Your Text</label>
          <Textarea
            id="input-text"
            placeholder="Paste your article, notes, or any block of text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 resize-none bg-black/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="summary-output" className="text-sm font-medium">AI Summary</label>
          <Card className="flex-1 frosted-glass bg-card/80">
            <ScrollArea className="h-full">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : summary ? (
                  <p className="text-sm whitespace-pre-wrap">{summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Your summary will appear here...</p>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      </div>
      <div className="mt-4 flex-shrink-0">
        <Button onClick={handleSummarize} disabled={isLoading || !inputText.trim()} className="w-full">
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Summarize
        </Button>
      </div>
    </div>
  );
}

// Temporary Card component for standalone use until a global one is available
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
