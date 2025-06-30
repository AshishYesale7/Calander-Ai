
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { GoogleTaskList, RawGoogleTask } from '@/types';
import { 
  getGoogleTaskLists, 
  getAllTasksFromList, 
  createGoogleTask, 
  updateGoogleTask, 
  deleteGoogleTask,
  createGoogleTaskList,
  deleteGoogleTaskList
} from '@/services/googleTasksService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Plus, Trash2, Mail } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TasksByList {
  [key: string]: RawGoogleTask[];
}

const TaskItem = ({ task, onStatusChange, onDelete }: { task: RawGoogleTask; onStatusChange: () => void; onDelete: () => void; }) => {
  return (
    <div className="flex items-start gap-3 py-2 group">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.status === 'completed'}
        onCheckedChange={onStatusChange}
        className="mt-1"
      />
      <div className="flex-1 space-y-1">
        <label htmlFor={`task-${task.id}`} className="text-sm text-foreground/90">
          {task.title}
        </label>
        {task.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.notes}</p>
        )}
        <Badge variant="outline" className="text-xs">
          {formatDistanceToNow(new Date(task.updated), { addSuffix: true })}
        </Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<TasksByList>({});
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [newTaskTitles, setNewTaskTitles] = useState<{ [listId: string]: string }>({});
  const [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const fetchAllData = useCallback(async () => {
    if (!user || !isGoogleConnected) {
      if (isGoogleConnected === false) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const lists = await getGoogleTaskLists(user.uid);
      setTaskLists(lists);
      
      const tasksPromises = lists.map(list => getAllTasksFromList(user.uid, list.id));
      const tasksResults = await Promise.all(tasksPromises);
      
      const tasksByListId: TasksByList = {};
      lists.forEach((list, index) => {
        tasksByListId[list.id] = tasksResults[index];
      });
      setTasks(tasksByListId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, isGoogleConnected, toast]);

  useEffect(() => {
    if (user) {
      setIsGoogleConnected(null);
      fetch('/api/auth/google/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      .then(res => res.json())
      .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchAllData();
    } else if (isGoogleConnected === false) {
      setIsLoading(false);
    }
  }, [isGoogleConnected, fetchAllData]);

  const handleToggleStatus = async (listId: string, taskId: string) => {
    const originalTasks = { ...tasks };
    const taskToUpdate = tasks[listId]?.find(t => t.id === taskId);
    if (!taskToUpdate || !user) return;

    const newStatus = taskToUpdate.status === 'completed' ? 'needsAction' : 'completed';

    // Optimistic UI update
    setTasks(prev => ({
      ...prev,
      [listId]: prev[listId].map(t => t.id === taskId ? { ...t, status: newStatus, updated: new Date().toISOString() } : t),
    }));

    try {
      await updateGoogleTask(user.uid, listId, taskId, { status: newStatus });
    } catch (error) {
      setTasks(originalTasks);
      toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
    }
  };

  const handleAddTask = async (listId: string) => {
    const title = newTaskTitles[listId]?.trim();
    if (!title || !user) return;

    const tempId = `temp-${Date.now()}`;
    const newTask: RawGoogleTask = {
      id: tempId,
      title,
      status: 'needsAction',
      updated: new Date().toISOString(),
    };

    // Optimistic update
    setTasks(prev => ({
      ...prev,
      [listId]: [newTask, ...(prev[listId] || [])],
    }));
    setNewTaskTitles(prev => ({...prev, [listId]: ''}));

    try {
      const createdTask = await createGoogleTask(user.uid, listId, { title });
      // Replace temporary task with real one from API
      setTasks(prev => ({
        ...prev,
        [listId]: prev[listId].map(t => t.id === tempId ? createdTask as RawGoogleTask : t),
      }));
    } catch (error) {
      // Revert optimistic update on failure
      setTasks(prev => ({
        ...prev,
        [listId]: prev[listId].filter(t => t.id !== tempId),
      }));
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };
  
  const handleDeleteTask = async (listId: string, taskId: string) => {
    if (!user) return;
    const originalTasks = { ...tasks };

    // Optimistic delete
    setTasks(prev => ({
      ...prev,
      [listId]: prev[listId].filter(t => t.id !== taskId),
    }));

    try {
      await deleteGoogleTask(user.uid, listId, taskId);
      toast({ title: "Task Deleted" });
    } catch (error) {
      setTasks(originalTasks);
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  const handleCreateList = async () => {
    const title = newListTitle.trim();
    if (!title || !user) return;

    setIsNewListDialogOpen(false);
    const tempId = `temp-list-${Date.now()}`;
    const newList: GoogleTaskList = { id: tempId, title };

    // Optimistic UI update
    setTaskLists(prev => [...prev, newList]);
    setTasks(prev => ({ ...prev, [tempId]: [] }));

    try {
        const createdList = await createGoogleTaskList(user.uid, title);
        // Update state with real ID
        setTaskLists(prev => prev.map(l => l.id === tempId ? createdList : l));
        setTasks(prev => {
            const newTasks = { ...prev };
            newTasks[createdList.id] = newTasks[tempId];
            delete newTasks[tempId];
            return newTasks;
        });
        toast({ title: "List Created", description: `'${title}' has been added.` });
    } catch (error) {
        // Revert on failure
        setTaskLists(prev => prev.filter(l => l.id !== tempId));
        setTasks(prev => {
            const newTasks = { ...prev };
            delete newTasks[tempId];
            return newTasks;
        });
        toast({ title: "Error", description: "Failed to create list.", variant: "destructive" });
    } finally {
      setNewListTitle('');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    
    const originalTaskLists = [...taskLists];
    const originalTasks = {...tasks};

    // Optimistic UI update
    setTaskLists(prev => prev.filter(l => l.id !== listId));
    setTasks(prev => {
      const newTasks = {...prev};
      delete newTasks[listId];
      return newTasks;
    });

    try {
      await deleteGoogleTaskList(user.uid, listId);
      toast({ title: "List Deleted" });
    } catch (error) {
      setTaskLists(originalTaskLists);
      setTasks(originalTasks);
      toast({ title: "Error", description: "Failed to delete list.", variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isGoogleConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Connect to Google</h2>
        <p className="text-muted-foreground mt-2">Connect your Google account in Settings to see your tasks.</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full">
          <div className="flex justify-between items-center mb-6">
              <h1 className="font-headline text-3xl font-semibold text-primary">Tasks</h1>
              <Button onClick={() => setIsNewListDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New List
              </Button>
          </div>

          <ScrollArea className="h-[calc(100%-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {taskLists.map(list => {
                  const pendingTasks = tasks[list.id]?.filter(t => t.status !== 'completed') || [];
                  const completedTasks = tasks[list.id]?.filter(t => t.status === 'completed') || [];
                  
                  return (
                  <Card key={list.id} className="frosted-glass flex flex-col max-h-[70vh]">
                      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                      <CardTitle className="font-semibold text-base text-primary">{list.title}</CardTitle>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4"/>Delete list
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="frosted-glass">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{list.title}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the list and all its tasks. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteList(list.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </CardHeader>
                      <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
                        <form onSubmit={(e) => { e.preventDefault(); handleAddTask(list.id); }}>
                          <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                              <Input 
                                  placeholder="Add a task" 
                                  value={newTaskTitles[list.id] || ''}
                                  onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [list.id]: e.target.value }))}
                                  className="h-auto flex-1 border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                          </div>
                        </form>
                        <ScrollArea className="flex-1 mt-2">
                            <div className="pr-3">
                                {pendingTasks.map(task => (
                                  <TaskItem 
                                    key={task.id} 
                                    task={task} 
                                    onStatusChange={() => handleToggleStatus(list.id, task.id)}
                                    onDelete={() => handleDeleteTask(list.id, task.id)}
                                  />
                                ))}
                            </div>
                        </ScrollArea>
                          {completedTasks.length > 0 && (
                              <Accordion type="single" collapsible className="w-full mt-2">
                              <AccordionItem value="completed" className="border-t">
                                  <AccordionTrigger className="text-sm text-muted-foreground py-2 hover:no-underline">
                                      Completed ({completedTasks.length})
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-0">
                                      <ScrollArea className="max-h-48">
                                        <div className="pr-3">
                                          {completedTasks.map(task => (
                                            <TaskItem 
                                              key={task.id} 
                                              task={task} 
                                              onStatusChange={() => handleToggleStatus(list.id, task.id)}
                                              onDelete={() => handleDeleteTask(list.id, task.id)}
                                            />
                                          ))}
                                        </div>
                                      </ScrollArea>
                                  </AccordionContent>
                              </AccordionItem>
                              </Accordion>
                          )}
                      </CardContent>
                  </Card>
                  );
              })}
              </div>
          </ScrollArea>
      </div>

      <AlertDialog open={isNewListDialogOpen} onOpenChange={setIsNewListDialogOpen}>
        <AlertDialogContent className="frosted-glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Task List</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a title for your new Google Tasks list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="list-title" className="sr-only">List Title</Label>
            <Input 
              id="list-title" 
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="e.g., Learning Goals"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateList} disabled={!newListTitle.trim()}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
