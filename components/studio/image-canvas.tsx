"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define props interface
interface ImageCanvasProps {
  imageSrc: string | null; // Accepts string (URL/base64) or null
}

export function ImageCanvas({ imageSrc }: ImageCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0 && e.altKey) { // Middle mouse button or Alt+Left click
      setPanning(true);
    }
  };
  
  const handleMouseUp = () => {
    setPanning(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      setPosition(prevPosition => ({
        x: prevPosition.x + e.movementX,
        y: prevPosition.y + e.movementY
      }));
    }
  };
  
  // Placeholder image for demonstration
  // const placeholderImage = "https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg";
  const displayImage = imageSrc || "/placeholder-image.svg"; // Use prop or fallback
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom + delta)));
      }
    };
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div 
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          style={{
            x: position.x,
            y: position.y,
            scale: zoom,
          }}
          transition={{ type: "tween", duration: 0 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative border shadow-lg">
            <img 
              src={displayImage} 
              alt="Canvas" 
              className="max-w-full object-contain"
              style={{ maxHeight: '70vh' }}
            />
            
            {/* Selection overlay - would be dynamically positioned based on user selection */}
            {imageSrc && (
              <div className="absolute top-20 left-40 w-40 h-32 border-2 border-blue-500 bg-blue-500/20"></div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow">
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="flex items-center min-w-[40px] justify-center text-sm">
          {Math.round(zoom * 100)}%
        </div>
        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}