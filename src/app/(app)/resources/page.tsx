
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ResourceLink } from '@/types';
import { mockResourceLinks } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, LinkIcon, PlusCircle, Bot, ExternalLink, Trash2, Edit3, BookOpen, Share2, Palette, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { suggestResources } from '@/ai/flows/suggest-resources';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
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
import EditResourceModal from '@/components/resources/EditResourceModal';
import { useAuth } from '@/context/AuthContext';
import { getBookmarkedResources, saveBookmarkedResource, deleteBookmarkedResource } from '@/services/resourcesService';
import { useApiKey } from '@/hooks/use-api-key';
import { cn } from '@/lib/utils';

const RESOURCES_STORAGE_KEY = 'futureSightBookmarkedResources';
const AI_SUGGESTIONS_STORAGE_KEY = 'futureSightAiSuggestions';

const resourceCategories: ResourceLink['category'][] = ['book', 'course', 'tool', 'article', 'website', 'community', 'other'];

const getResourceIcon = (category: ResourceLink['category']) => {
  switch (category) {
    case 'course': return <BookOpen className="h-4 w-4" />;
    case 'book': return <BookOpen className="h-4 w-4" />;
    case 'community': return <Share2 className="h-4 w-4" />;
    case 'tool': return <Palette className="h-4 w-4" />;
    case 'article': return <FileText className="h-4 w-4" />;
    case 'website': return <LinkIcon className="h-4 w-4" />;
    default: return <LinkIcon className="h-4 w-4" />;
  }
};

