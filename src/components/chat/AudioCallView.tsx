
'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile, CallData } from '@/types';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AudioCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export default function AudioCallView({ call, otherUser, onEndCall, localStream, remoteStream }: AudioCallViewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  // Effect for the call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        
        const barWidth = (canvas.width / bufferLength) * 2;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          
          const green = Math.min(255, barHeight + 100);
          const blue = Math.min(255, barHeight + 25);
          
          canvasCtx.fillStyle = `rgba(${barHeight > 1 ? 50 : 0}, ${green}, ${blue}, 0.6)`;
          canvasCtx.shadowBlur = 5;
          canvasCtx.shadowColor = `rgba(50, ${green}, ${blue}, 0.3)`;

          canvasCtx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);
          
          x += barWidth + 1;
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

  // Effect to connect stream to the audio element for playback
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const toggleMute = () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-5 right-5 z-[200] p-6 rounded-2xl shadow-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-700 text-white w-80"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 border-4 border-green-500 shadow-lg">
          <AvatarImage src={otherUser.photoURL || ''} alt={otherUser.displayName} />
          <AvatarFallback className="text-3xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-bold text-2xl mt-4">{otherUser.displayName}</p>
        <p className={cn(
          "text-sm text-green-400 transition-opacity duration-500",
          callDuration > 0 ? 'opacity-100' : 'opacity-0'
        )}>
          {formatDuration(callDuration)}
        </p>

        {/* Canvas for Waveform */}
        <div className="w-full h-16 mt-4">
          <canvas ref={canvasRef} width="300" height="60" className="w-full h-full"></canvas>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-6">
        <Button onClick={toggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onEndCall}>
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
       {/* Audio element to play the remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </motion.div>
  );
}
