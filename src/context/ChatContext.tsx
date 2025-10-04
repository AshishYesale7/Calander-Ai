
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';
import type { PublicUserProfile } from '@/services/userService';

interface ChatContextType {
  chattingWith: PublicUserProfile | null;
  setChattingWith: Dispatch<SetStateAction<PublicUserProfile | null>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);

  return (
    <ChatContext.Provider value={{ chattingWith, setChattingWith }}>
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
