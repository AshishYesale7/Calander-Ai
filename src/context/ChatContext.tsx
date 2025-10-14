
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { CallData } from '@/types';


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
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState<PublicUserProfile | null>(null);
  const [ongoingCall, setOngoingCall] = useState<CallData | null>(null);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  // Define state for audio calls
  const [outgoingAudioCall, setOutgoingAudioCall] = useState<PublicUserProfile | null>(null);
  const [ongoingAudioCall, setOngoingAudioCall] = useState<CallData | null>(null);


  return (
    <ChatContext.Provider value={{ 
        chattingWith, setChattingWith, 
        isChatSidebarOpen, setIsChatSidebarOpen,
        outgoingCall, setOutgoingCall,
        ongoingCall, setOngoingCall,
        isChatInputFocused, setIsChatInputFocused,
        // Provide audio call state
        outgoingAudioCall, setOutgoingAudioCall,
        ongoingAudioCall, setOngoingAudioCall,
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
