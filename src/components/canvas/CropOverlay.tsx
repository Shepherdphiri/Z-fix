import React from 'react';

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
  onHandleDown,
}) => {
  const pixelWidth = Math.round((cropRect.width / 100) * projectWidth);
  const pixelHeight = Math.round((cropRect.height / 100) * projectHeight);

  const maskBgClass = 'bg-black/75 backdrop-blur-[1px]';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible">
      {/* 4 Outer Dimming Scrims - Directly previews crop boundary on the main canvas image */}
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

      {/* Draggable & Resizable Active Crop Box Directly on Canvas */}
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
            <span className="text-indigo-400">LIVE CROP:</span>
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
    </div>
  );
};

