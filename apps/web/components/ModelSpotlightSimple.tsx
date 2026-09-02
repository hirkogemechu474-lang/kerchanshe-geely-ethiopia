'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { withBasePath } from '@/lib/publicPath';

interface ModelSpotlightSimpleProps {
  modelName: string;
  views: {
    angle: string;
    image: string;
    label: string;
  }[];
  className?: string;
}

export function ModelSpotlightSimple({
  modelName,
  views,
  className = ''
}: ModelSpotlightSimpleProps) {
  const [currentView, setCurrentView] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  React.useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % views.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, views.length]);

  const nextView = () => {
    setCurrentView((prev) => (prev + 1) % views.length);
  };

  const prevView = () => {
    setCurrentView((prev) => (prev - 1 + views.length) % views.length);
  };

  return (
    <div ref={containerRef} className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Main Image */}
      <div className="relative aspect-[16/9]">
        <img
          src={withBasePath(views[currentView].image)}
          alt={`${modelName} - ${views[currentView].label}`}
          className="w-full h-full object-contain"
          loading="eager"
        />

        {/* Navigation Arrows */}
        <button
          onClick={prevView}
          aria-label="Previous view"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextView}
          aria-label="Next view"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all"
        >
          <ChevronRight size={24} />
        </button>

        {/* View Label */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
            <div className="text-xs text-blue-200 mb-1">360° Showcase</div>
            <div className="font-bold">{modelName}</div>
            <div className="text-sm text-blue-100 mt-1">{views[currentView].label}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`p-3 rounded-lg backdrop-blur-sm transition-all ${
              isAutoPlaying 
                ? 'bg-gold text-navy dark:text-ice' 
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            title={isAutoPlaying ? 'Pause' : 'Auto-Play'}
          >
            {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {views.map((view, index) => (
            <button
              key={index}
              onClick={() => setCurrentView(index)}
              className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentView === index
                  ? 'border-gold scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={withBasePath(view.image)}
                alt={view.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <span className="text-white text-xs font-semibold p-2 w-full text-center">
                  {view.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2">
        {views.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentView(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentView === index
                ? 'bg-gold w-8'
                : 'bg-white dark:bg-midnight-surface/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
