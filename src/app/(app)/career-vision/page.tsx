
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Sparkles, Bot, CheckCircle, Lightbulb, Map, BookOpen, Link as LinkIconLucide, Share2, Palette, ExternalLink, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { generateCareerVision, type GenerateCareerVisionOutput } from '@/ai/flows/career-vision-flow';
import { useApiKey } from '@/hooks/use-api-key';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const getResourceIcon = (type: GenerateCareerVisionOutput['suggestedResources'][0]['type']) => {
  switch (type) {
    case 'Course': return <BookOpen className="h-4 w-4" />;
    case 'Book': return <BookOpen className="h-4 w-4" />;
    case 'Community': return <Share2 className="h-4 w-4" />;
    case 'Tool': return <Palette className="h-4 w-4" />;
    case 'Website': return <LinkIconLucide className="h-4 w-4" />;
    default: return <LinkIconLucide className="h-4 w-4" />;
  }
};

export default function CareerVisionPage() {
  const [userInput, setUserInput] = useState('');
  const [careerPlan, setCareerPlan] = useState<GenerateCareerVisionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const { toast } = useToast();
  const { apiKey } = useApiKey();

  const handleGenerateVision = async () => {
    if (!userInput.trim()) {
        toast({
            title: 'Input Required',
            description: 'Please describe your passions or aspirations first.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsLoading(true);
    setCareerPlan(null); // Clear previous plan
    
    try {
      const result = await generateCareerVision({ aspirations: userInput, apiKey });
      setCareerPlan(result);
    } catch (error) {
      console.error('Error generating career vision:', error);
      if (!apiKey) {
        // If the user didn't provide a key and it failed, the server key is likely missing.
        setShowApiKeyDialog(true);
      } else {
        // If the user DID provide a key and it failed, their key is likely invalid.
        toast({
            title: 'API Key Error',
            description: 'Your provided Gemini API key appears to be invalid or has insufficient permissions. Please check it in Settings.',
            variant: 'destructive',
            duration: 8000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary">Career Vision Planner</h1>
        <p className="text-foreground/80 mt-1">
          Use AI to transform your aspirations into a comprehensive and actionable career plan.
        </p>
      </div>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Eye className="mr-2 h-5 w-5 text-accent" /> Your Aspirations
          </CardTitle>
          <CardDescription>
            Describe your passions, what problems you want to solve, or what impact you want to make. The more detail, the better the plan!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., I'm passionate about building scalable backend systems and leveraging AI for social good. I enjoy working in collaborative teams and want to eventually lead a technical team..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={6}
            className="bg-background/50 focus:bg-background"
          />
          <Button onClick={handleGenerateVision} disabled={isLoading || !userInput.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6 px-8">
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Generating Your Plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Generate My Career Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">The AI is crafting your personalized plan...</p>
        </div>
      )}

      {careerPlan && (
        <div className="space-y-6 animate-in fade-in-up duration-500">
          
          <Card className="frosted-glass shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center">
                <Bot className="mr-2 h-5 w-5 text-accent" /> Your AI-Generated Career Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 text-lg leading-relaxed">{careerPlan.visionStatement}</p>
            </CardContent>
          </Card>

          <Card className="frosted-glass shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">Personal Analysis</CardTitle>
                <CardDescription>Strengths to leverage and areas for growth based on your input.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-lg flex items-center text-primary mb-3">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-400"/> Key Strengths
                    </h3>
                    <ul className="space-y-2 list-inside">
                        {careerPlan.keyStrengths.map((strength, i) => (
                            <li key={i} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-3 mt-1 text-accent flex-shrink-0" />
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg flex items-center text-primary mb-3">
                        <Lightbulb className="mr-2 h-5 w-5 text-yellow-400"/> Development Areas
                    </h3>
                    <ul className="space-y-2 list-inside">
                        {careerPlan.developmentAreas.map((area, i) => (
                             <li key={i} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-3 mt-1 text-accent flex-shrink-0" />
                                <span>{area}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
          </Card>

          <Card className="frosted-glass shadow-lg">
              <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary flex items-center">
                      <Map className="mr-2 h-5 w-5 text-accent"/> Your Actionable Roadmap
                  </CardTitle>
                  <CardDescription>A step-by-step guide to get you started.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  {careerPlan.roadmap.map((step) => (
                      <div key={step.step} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
                                  {step.step}
                              </div>
                              {step.step < careerPlan.roadmap.length && <div className="w-0.5 h-12 bg-border mt-2"></div>}
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-lg text-primary">{step.title}</h4>
                                <Badge variant="outline">{step.duration}</Badge>
                              </div>
                              <p className="text-muted-foreground mt-1">{step.description}</p>
                          </div>
                      </div>
                  ))}
              </CardContent>
          </Card>

           <div className="grid md:grid-cols-2 gap-6">
              <Card className="frosted-glass shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-xl text-primary flex items-center">
                          <BookOpen className="mr-2 h-5 w-5 text-accent"/> Suggested Resources
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-3">
                          {careerPlan.suggestedResources.map((res, i) => (
                              <li key={i}>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-accent">
                                          {getResourceIcon(res.type)}
                                      </div>
                                      <div className="flex-1">
                                          <p className="font-medium group-hover:text-accent transition-colors">{res.title}</p>
                                          <p className="text-xs text-muted-foreground">{res.type}</p>
                                      </div>
                                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </CardContent>
              </Card>

              <Card className="frosted-glass shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-xl text-primary flex items-center">
                         <Palette className="mr-2 h-5 w-5 text-accent"/> Visualize Your Plan
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <h4 className="font-semibold text-primary">{careerPlan.diagramSuggestion.type}</h4>
                      <p className="text-muted-foreground mt-1">{careerPlan.diagramSuggestion.description}</p>
                  </CardContent>
              </Card>
            </div>
        </div>
      )}

      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent className="frosted-glass">
            <AlertDialogHeader>
                <AlertDialogTitle>AI Feature Configuration Needed</AlertDialogTitle>
                <AlertDialogDescription>
                    The app's default AI key is not configured. You can provide your own free Google Gemini API key to use this feature.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="text-sm space-y-2">
                <p className="font-semibold">How to get your API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent underline">Google AI Studio</a>.</li>
                    <li>Click "Create API key in new project".</li>
                    <li>Copy the generated API key.</li>
                    <li>Paste it in this app's settings.</li>
                </ol>
                <p className="pt-2">You can access Settings from the user menu in the sidebar (bottom-left on desktop, top-right on mobile).</p>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowApiKeyDialog(false)}>Got it</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
