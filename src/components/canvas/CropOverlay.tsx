import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Maximize2, Sparkles, Move, ZoomIn } from 'lucide-react';

export interface CropRect {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

interface CropOverlayProps {
  cropRect: CropRect;
  projectWidth: number;
  projectHeight: number;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onHandleDown: (
    e: React.MouseEvent,
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
  ) => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  cropRect,
  projectWidth,
  projectHeight,
  canvasRef,
  onHandleDown,
}) => {
  const pixelWidth = Math.round((cropRect.width / 100) * projectWidth);
  const pixelHeight = Math.round((cropRect.height / 100) * projectHeight);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewDimAmount, setPreviewDimAmount] = useState<'moderate' | 'dark' | 'focus'>('dark');

  // Real-time crop preview renderer
  useEffect(() => {
    if (!showLivePreview) return;

    const updatePreview = () => {
      const mainCanvas = canvasRef?.current;
      const prevCanvas = previewCanvasRef.current;
      if (!mainCanvas || !prevCanvas) return;

      const pCtx = prevCanvas.getContext('2d');
      if (!pCtx) return;

      const srcX = (cropRect.x / 100) * mainCanvas.width;
      const srcY = (cropRect.y / 100) * mainCanvas.height;
      const srcW = (cropRect.width / 100) * mainCanvas.width;
      const srcH = (cropRect.height / 100) * mainCanvas.height;

      if (srcW <= 0 || srcH <= 0) return;

      prevCanvas.width = 240;
      prevCanvas.height = Math.max(120, Math.round(240 * (srcH / srcW)));

      pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
      pCtx.imageSmoothingEnabled = true;
      pCtx.imageSmoothingQuality = 'high';

      try {
        pCtx.drawImage(
          mainCanvas,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          prevCanvas.width,
          prevCanvas.height
        );
      } catch (err) {
        // Canvas may be clearing/rendering
      }
    };

    const animId = requestAnimationFrame(updatePreview);
    return () => cancelAnimationFrame(animId);
  }, [cropRect, projectWidth, projectHeight, canvasRef, showLivePreview]);

  // Mask opacity based on previewDimAmount
  const maskBgClass =
    previewDimAmount === 'focus'
      ? 'bg-black/90 backdrop-blur-[2px]'
      : previewDimAmount === 'dark'
      ? 'bg-black/75 backdrop-blur-[1px]'
      : 'bg-black/50';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible">
      {/* 4 Outer Dimming Scrims */}
      {/* Top Mask */}
      <div
        className={`absolute top-0 left-0 right-0 ${maskBgClass} transition-colors duration-150`}
        style={{ height: `${cropRect.y}%` }}
      />
      {/* Bottom Mask */}
      <div
        className={`absolute left-0 right-0 bottom-0 ${maskBgClass} transition-colors duration-150`}
        style={{ height: `${Math.max(0, 100 - (cropRect.y + cropRect.height))}%` }}
      />
      {/* Left Mask */}
      <div
        className={`absolute ${maskBgClass} transition-colors duration-150`}
        style={{
          top: `${cropRect.y}%`,
          height: `${cropRect.height}%`,
          left: 0,
          width: `${cropRect.x}%`,
        }}
      />
      {/* Right Mask */}
      <div
        className={`absolute ${maskBgClass} transition-colors duration-150`}
        style={{
          top: `${cropRect.y}%`,
          height: `${cropRect.height}%`,
          left: `${cropRect.x + cropRect.width}%`,
          right: 0,
        }}
      />

      {/* Draggable & Resizable Active Crop Box */}
      <div
        className="absolute pointer-events-auto cursor-move transition-shadow"
        style={{
          top: `${cropRect.y}%`,
          left: `${cropRect.x}%`,
          width: `${cropRect.width}%`,
          height: `${cropRect.height}%`,
        }}
        onMouseDown={(e) => onHandleDown(e, 'move')}
      >
        {/* High-visibility bounding border with animated glow */}
        <div className="w-full h-full border-2 border-dashed border-white shadow-[0_0_20px_rgba(255,255,255,0.7)] relative">
          {/* Rule of Thirds 3x3 Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-white/50" />
            <div className="border-r border-b border-white/50" />
            <div className="border-b border-white/50" />
            <div className="border-r border-b border-white/50" />
            <div className="border-r border-b border-white/50" />
            <div className="border-b border-white/50" />
            <div className="border-r border-b border-white/50" />
            <div className="border-r border-b border-white/50" />
            <div />
          </div>

          {/* Floating dimension & aspect tag */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/95 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/30 whitespace-nowrap pointer-events-none shadow-2xl flex items-center gap-2">
            <span className="text-indigo-400">CROP:</span>
            <span>{pixelWidth} × {pixelHeight} px</span>
            <span className="text-zinc-400 text-[9px]">
              ({(pixelWidth / Math.max(1, pixelHeight)).toFixed(2)}:1)
            </span>
          </div>

          {/* Corner L-Bracket Resizing Handles */}
          {/* Top-Left */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'nw')}
            className="absolute -top-3.5 -left-3.5 w-8 h-8 cursor-nwse-resize flex items-start justify-start p-1 z-30 group"
            title="Resize Top-Left"
          >
            <div className="w-5 h-5 border-t-[4px] border-l-[4px] border-white shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:border-indigo-400 group-hover:scale-110 transition-transform" />
          </div>

          {/* Top-Right */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'ne')}
            className="absolute -top-3.5 -right-3.5 w-8 h-8 cursor-nesw-resize flex items-start justify-end p-1 z-30 group"
            title="Resize Top-Right"
          >
            <div className="w-5 h-5 border-t-[4px] border-r-[4px] border-white shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:border-indigo-400 group-hover:scale-110 transition-transform" />
          </div>

          {/* Bottom-Left */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'sw')}
            className="absolute -bottom-3.5 -left-3.5 w-8 h-8 cursor-nesw-resize flex items-end justify-start p-1 z-30 group"
            title="Resize Bottom-Left"
          >
            <div className="w-5 h-5 border-b-[4px] border-l-[4px] border-white shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:border-indigo-400 group-hover:scale-110 transition-transform" />
          </div>

          {/* Bottom-Right */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'se')}
            className="absolute -bottom-3.5 -right-3.5 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1 z-30 group"
            title="Resize Bottom-Right"
          >
            <div className="w-5 h-5 border-b-[4px] border-r-[4px] border-white shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:border-indigo-400 group-hover:scale-110 transition-transform" />
          </div>

          {/* Mid-edge pill handles */}
          {/* Top Edge Pill */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'n')}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-12 h-7 cursor-ns-resize flex items-center justify-center z-30 group"
            title="Resize Height (Top Edge)"
          >
            <div className="w-7 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:bg-indigo-400 group-hover:scale-110 transition-all" />
          </div>

          {/* Bottom Edge Pill */}
          <div
            onMouseDown={(e) => onHandleDown(e, 's')}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-12 h-7 cursor-ns-resize flex items-center justify-center z-30 group"
            title="Resize Height (Bottom Edge)"
          >
            <div className="w-7 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:bg-indigo-400 group-hover:scale-110 transition-all" />
          </div>

          {/* Left Edge Pill */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'w')}
            className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-12 cursor-ew-resize flex items-center justify-center z-30 group"
            title="Resize Width (Left Edge)"
          >
            <div className="w-2 h-7 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:bg-indigo-400 group-hover:scale-110 transition-all" />
          </div>

          {/* Right Edge Pill */}
          <div
            onMouseDown={(e) => onHandleDown(e, 'e')}
            className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-12 cursor-ew-resize flex items-center justify-center z-30 group"
            title="Resize Width (Right Edge)"
          >
            <div className="w-2 h-7 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.9)] group-hover:bg-indigo-400 group-hover:scale-110 transition-all" />
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Cropping Preview Window (Picture-in-Picture) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto z-40 bg-[#0c0c0e]/95 border border-[#27272a] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md w-64 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-b border-[#27272a] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Crop Preview</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setPreviewDimAmount((prev) =>
                  prev === 'moderate' ? 'dark' : prev === 'dark' ? 'focus' : 'moderate'
                )
              }
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Toggle Mask Darkness (Moderate / Dark / Focus)"
            >
              Mask: {previewDimAmount}
            </button>
            <button
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
              title={showLivePreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showLivePreview ? (
          <div className="p-2.5 flex flex-col items-center bg-[#09090b]">
            <div className="w-full bg-[#18181b] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center min-h-28 max-h-44 shadow-inner">
              <canvas ref={previewCanvasRef} className="w-full h-auto object-contain block" />
            </div>
            <div className="w-full mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{pixelWidth} × {pixelHeight} px</span>
              <span className="text-emerald-400 font-semibold">Live Real-time</span>
            </div>
          </div>
        ) : (
          <div className="p-2 text-center text-[10px] text-zinc-500 font-mono">
            Preview minimized
          </div>
        )}
      </div>
    </div>
  );
};
