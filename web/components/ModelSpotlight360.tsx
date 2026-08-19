'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RotateCw, Maximize2, Minimize2, Info } from 'lucide-react';

interface ModelSpotlight360Props {
  modelName: string;
  images?: string[];
  totalFrames?: number;
  imageBasePath?: string;
  imageFormat?: string;
  autoRotate?: boolean;
  className?: string;
}

export function ModelSpotlight360({
  modelName,
  images,
  totalFrames = 36,
  imageBasePath = '/images/360',
  imageFormat = 'jpg',
  autoRotate = false,
  className = ''
}: ModelSpotlight360Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startXRef = useRef(0);
  const lastFrameRef = useRef(0);
  const autoRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate image URLs
  const imageUrls = useMemo(
    () => images ?? Array.from({ length: totalFrames }, (_, i) =>
      `${imageBasePath}/${modelName}/${String(i + 1).padStart(3, '0')}.${imageFormat}`
    ),
    [images, totalFrames, imageBasePath, modelName, imageFormat]
  );

  // Preload all images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const imagePromises = imageUrls.map((url, index) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            // Fallback to placeholder if image fails
            const fallbackImg = new Image();
            fallbackImg.src = `https://placehold.co/1200x800/0B2545/FFFFFF?text=${modelName}+Frame+${index + 1}`;
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = reject;
          };
          img.src = url;
        });
      });

      try {
        const images = await Promise.all(imagePromises);
        setLoadedImages(images);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading 360° images:', error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, [imageUrls, modelName]);

  // Draw current frame on canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || loadedImages.length === 0) return;

    const img = loadedImages[frameIndex];
    if (!img) return;

    // Set canvas size to match image aspect ratio
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio = img.height / img.width;
    
    canvas.width = containerWidth;
    canvas.height = containerWidth * aspectRatio;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, [loadedImages]);

  // Update canvas when frame changes
  useEffect(() => {
    if (!isLoading && loadedImages.length > 0) {
      drawFrame(currentFrame);
    }
  }, [currentFrame, isLoading, loadedImages, drawFrame]);

  // Auto-rotate functionality
  useEffect(() => {
    if (isAutoRotating && !isDragging) {
      autoRotateIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % totalFrames);
      }, 100); // Rotate every 100ms
    } else {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
        autoRotateIntervalRef.current = null;
      }
    }

    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [isAutoRotating, isDragging, totalFrames]);

  // Hide instructions after first interaction
  useEffect(() => {
    if (isDragging || currentFrame !== 0) {
      const timer = setTimeout(() => setShowInstructions(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isDragging, currentFrame]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.clientX;
    lastFrameRef.current = currentFrame;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    const sensitivity = 5; // pixels per frame
    const frameDelta = Math.floor(deltaX / sensitivity);
    
    let newFrame = (lastFrameRef.current + frameDelta) % totalFrames;
    if (newFrame < 0) newFrame += totalFrames;
    
    setCurrentFrame(newFrame);
  }, [isDragging, totalFrames]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.touches[0].clientX;
    lastFrameRef.current = currentFrame;
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startXRef.current;
    const sensitivity = 5;
    const frameDelta = Math.floor(deltaX / sensitivity);
    
    let newFrame = (lastFrameRef.current + frameDelta) % totalFrames;
    if (newFrame < 0) newFrame += totalFrames;
    
    setCurrentFrame(newFrame);
  }, [isDragging, totalFrames]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Reset to starting position
  const resetView = () => {
    setCurrentFrame(0);
    setIsAutoRotating(false);
  };

  // Toggle auto-rotate
  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden ${className}`}
    >
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ touchAction: 'none' }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent mb-4"></div>
              <div className="text-white font-semibold">Loading 360° View...</div>
              <div className="text-blue-200 text-sm mt-2">
                {loadedImages.length} / {totalFrames} frames
              </div>
            </div>
          </div>
        )}

        {/* Instructions Overlay */}
        {showInstructions && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 transition-opacity pointer-events-none">
            <div className="bg-white/95 px-8 py-6 rounded-lg shadow-2xl text-center max-w-sm">
              <div className="text-4xl mb-3">👆</div>
              <div className="text-navy font-bold text-lg mb-2">Interactive 360° View</div>
              <div className="text-steel text-sm">
                Drag left or right to rotate the vehicle
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <div className="text-white text-sm font-mono">
                {String(currentFrame + 1).padStart(2, '0')} / {String(totalFrames).padStart(2, '0')}
              </div>
              <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold transition-all duration-100"
                  style={{ width: `${((currentFrame + 1) / totalFrames) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleAutoRotate}
          className={`p-3 rounded-lg backdrop-blur-sm transition-all ${
            isAutoRotating 
              ? 'bg-gold text-navy' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          title={isAutoRotating ? 'Stop Auto-Rotate' : 'Start Auto-Rotate'}
        >
          <RotateCw size={20} className={isAutoRotating ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={resetView}
          className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-all"
          title="Reset View"
        >
          <Info size={20} />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Model Name Badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
          <div className="text-xs text-blue-200 mb-1">360° View</div>
          <div className="font-bold">{modelName}</div>
        </div>
      </div>
    </div>
  );
}
