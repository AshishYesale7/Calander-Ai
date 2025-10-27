
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomVideoPlayerProps {
  src: string;
  title?: string;
  description?: string;
}

export default function CustomVideoPlayer({ src, title, description }: CustomVideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = true;
    }
  }, []);
  
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error("Play error:", e));
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
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
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

  const handleFullscreen = () => {
    if (!playerRef.current) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        playerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
  };

  return (
    <div 
        ref={playerRef}
        className="custom-video-player-container"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        className="video-element"
        onTimeUpdate={handleProgress}
        onClick={handlePlayPause}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className={cn("preview-overlay", isPlaying && "hidden")}>
        <button onClick={handlePlayPause} className="play-button-center">
            <Play size={32} />
        </button>
      </div>

      <div className="title-overlay">
        {description && <p className="title-description">{description}</p>}
        {title && <h2 className="title-main">{title}</h2>}
      </div>

      <div className={cn("controls-overlay", showControls && "active")}>
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
            <button onClick={handleFullscreen}><Maximize size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
