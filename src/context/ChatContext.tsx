
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { CallData, CallType } from '@/types';


interface ChatContextType {
  chattingWith: PublicUserProfile | null;
  setChattingWith: Dispatch<SetStateAction<PublicUserProfile | null>>;
  isChatSidebarOpen: boolean;
  setIsChatSidebarOpen: Dispatch<SetStateAction<boolean>>;
  outgoingCall: PublicUserProfile | null;
  setOutgoingCall: Dispatch<SetStateAction<PublicUserProfile | null>>;
  ongoingCall: CallData | null;
  setOngoingCall: Dispatch<SetStateAction<CallData | null>>;
  isChatInputFocused: boolean;
  setIsChatInputFocused: Dispatch<SetStateAction<boolean>>;
  // Add state for audio calls
  outgoingAudioCall: PublicUserProfile | null;
  setOutgoingAudioCall: Dispatch<SetStateAction<PublicUserProfile | null>>;
  ongoingAudioCall: CallData | null;
  setOngoingAudioCall: Dispatch<SetStateAction<CallData | null>>;
  onInitiateCall: (receiver: PublicUserProfile, callType: CallType) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children, value }: { children: ReactNode, value: Omit<ChatContextType, 'chattingWith' | 'isChatSidebarOpen' | 'isChatInputFocused'> & {
    setChattingWith: Dispatch<SetStateAction<PublicUserProfile | null>>;
    setIsChatSidebarOpen: Dispatch<SetStateAction<boolean>>;
    setIsChatInputFocused: Dispatch<SetStateAction<boolean>>;
} }) => {
  const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  return (
    <ChatContext.Provider value={{ 
        ...value,
        chattingWith, setChattingWith, 
        isChatSidebarOpen, setIsChatSidebarOpen,
        isChatInputFocused, setIsChatInputFocused,
    }}>
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
