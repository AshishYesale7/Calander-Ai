
'use client';
import { useState, useEffect } from 'react';
import type { CareerGoal, Skill, CareerVisionHistoryItem, ResourceLink } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, Sparkles, Bot, CheckCircle, Lightbulb, Map, BookOpen, Link as LinkIconLucide, Share2, Palette, ExternalLink, ArrowRight, PlusCircle, History, Trash2, FileText } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { saveCareerGoal } from '@/services/careerGoalsService';
import { saveSkill } from '@/services/skillsService';
import { getCareerVisionHistory, saveCareerVision, deleteCareerVision } from '@/services/careerVisionService';
import { saveBookmarkedResource } from '@/services/resourcesService';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const getResourceIcon = (category: ResourceLink['category']) => {
  switch (category) {
    case 'course': return <BookOpen className="h-4 w-4" />;
    case 'book': return <BookOpen className="h-4 w-4" />;
    case 'community': return <Share2 className="h-4 w-4" />;
    case 'tool': return <Palette className="h-4 w-4" />;
    case 'article': return <FileText className="h-4 w-4" />;
    case 'website': return <LinkIconLucide className="h-4 w-4" />;
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
  const { user } = useAuth();
  
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // New state for history
  const [visionHistory, setVisionHistory] = useState<CareerVisionHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsHistoryLoading(true);
      getCareerVisionHistory(user.uid)
        .then(setVisionHistory)
        .catch(() => toast({ title: "Error", description: "Could not load vision history.", variant: "destructive" }))
        .finally(() => setIsHistoryLoading(false));
    }
  }, [user, toast]);


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
    setAddedItems(new Set()); // Clear added items for the new plan
    setSelectedHistoryId(null); // Deselect history when generating a new one
    
    try {
      const result = await generateCareerVision({ aspirations: userInput, apiKey });
      setCareerPlan(result);

      // Save to history
      if (user) {
        const newHistoryItem = await saveCareerVision(user.uid, userInput, result);
        setVisionHistory(prev => [newHistoryItem, ...prev]);
        setSelectedHistoryId(newHistoryItem.id); // Select the newly created one
      }

    } catch (error) {
      console.error('Error generating career vision:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
          toast({
              title: 'AI Service Temporarily Unavailable',
              description: "The AI model is currently overloaded. This is a temporary issue. Please try again in a few moments.",
              variant: 'destructive',
              duration: 8000,
          });
      } else if (!apiKey) {
        setShowApiKeyDialog(true);
      } else {
        toast({
            title: 'API Generation Error',
            description: 'Failed to generate the plan. Your API key might be invalid or the service may be down. Please check your key in Settings and try again.',
            variant: 'destructive',
            duration: 9000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async (roadmapStep: GenerateCareerVisionOutput['roadmap'][0]) => {
    if (!user) return;
    const goalId = `goal-${roadmapStep.step}`;
    
    const newGoal: Omit<CareerGoal, 'deadline'> & { deadline?: string | null } = {
        id: `vision-${Date.now()}-${roadmapStep.step}`,
        title: roadmapStep.title,
        description: `${roadmapStep.description} (Suggested Duration: ${roadmapStep.duration})`,
        progress: 0,
    };

    try {
      await saveCareerGoal(user.uid, newGoal);
      toast({ title: 'Goal Added', description: `"${roadmapStep.title}" has been added to your Career Goals.` });
      setAddedItems(prev => new Set(prev).add(goalId));
    } catch (error) {
      console.error('Failed to save career goal:', error);
      toast({ title: 'Error', description: 'Could not save the goal.', variant: 'destructive' });
    }
  };

  const handleAddSkill = async (skillName: string) => {
    if (!user) return;
    
    const safeIdPart = skillName
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w-]/g, ' ') // Allow spaces
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');


    const newSkill: Omit<Skill, 'lastUpdated'> & { lastUpdated: string } = {
        id: `vision-${Date.now()}-${safeIdPart}`,
        name: skillName,
        category: 'Other',
        proficiency: 'Beginner',
        lastUpdated: new Date().toISOString(),
    };

    try {
      await saveSkill(user.uid, newSkill);
      toast({ title: 'Skill Added', description: `"${skillName}" has been added to your Skills.` });
      setAddedItems(prev => new Set(prev).add(skillName));
    } catch (error) {
      console.error('Failed to save skill:', error);
      toast({ title: 'Error', description: 'Could not save the skill.', variant: 'destructive' });
    }
  };
  
  const handleAddResource = async (resource: GenerateCareerVisionOutput['suggestedResources'][0]) => {
    if (!user) return;
    const resourceId = `resource-${resource.url}`;

    const newResource: ResourceLink = {
        id: `vision-${Date.now()}-${resource.title.substring(0, 10).replace(/\s+/g, '-')}`,
        title: resource.title,
        url: resource.url,
        description: resource.description,
        category: resource.category,
        isAiRecommended: false, // Save it as a user-bookmarked resource
    };

    try {
      await saveBookmarkedResource(user.uid, newResource);
      toast({ title: 'Resource Added', description: `"${resource.title}" has been added to your Resources.` });
      setAddedItems(prev => new Set(prev).add(resourceId));
    } catch (error) {
      console.error('Failed to save resource:', error);
      toast({ title: 'Error', description: 'Could not save the resource.', variant: 'destructive' });
    }
  };

  const handleViewHistory = (item: CareerVisionHistoryItem) => {
    if (selectedHistoryId === item.id) {
      // This history item is currently displayed. Hide it.
      setUserInput('');
      setCareerPlan(null);
      setSelectedHistoryId(null);
    } else {
      // A different (or no) history item is displayed. Show this one.
      setUserInput(item.prompt);
      setCareerPlan(item.plan);
      setAddedItems(new Set()); // Reset added items for the new plan context
      setSelectedHistoryId(item.id);
    }
  };
  
  const handleDeleteHistory = async (visionId: string) => {
    if (!user) return;
    
    const originalHistory = visionHistory;
    setVisionHistory(prev => prev.filter(item => item.id !== visionId));

    try {
      await deleteCareerVision(user.uid, visionId);
      toast({ title: "History Deleted", description: "The career vision has been removed from your history." });
      if (selectedHistoryId === visionId) {
        setUserInput('');
        setCareerPlan(null);
        setSelectedHistoryId(null);
      }
    } catch (error) {
      setVisionHistory(originalHistory);
      toast({ title: "Error", description: "Could not delete vision from history.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary">Career Vision Planner</h1>
        <p className="text-foreground/80 mt-1">
          Use AI to transform your aspirations into an actionable career plan.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
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
              className="bg-background/90 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent"
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
              <CardContent className="space-y-8">
                  <div>
                      <h3 className="font-semibold text-lg flex items-center text-primary mb-3">
                          <CheckCircle className="mr-2 h-5 w-5 text-green-400"/> Key Strengths
                      </h3>
                      <ul className="space-y-2 list-inside columns-1 md:columns-2">
                          {careerPlan.keyStrengths.map((strength, i) => (
                              <li key={i} className="flex items-start break-inside-avoid-column">
                                  <ArrowRight className="h-4 w-4 mr-3 mt-1 text-accent flex-shrink-0" />
                                  <span>{strength}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                  
                  <div>
                      <h3 className="font-semibold text-lg flex items-center text-primary mb-4">
                          <Lightbulb className="mr-2 h-5 w-5 text-yellow-400"/> Recommended Development Areas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                              <h4 className="font-semibold text-base text-primary mb-2">Technical Skills</h4>
                              <ul className="space-y-2">
                                  {(careerPlan.developmentAreas?.technical || []).map((skill, i) => (
                                      <li key={`tech-${i}`} className="flex items-center justify-between gap-2 text-sm text-foreground/90">
                                          <span className="flex-1">{skill}</span>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleAddSkill(skill)} disabled={addedItems.has(skill)} title={`Add skill: ${skill}`}>
                                              {addedItems.has(skill) ? <CheckCircle className="h-4 w-4 text-green-500" /> : <PlusCircle className="h-4 w-4" />}
                                          </Button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                              <h4 className="font-semibold text-base text-primary mb-2">Hard Skills</h4>
                              <ul className="space-y-2">
                                  {(careerPlan.developmentAreas?.hard || []).map((skill, i) => (
                                     <li key={`hard-${i}`} className="flex items-center justify-between gap-2 text-sm text-foreground/90">
                                         <span className="flex-1">{skill}</span>
                                         <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleAddSkill(skill)} disabled={addedItems.has(skill)} title={`Add skill: ${skill}`}>
                                             {addedItems.has(skill) ? <CheckCircle className="h-4 w-4 text-green-500" /> : <PlusCircle className="h-4 w-4" />}
                                         </Button>
                                     </li>
                                  ))}
                              </ul>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                              <h4 className="font-semibold text-base text-primary mb-2">Soft Skills</h4>
                              <ul className="space-y-2">
                                  {(careerPlan.developmentAreas?.soft || []).map((skill, i) => (
                                      <li key={`soft-${i}`} className="flex items-center justify-between gap-2 text-sm text-foreground/90">
                                          <span className="flex-1">{skill}</span>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => handleAddSkill(skill)} disabled={addedItems.has(skill)} title={`Add skill: ${skill}`}>
                                              {addedItems.has(skill) ? <CheckCircle className="h-4 w-4 text-green-500" /> : <PlusCircle className="h-4 w-4" />}
                                          </Button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              </CardContent>
            </Card>

            <Card className="frosted-glass shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary flex items-center">
                        <Map className="mr-2 h-5 w-5 text-accent"/> Your Actionable Roadmap
                    </CardTitle>
                    <CardDescription>A step-by-step guide to get you started. Add these goals to your dashboard!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {careerPlan.roadmap.map((step) => (
                        <div key={step.step} className="p-3 rounded-md border border-border/50 bg-background/30 flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-accent-foreground font-bold text-lg">
                                {step.step}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                      <h4 className="font-semibold text-lg text-primary">{step.title}</h4>
                                      <Badge variant="outline" className="mt-1">{step.duration}</Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={() => handleAddGoal(step)}
                                    disabled={addedItems.has(`goal-${step.step}`)}
                                  >
                                    {addedItems.has(`goal-${step.step}`) ? <CheckCircle className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    {addedItems.has(`goal-${step.step}`) ? 'Added' : 'Add Goal'}
                                  </Button>
                                </div>
                                <p className="text-muted-foreground mt-2 text-sm">{step.description}</p>
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
                            {careerPlan.suggestedResources.map((res, i) => {
                              const resourceId = `resource-${res.url}`;
                              return (
                                 <li key={i} className="p-3 rounded-md border border-border/50 bg-background/30">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-accent flex-shrink-0">
                                            {getResourceIcon(res.category)}
                                        </div>
                                        <div className="flex-1">
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent transition-colors block">{res.title}</a>
                                            <p className="text-xs text-muted-foreground capitalize">{res.category}</p>
                                            <p className="text-sm text-foreground/80 mt-1">{res.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                             <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAddResource(res)}
                                                disabled={addedItems.has(resourceId)}
                                              >
                                                {addedItems.has(resourceId) ? <CheckCircle className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                                {addedItems.has(resourceId) ? 'Added' : 'Add'}
                                              </Button>
                                              <a href={res.url} target="_blank" rel="noopener noreferrer">
                                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                                      <ExternalLink className="h-4 w-4" />
                                                  </Button>
                                              </a>
                                        </div>
                                    </div>
                                </li>
                              )
                            })}
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
                        <p className="text-muted-foreground mt-1 text-sm">{careerPlan.diagramSuggestion.description}</p>
                    </CardContent>
                </Card>
              </div>
          </div>
        )}
      </div>

      {/* Vision History Section */}
      <div className="mt-12">
        <Card className="frosted-glass shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                    <History className="mr-2 h-5 w-5 text-accent" /> Vision History
                </CardTitle>
                <CardDescription>
                    View or delete your previously generated plans.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isHistoryLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : visionHistory.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                            {visionHistory.map(item => (
                                <div key={item.id} className={cn(
                                    "p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-background/70 transition-colors",
                                    selectedHistoryId === item.id && "bg-accent/10 border-accent"
                                )}>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">
                                        {item.prompt}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                    </p>
                                    <div className="flex justify-end items-center gap-2 mt-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="frosted-glass">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete this vision?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently remove this generated plan from your history.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteHistory(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button variant="outline" size="sm" className="h-7 w-[120px]" onClick={() => handleViewHistory(item)}>
                                            {selectedHistoryId === item.id ? (
                                                <><EyeOff className="mr-2 h-4 w-4" /> Hide Plan</>
                                            ) : (
                                                <><Eye className="mr-2 h-4 w-4" /> View Plan</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No history yet. Generate your first career plan!
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

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