const syncToLocalStorage = (key: string, data: ResourceLink[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to local storage key ${key}`, error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: ResourceLink[]): ResourceLink[] => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const storedResources = localStorage.getItem(key);
    return storedResources ? JSON.parse(storedResources) : defaultValue;
  } catch (error) {
    console.error(`Failed to load from local storage key ${key}`, error);
    return defaultValue;
  }
};

export default function ResourcesPage() {
  const { user } = useAuth();
  const [bookmarkedResources, setBookmarkedResources] = useState<ResourceLink[]>(() => loadFromLocalStorage(RESOURCES_STORAGE_KEY, mockResourceLinks));
  const [aiSuggestedResources, setAiSuggestedResources] = useState<ResourceLink[]>(() => loadFromLocalStorage(AI_SUGGESTIONS_STORAGE_KEY, []));
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceLink | null>(null);
  const { toast } = useToast();
  const { apiKey } = useApiKey();
  const [activeFilter, setActiveFilter] = useState<ResourceLink['category'] | 'all'>('all');

  const searchParams = useSearchParams();
  const router = useRouter();

  // Background sync with Firestore for user's bookmarks
  useEffect(() => {
    const syncWithFirestore = async () => {
      if (user) {
        try {
          const firestoreResources = await getBookmarkedResources(user.uid);
          setBookmarkedResources(firestoreResources);
          syncToLocalStorage(RESOURCES_STORAGE_KEY, firestoreResources);
        } catch (error) {
          console.error("Failed to fetch resources from Firestore, using local data.", error);
          toast({ title: "Offline Mode", description: "Could not sync resources. Displaying locally saved resources.", variant: "destructive"});
        }
      }
    };
    syncWithFirestore();
  }, [user, toast]);
  
  // Persist AI suggestions to local storage when they change
  useEffect(() => {
      syncToLocalStorage(AI_SUGGESTIONS_STORAGE_KEY, aiSuggestedResources);
  }, [aiSuggestedResources]);

  const fetchAiSuggestions = async () => {
    if (!user) {
      toast({ title: "Please Sign In", description: "You must be signed in to get personalized suggestions.", variant: "destructive" });
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const result = await suggestResources({ userId: user.uid, apiKey });
      
      const newSuggestions: ResourceLink[] = result.suggestedResources.map((res, index) => ({
          id: `ai-${Date.now()}-${index}`,
          ...res,
          isAiRecommended: true,
      }));
      setAiSuggestedResources(newSuggestions);
      if(newSuggestions.length === 0) {
        toast({ title: "AI Suggestions", description: "No new suggestions found at this time." });
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
          toast({ title: "AI Service Unavailable", description: "The suggestion model is temporarily overloaded. Please try again later.", variant: "destructive" });
      } else {
          toast({ title: "Error", description: "Failed to fetch AI suggestions. Your API key may be invalid.", variant: "destructive" });
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleOpenModal = (resource: ResourceLink | null) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };
  
  // Effect to handle actions from command palette
  useEffect(() => {
    if (searchParams.get('action') === 'newBookmark') {
      handleOpenModal(null);
      router.replace('/resources', { scroll: false });
    }
  }, [searchParams, router]);

  const handleDeleteResource = async (resourceId: string) => {
    const originalResources = bookmarkedResources;
    const newResources = bookmarkedResources.filter(res => res.id !== resourceId);
    setBookmarkedResources(newResources);

    toast({ title: "Resource Deleted", description: "The bookmarked resource has been removed." });
    syncToLocalStorage(RESOURCES_STORAGE_KEY, newResources);

    if (user) {
        try {
            await deleteBookmarkedResource(user.uid, resourceId);
        } catch (error) {
            console.error("Failed to delete resource from Firestore", error);
            toast({ title: "Sync Error", description: "Failed to delete resource from the server. It is removed locally.", variant: "destructive" });
        }
    }
  };

  const handleSaveResource = async (resourceToSave: ResourceLink) => {
    const resourceExists = bookmarkedResources.some(r => r.id === resourceToSave.id);
    let newResources: ResourceLink[];
    
    if (resourceExists) {
      newResources = bookmarkedResources.map(r => r.id === resourceToSave.id ? resourceToSave : r);
      toast({ title: "Resource Updated", description: "Your bookmark has been successfully updated." });
    } else {
      newResources = [...bookmarkedResources, resourceToSave];
      toast({ title: "Resource Added", description: "New resource bookmarked successfully." });
    }

    setBookmarkedResources(newResources);
    setIsModalOpen(false);
    setEditingResource(null);
    syncToLocalStorage(RESOURCES_STORAGE_KEY, newResources);

    if (user) {
        try {
            await saveBookmarkedResource(user.uid, resourceToSave);
        } catch (error) {
            console.error("Failed to save resource to Firestore", error);
            toast({ title: "Sync Error", description: "Failed to save resource to the server. Your changes are saved locally.", variant: "destructive" });
        }
    }
  };

  const handleAddAiSuggestion = (suggestion: ResourceLink) => {
    const newBookmark: ResourceLink = {
        ...suggestion,
        id: `res-${Date.now()}-${Math.random()}`,
        isAiRecommended: false, // It's a user bookmark now
    };
    handleSaveResource(newBookmark);
    // Remove it from the suggestion list
    setAiSuggestedResources(prev => prev.filter(r => r.id !== suggestion.id));
  };
  
  const filteredResources = useMemo(() => {
    const all = [...bookmarkedResources, ...aiSuggestedResources];
    if (activeFilter === 'all') return all;
    return all.filter(r => r.category === activeFilter);
  }, [bookmarkedResources, aiSuggestedResources, activeFilter]);


  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex-1">
            <h1 className="font-headline text-3xl font-semibold text-primary">Learning Resources</h1>
            <p className="text-foreground/80 mt-1">
                Curate your learning materials and discover AI-powered suggestions.
            </p>
            </div>
            <div className="flex gap-2 flex-wrap">
            <Button onClick={() => handleOpenModal(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Bookmark
            </Button>
            <Button onClick={fetchAiSuggestions} disabled={isLoadingSuggestions} variant="outline">
                {isLoadingSuggestions ? (
                <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                <Bot className="mr-2 h-5 w-5" />
                )}
                Get AI Suggestions
            </Button>
            </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filter by:</span>
            <Button size="sm" variant={activeFilter === 'all' ? 'default' : 'secondary'} onClick={() => setActiveFilter('all')}>All</Button>
            {resourceCategories.map(cat => (
                <Button key={cat} size="sm" variant={activeFilter === cat ? 'default' : 'secondary'} onClick={() => setActiveFilter(cat)} className="capitalize">{cat}</Button>
            ))}
        </div>
      </div>


      {(filteredResources.length === 0 && !isLoadingSuggestions) && (
        <Card className="frosted-glass text-center p-8">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">
                {activeFilter === 'all' ? 'No Resources Yet' : `No ${activeFilter} resources`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/70 mb-4">
                {activeFilter === 'all' 
                    ? "Start by adding your own bookmarks or get suggestions from our AI."
                    : `You haven't added any resources in the "${activeFilter}" category.`}
            </p>
            <Lightbulb className="h-12 w-12 text-accent mx-auto" />
          </CardContent>
        </Card>
      )}

      {isLoadingSuggestions && filteredResources.length === 0 && (
         <div className="flex items-center justify-center p-8"><LoadingSpinner size="lg" /></div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="frosted-glass shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-lg text-primary flex items-center">
                  {resource.isAiRecommended ? 
                    <Bot className="mr-2 h-5 w-5 text-accent flex-shrink-0" /> : 
                    <LinkIcon className="mr-2 h-5 w-5 text-accent flex-shrink-0" />
                  }
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline line-clamp-2">
                    {resource.title}
                  </a>
                </CardTitle>
                {!resource.isAiRecommended && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModal(resource)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="frosted-glass">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this resource.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDeleteResource(resource.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge variant={resource.isAiRecommended ? "default" : "secondary"} className={cn("capitalize", resource.isAiRecommended ? "bg-primary/80 text-primary-foreground" : "")}>
                  {resource.isAiRecommended ? 'AI Suggestion' : 'Bookmarked'}
                </Badge>
                 <Badge variant="outline" className="capitalize">{resource.category}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {resource.description && <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>}
            </CardContent>
            <CardContent className="pt-0 flex flex-wrap gap-2">
               <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Visit Resource <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              {resource.isAiRecommended && (
                 <Button size="sm" onClick={() => handleAddAiSuggestion(resource)} className="flex-1 bg-accent hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4"/> Add to My List
                 </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <EditResourceModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        resourceToEdit={editingResource}
        onSave={handleSaveResource}
      />
    </div>
  );
}
