'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomVideoPlayerProps {
  src: string;
}

export default function CustomVideoPlayer({ src }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = true; // Ensure video is muted on mount for autoplay
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);
  
  const handleRewind = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.currentTime -= 10;
    }
  }, []);

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      setProgress((currentTime / duration) * 100);
    }
  }, []);
  
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if(videoRef.current) {
        const timeline = e.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newTime = (offsetX / rect.width) * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div 
        className="custom-video-player-container"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className="video-element"
        onTimeUpdate={handleProgress}
        onClick={handlePlayPause}
      />
      <div className={cn("controls-overlay", showControls ? 'active' : '')}>
        <div className="timeline-container" onClick={handleScrub}>
            <div className="timeline-progress" style={{ width: `${progress}%` }}></div>
            <div className="timeline-knob" style={{ left: `${progress}%` }}></div>
        </div>
        <div className="controls-main">
          <div className="controls-left">
            <button onClick={handlePlayPause}>{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
            <button onClick={handleRewind}><Rewind size={20}/></button>
            <button onClick={handleMuteToggle}>{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
          </div>
          <div className="controls-right">
            <button><Settings size={20}/></button>
            <button><Maximize size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
