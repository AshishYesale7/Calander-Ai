'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Star, 
  Trash2, 
  Edit3, 
  MessageSquare,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatSession } from '@/types/ai-providers';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onToggleStar: (sessionId: string) => void;
}

export function ChatSidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onToggleStar
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const starredSessions = sessions.filter(s => s.isStarred);
  const regularSessions = sessions.filter(s => !s.isStarred);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <Button
        onClick={onNewChat}
        className="w-full mb-4"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>

      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {/* Starred Chats */}
          {starredSessions.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Starred
              </div>
              {starredSessions.map((session) => (
                <ChatItem
                  key={session.id}
                  session={session}
                  isActive={currentSession?.id === session.id}
                  isEditing={editingId === session.id}
                  editTitle={editTitle}
                  onSelect={() => onSelectSession(session)}
                  onStartEdit={() => startEditing(session)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditTitleChange={setEditTitle}
                  onKeyPress={handleKeyPress}
                  onDelete={() => onDeleteChat(session.id)}
                  onToggleStar={() => onToggleStar(session.id)}
                  formatDate={formatDate}
                />
              ))}
              <div className="my-2" />
            </>
          )}

          {/* Regular Chats */}
          {regularSessions.length > 0 && (
            <>
              {starredSessions.length > 0 && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent
                </div>
              )}
              {regularSessions.map((session) => (
                <ChatItem
                  key={session.id}
                  session={session}
                  isActive={currentSession?.id === session.id}
                  isEditing={editingId === session.id}
                  editTitle={editTitle}
                  onSelect={() => onSelectSession(session)}
                  onStartEdit={() => startEditing(session)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditTitleChange={setEditTitle}
                  onKeyPress={handleKeyPress}
                  onDelete={() => onDeleteChat(session.id)}
                  onToggleStar={() => onToggleStar(session.id)}
                  formatDate={formatDate}
                />
              ))}
            </>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ChatItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  onToggleStar: () => void;
  formatDate: (timestamp: number) => string;
}

function ChatItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onKeyPress,
  onDelete,
  onToggleStar,
  formatDate
}: ChatItemProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        isActive && "bg-muted"
      )}
      onClick={!isEditing ? onSelect : undefined}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={onKeyPress}
              className="h-6 text-sm"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onSaveEdit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <div className="font-medium text-sm truncate">
              {session.title}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{formatDate(session.updatedAt)}</span>
              {session.messages.length > 0 && (
                <span>• {session.messages.length} messages</span>
              )}
            </div>
          </>
        )}
      </div>

      {session.isStarred && !isEditing && (
        <Star className="h-3 w-3 text-yellow-500 fill-current shrink-0" />
      )}

      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onStartEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleStar}>
              <Star className={cn(
                "h-4 w-4 mr-2",
                session.isStarred && "text-yellow-500 fill-current"
              )} />
              {session.isStarred ? 'Unstar' : 'Star'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}