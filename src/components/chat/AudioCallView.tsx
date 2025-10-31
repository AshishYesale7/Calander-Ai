
'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile, CallData } from '@/types';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useChat } from '@/context/ChatContext';

interface AudioCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  connectionStatus: RTCPeerConnectionState;
}

export default function AudioCallView({ call, otherUser, onEndCall, connectionStatus }: AudioCallViewProps) {
  const { onToggleMute, remoteStream, isMuted } = useChat();
  const [callDuration, setCallDuration] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  // Effect for the call duration timer
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [connectionStatus]);

  // Effect for Web Audio API and canvas visualization
  useEffect(() => {
    if (remoteStream && remoteStream.getAudioTracks().length > 0 && canvasRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(remoteStream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const draw = () => {
        animationFrameId.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 40; 
        const bars = 100;

        for (let i = 0; i < bars; i++) {
          const barHeight = dataArray[i] * 0.35;
          const angle = (i / bars) * 2 * Math.PI;

          const startX = centerX + radius * Math.cos(angle);
          const startY = centerY + radius * Math.sin(angle);
          const endX = centerX + (radius + barHeight) * Math.cos(angle);
          const endY = centerY + (radius + barHeight) * Math.sin(angle);

          canvasCtx.beginPath();
          canvasCtx.moveTo(startX, startY);
          canvasCtx.lineTo(endX, endY);
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = `rgba(50, 205, 255, ${barHeight / 255})`; 
          canvasCtx.stroke();
        }
      };
      draw();
      
      return () => {
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        source.disconnect();
        analyser.disconnect();
        audioContext.close().catch(e => console.warn("Error closing audio context", e));
      };
    }
  }, [remoteStream]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      className="p-6 rounded-2xl shadow-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-700 text-white w-80"
    >
      <div className="flex flex-col items-center text-center relative">
        <canvas ref={canvasRef} width="150" height="150" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></canvas>
        
        <Avatar className="h-24 w-24 border-4 border-green-500 shadow-lg relative z-10">
          <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
          <AvatarFallback className="text-3xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
        </Avatar>

        <p className="font-bold text-2xl mt-4">{otherUser.displayName}</p>
        
        <div className="h-5 mt-1">
            {connectionStatus === 'disconnected' ? (
                <div className="text-xs text-yellow-400 flex items-center gap-1.5 animate-pulse">
                    <LoadingSpinner size="sm" className="text-yellow-400"/>
                    Reconnecting...
                </div>
            ) : (
                <p className={cn(
                  "text-sm text-green-400 transition-opacity duration-500 font-mono",
                  callDuration > 0 ? 'opacity-100' : 'opacity-0'
                )}>
                  {formatDuration(callDuration)}
                </p>
            )}
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-6">
        <Button onClick={onToggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onEndCall}>
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
