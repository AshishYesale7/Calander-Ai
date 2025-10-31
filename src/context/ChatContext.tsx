
'use client';

import type { ReactNode, Dispatch, SetStateAction, RefObject } from 'react';
import { createContext, useContext } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { CallData, CallType } from '@/types';


interface ChatContextType {
  chattingWith: PublicUserProfile | null;
  setChattingWith: Dispatch<SetStateAction<PublicUserProfile | null>>;
  isChatSidebarOpen: boolean;
  setIsChatSidebarOpen: Dispatch<SetStateAction<boolean>>;
  isChatInputFocused: boolean;
  setIsChatInputFocused: Dispatch<SetStateAction<boolean>>;
  
  // Video Call State
  outgoingCall: PublicUserProfile | null;
  setOutgoingCall: Dispatch<SetStateAction<PublicUserProfile | null>>;
  ongoingCall: CallData | null;
  setOngoingCall: Dispatch<SetStateAction<CallData | null>>;
  incomingCall: CallData | null;
  setIncomingCall: Dispatch<SetStateAction<CallData | null>>;

  // Audio Call State
  outgoingAudioCall: PublicUserProfile | null;
  setOutgoingAudioCall: Dispatch<SetStateAction<PublicUserProfile | null>>;
  ongoingAudioCall: CallData | null;
  setOngoingAudioCall: Dispatch<SetStateAction<CallData | null>>;
  incomingAudioCall: CallData | null;
  setIncomingAudioCall: Dispatch<SetStateAction<CallData | null>>;

  // Call Actions
  onInitiateCall: (receiver: PublicUserProfile, callType: CallType) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: (callId?: string) => void;
  
  // WebRTC related state
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isPipMode: boolean;
  onTogglePipMode: () => void;
  pipControls: any; // AnimationControls from framer-motion
  isResetting: boolean;
  pipSize: { width: number; height: number };
  setPipSize: Dispatch<SetStateAction<{ width: number; height: number }>>;
  pipSizeMode: 'medium' | 'large';
  onTogglePipSizeMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  otherUserInCall: PublicUserProfile | null;
  connectionStatus: RTCPeerConnectionState;
  peerConnectionRef: RefObject<RTCPeerConnection>; // Expose the ref

  // New function for message sound
  playSendMessageSound: () => void;

  // New property for chat sidebar width
  chatSidebarWidth: number;
  
  // New state for permission requests
  permissionRequest: { callType: CallType; onGrant: () => void; onDeny: () => void; } | null;
  setPermissionRequest: Dispatch<SetStateAction<{ callType: CallType; onGrant: () => void; onDeny: () => void; } | null>>;

  // Add activeCallId for context
  activeCallId: string | null;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// This is now a simple provider wrapper and does not manage state itself.
export const ChatProvider = ({ children, value }: { children: ReactNode, value: ChatContextType }) => {
  return (
    <ChatContext.Provider value={value}>
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
