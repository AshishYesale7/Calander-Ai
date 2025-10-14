
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
    if (remoteStream && canvasRef.current) {
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
        analyser.getByteTimeDomainData(dataArray);
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#6ee7b7'; // A pleasant teal color
        canvasCtx.shadowBlur = 5;
        canvasCtx.shadowColor = '#6ee7b7';

        canvasCtx.beginPath();
        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // value between 0 and 2
          const y = v * canvas.height / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };
      draw();
      
      return () => {
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
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
