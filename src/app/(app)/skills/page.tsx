
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Skill } from '@/types';
import { mockSkills } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, BookOpen, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import EditSkillModal from '@/components/skills/EditSkillModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getSkills, saveSkill, deleteSkill } from '@/services/skillsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const proficiencyColors: Record<Skill['proficiency'], string> = {
  Beginner: 'bg-blue-500/80 border-blue-700 text-white',
  Intermediate: 'bg-yellow-500/80 border-yellow-700 text-yellow-900',
  Advanced: 'bg-green-500/80 border-green-700 text-white',
  Expert: 'bg-purple-500/80 border-purple-700 text-white',
};

const SKILLS_STORAGE_KEY = 'futureSightSkills';

const syncToLocalStorage = (data: Skill[]) => {
  if (typeof window === 'undefined') return;
  try {
    const serializableSkills = data.map(s => ({...s, lastUpdated: s.lastUpdated.toISOString() }));
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(serializableSkills));
  } catch (error) {
    console.error("Failed to save skills to local storage", error);
  }
};

const loadFromLocalStorage = (): Skill[] => {
  if (typeof window === 'undefined') return mockSkills;
  try {
    const storedSkills = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (storedSkills) {
      const parsedSkills: (Omit<Skill, 'lastUpdated'> & { lastUpdated?: string })[] = JSON.parse(storedSkills);
      return parsedSkills.map(s => ({...s, lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : new Date() }));
    }
  } catch (error) {
    console.error("Failed to load skills from local storage", error);
  }
  return mockSkills;
};

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>(loadFromLocalStorage);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Background sync with Firestore
  useEffect(() => {
    const syncWithFirestore = async () => {
      if (user) {
        try {
          const firestoreSkills = await getSkills(user.uid);
          setSkills(firestoreSkills);
          syncToLocalStorage(firestoreSkills);
        } catch (error: any) {
          if (error.message.includes('Failed to fetch')) {
            console.warn("Could not sync skills, likely offline.");
            toast({ title: "Offline Mode" });
          } else {
            console.error("Failed to fetch skills from Firestore, using local data.", error);
            toast({ title: "Sync Error", description: "Could not sync skills.", variant: "destructive"});
          }
        }
      }
    };
    syncWithFirestore();
  }, [user, toast]);

  const handleOpenModal = (skill: Skill | null) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };
  
  // Effect to handle actions from command palette
  useEffect(() => {
    if (searchParams.get('action') === 'newSkill') {
      handleOpenModal(null);
      router.replace('/skills', { scroll: false });
    }
  }, [searchParams, router]);

  const handleDeleteSkill = async (skillId: string) => {
    const originalSkills = skills;
    const newSkills = skills.filter(skill => skill.id !== skillId);
    setSkills(newSkills); // Optimistic update

    toast({ title: "Skill Deleted", description: "The skill has been successfully removed." });
    syncToLocalStorage(newSkills);

    if (user) {
      try {
        await deleteSkill(user.uid, skillId);
      } catch (error) {
        console.error("Failed to delete skill from Firestore", error);
        // DO NOT REVERT.
        toast({ title: "Sync Error", description: "Failed to delete skill from the server. It is removed locally.", variant: "destructive" });
      }
    }
  };

  const handleSaveSkill = async (skillToSave: Skill) => {
    const now = new Date();
    const skillWithDate = { ...skillToSave, lastUpdated: now };
    
    const originalSkills = skills;
    const skillExists = skills.some(s => s.id === skillWithDate.id);
    let newSkills: Skill[];
    
    if (skillExists) {
      newSkills = skills.map(s => s.id === skillWithDate.id ? skillWithDate : s);
      toast({ title: "Skill Updated", description: "Your skill has been successfully updated." });
    } else {
      newSkills = [...skills, skillWithDate];
      toast({ title: "Skill Added", description: "A new skill has been successfully added." });
    }

    setSkills(newSkills);
    setIsModalOpen(false);
    setEditingSkill(null);
    syncToLocalStorage(newSkills);
    
    if (user) {
      try {
        const payload = {
          ...skillWithDate,
          lastUpdated: skillWithDate.lastUpdated.toISOString(),
        };
        await saveSkill(user.uid, payload);
      } catch (error) {
        console.error("Failed to save skill to Firestore", error);
        // DO NOT REVERT.
        toast({ title: "Sync Error", description: "Failed to save skill to the server. Your changes are saved locally.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Skills Tracker</h1>
        <Button onClick={() => handleOpenModal(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Skill
        </Button>
      </div>
      <p className="text-foreground/80">
        Monitor your learning progress across various technical domains.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <Card key={skill.id} className="frosted-glass shadow-lg">
            <CardHeader>
               <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-accent" /> {skill.name}
                </CardTitle>
                 <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(skill)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this skill.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Last updated: {formatDistanceToNow(skill.lastUpdated, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/80">Category:</span>
                <Badge variant="secondary">{skill.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/80">Proficiency:</span>
                <Badge className={proficiencyColors[skill.proficiency]}>{skill.proficiency}</Badge>
              </div>
              {skill.learningResources && skill.learningResources.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-1">Learning Resources:</h4>
                  <ul className="space-y-1">
                    {skill.learningResources.map(resource => (
                      <li key={resource.url} className="text-xs">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center">
                          <BookOpen className="mr-1 h-3 w-3" /> {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
       <EditSkillModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        skillToEdit={editingSkill}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
