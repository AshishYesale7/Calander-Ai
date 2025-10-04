
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';
import type { PublicUserProfile } from '@/services/userService';

interface ChatContextType {
  chattingWith: PublicUserProfile | null;
  setChattingWith: Dispatch<SetStateAction<PublicUserProfile | null>>;
  isChatSidebarOpen: boolean;
  setIsChatSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  return (
    <ChatContext.Provider value={{ chattingWith, setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
