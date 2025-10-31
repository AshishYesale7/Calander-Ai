
'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import type { CallData } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';


interface IncomingAudioCallProps {
  call: CallData;
  onAccept: () => void;
  onDecline: () => void;
  isActive?: boolean;
}

export default function IncomingAudioCall({ call, onAccept, onDecline, isActive = false }: IncomingAudioCallProps) {
    const { connectionStatus, isMuted, onToggleMute, remoteStream } = useChat();
    const [callDuration, setCallDuration] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();
    
    // Timer effect for active call
    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (isActive && connectionStatus === 'connected') {
            setCallDuration(0); // Reset on new call
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isActive, connectionStatus]);

    // Visualization effect for active call
    useEffect(() => {
        if (isActive && remoteStream && remoteStream.getAudioTracks().length > 0 && canvasRef.current) {
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
            const radius = canvas.width / 2 - 40; // Adjust radius
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
      }, [isActive, remoteStream]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed top-5 left-5 z-[200] p-4 rounded-xl shadow-2xl frosted-glass bg-gray-900/80 border border-gray-700/50 text-white cursor-grab active:cursor-grabbing",
        isActive ? "w-80" : "w-72" // Different widths for different states
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
            {isActive && <canvas ref={canvasRef} width="150" height="150" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></canvas>}
            <Avatar className={cn("border-4 shadow-lg relative z-10", isActive ? "h-24 w-24 border-green-500" : "h-14 w-14 border-white/20")}>
              <AvatarImage src={call.callerPhotoURL || undefined} alt={call.callerName} />
              <AvatarFallback className={cn(isActive ? "text-3xl" : "text-xl")}>
                {call.callerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
        </div>
        
        <p className={cn("font-semibold truncate", isActive ? "text-2xl mt-4" : "text-lg mt-2")}>{call.callerName}</p>
        
        {!isActive ? (
            <p className="text-xs text-gray-300">Incoming audio call...</p>
        ) : (
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
        )}
      </div>

      <div className={cn("flex justify-center mt-4", isActive ? "gap-4" : "justify-around")}>
        {!isActive ? (
          <>
            <div className="flex flex-col items-center gap-1">
              <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={onDecline}>
                <PhoneOff className="h-5 w-5" />
              </Button>
              <span className="text-xs text-white/70">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button variant="default" size="icon" className="rounded-full h-12 w-12 bg-green-600 hover:bg-green-700" onClick={onAccept}>
                <Phone className="h-5 w-5" />
              </Button>
              <span className="text-xs text-white/70">Accept</span>
            </div>
          </>
        ) : (
          <>
            <Button onClick={onToggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onDecline}>
              <PhoneOff className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
