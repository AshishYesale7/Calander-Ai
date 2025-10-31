
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  history: ChatMessage[];
}

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string; // 'root' for top-level
  userId: string;
  modifiedAt: Date;
  size?: number; // in bytes
}

export interface EventData {
  id: string;
  userId: string;
  title: string;
  start: Date;
  end?: Date;
  isAllDay: boolean;
  notes?: string;
}
