
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawGoogleTask, GoogleTaskList } from '@/types';
import { formatISO } from 'date-fns';

export async function getGoogleTaskLists(userId: string): Promise<GoogleTaskList[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch task lists.`);
    return [];
  }

  const tasksService = google.tasks({ version: 'v1', auth: client });

  try {
    const response = await tasksService.tasklists.list({
      maxResults: 100,
    });

    const lists = response.data.items;
    if (!lists) {
      return [];
    }

    return lists.map(list => ({
      id: list.id!,
      title: list.title!,
    })).filter(list => !!list.id && !!list.title);

  } catch (error: any) {
    if (error.code === 403 && error.errors?.[0]?.reason === 'accessNotConfigured') {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[your-project-id]';
        const errorMessage = `Google Tasks API has not been used in project ${projectId} or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=${projectId} and then retry.`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    console.error(`Error fetching Google Task Lists for user ${userId}:`, error);
    throw new Error('Failed to fetch Google Task Lists.');
  }
}

export async function getAllTasksFromList(userId: string, taskListId: string): Promise<RawGoogleTask[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) return [];

  const tasksService = google.tasks({ version: 'v1', auth: client });
  try {
    const response = await tasksService.tasks.list({
      tasklist: taskListId,
      showCompleted: true,
      maxResults: 100,
    });
    const tasks = response.data.items;
    if (!tasks) return [];
    
    return tasks.map((task): RawGoogleTask | null => {
        if (!task.id || !task.title || !task.status || !task.updated) {
            return null;
        }
        return {
          id: task.id,
          title: task.title,
          notes: task.notes || undefined,
          due: task.due ? formatISO(new Date(task.due)) : undefined,
          status: task.status as 'needsAction' | 'completed',
          link: task.selfLink || undefined,
          updated: task.updated,
        };
      }).filter((task): task is RawGoogleTask => task !== null);

  } catch (error) {
    console.error(`Error fetching tasks for list ${taskListId}:`, error);
    throw new Error(`Failed to fetch tasks for list ${taskListId}.`);
  }
}

export async function createGoogleTask(userId: string, tasklist: string, task: { title: string }) {
  const client = await getAuthenticatedClient(userId);
  if (!client) throw new Error("User is not authenticated with Google.");

  const tasksService = google.tasks({ version: 'v1', auth: client });
  const response = await tasksService.tasks.insert({
    tasklist,
    requestBody: { title: task.title },
  });
  return response.data;
}

export async function updateGoogleTask(
  userId: string,
  tasklist: string,
  taskId: string,
  taskData: { status?: 'needsAction' | 'completed'; title?: string }
) {
  const client = await getAuthenticatedClient(userId);
  if (!client) throw new Error("User is not authenticated with Google.");

  const tasksService = google.tasks({ version: 'v1', auth: client });

  // Fetch the existing task to merge properties
  const existingTaskResponse = await tasksService.tasks.get({ tasklist, task: taskId });
  if (!existingTaskResponse.data) {
      throw new Error("Task not found.");
  }
  
  const requestBody = { ...existingTaskResponse.data };

  if (taskData.status) {
    requestBody.status = taskData.status;
    if (taskData.status === 'completed') {
      requestBody.completed = new Date().toISOString();
    } else {
      requestBody.completed = null;
    }
  }
  
  if (taskData.title) {
    requestBody.title = taskData.title;
  }

  const response = await tasksService.tasks.update({
    tasklist,
    task: taskId,
    requestBody,
  });
  return response.data;
}

export async function deleteGoogleTask(userId: string, tasklist: string, taskId: string) {
  const client = await getAuthenticatedClient(userId);
  if (!client) throw new Error("User is not authenticated with Google.");

  const tasksService = google.tasks({ version: 'v1', auth: client });
  await tasksService.tasks.delete({
    tasklist,
    task: taskId,
  });
}

export async function createGoogleTaskList(userId: string, title: string) {
    const client = await getAuthenticatedClient(userId);
    if (!client) throw new Error("User is not authenticated with Google.");
    const tasksService = google.tasks({ version: 'v1', auth: client });
    const response = await tasksService.tasklists.insert({
        requestBody: { title },
    });
    return response.data as GoogleTaskList;
}

export async function deleteGoogleTaskList(userId: string, tasklistId: string) {
    const client = await getAuthenticatedClient(userId);
    if (!client) throw new Error("User is not authenticated with Google.");
    const tasksService = google.tasks({ version: 'v1', auth: client });
    await tasksService.tasklists.delete({
        tasklist: tasklistId,
    });
}

export async function getGoogleTasks(userId: string): Promise<RawGoogleTask[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch tasks.`);
    return [];
  }

  const tasksService = google.tasks({ version: 'v1', auth: client });

  try {
    const response = await tasksService.tasks.list({
      tasklist: '@default',
      showCompleted: false, 
      maxResults: 100, 
    });

    const tasks = response.data.items;
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.map((task): RawGoogleTask | null => {
        if (!task.id || !task.title || !task.status || !task.updated) {
            return null;
        }
        
        if (!task.due) {
            return null;
        }

        return {
          id: task.id,
          title: task.title,
          notes: task.notes || undefined,
          due: task.due ? formatISO(new Date(task.due)) : undefined,
          status: task.status as 'needsAction' | 'completed',
          link: task.selfLink || undefined,
          updated: task.updated,
        };
      }).filter((task): task is RawGoogleTask => task !== null);

  } catch (error: any) {
    if (error.code === 403 && error.errors?.[0]?.reason === 'accessNotConfigured') {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[your-project-id]';
        const errorMessage = `Google Tasks API has not been used in project ${projectId} or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=${projectId} and then retry.`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    console.error(`Error fetching Google Tasks for user ${userId}:`, error);
    throw new Error('Failed to fetch Google Tasks. Please try re-connecting your Google account in Settings.');
  }
}
