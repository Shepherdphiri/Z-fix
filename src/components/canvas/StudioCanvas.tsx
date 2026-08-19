import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStudio } from '../../context/StudioContext';
import { renderProjectToCanvas } from '../../utils/canvasRenderer';
import { AI_PRESET_FILTERS } from '../../data/presets';
import { LayerTransform, AIPresetFilter } from '../../types';
import { CropOverlay, CropRect } from './CropOverlay';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  SplitSquareVertical,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';

type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'move' | null;

export const StudioCanvas: React.FC = () => {
  const {
    project,
    setProject,
    activeLayer,
    updateLayer,
    splitCompare,
    splitPosition,
    applyPreset,
    showToast,
  } = useStudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profilesScrollRef = useRef<HTMLDivElement>(null);

  // Canvas viewport local state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [canvasPan, setCanvasPan] = useState<{ x: number; y: number }>({ x: 0, y: -20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'move' | 'crop' | 'inspect'>('move');

  // Crop tool interactive state
  const [cropAspectRatio, setCropAspectRatio] = useState<'free' | '1:1' | '4:5' | '16:9' | '3:2' | '9:16'>('free');
  const [cropRect, setCropRect] = useState<CropRect>({ x: 6, y: 6, width: 88, height: 88 });
  const [draggingCropHandle, setDraggingCropHandle] = useState<CropHandle>(null);
  const [cropDragStart, setCropDragStart] = useState<{ clientX: number; clientY: number; initialRect: CropRect } | null>(null);

  // Helper to calculate pixel aspect ratio factor
  const getRatioFactor = useCallback((ratio: string, projectW: number, projectH: number): number | null => {
    switch (ratio) {
      case '1:1':
        return 1 * (projectH / projectW);
      case '4:5':
        return (4 / 5) * (projectH / projectW);
      case '16:9':
        return (16 / 9) * (projectH / projectW);
      case '3:2':
        return (3 / 2) * (projectH / projectW);
      case '9:16':
        return (9 / 16) * (projectH / projectW);
      default:
        return null;
    }
  }, []);

  // Trigger canvas composite rendering
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current || !project) return;
    await renderProjectToCanvas(canvasRef.current, project, {
      showComparisonSplit: splitCompare,
      comparisonPosition: splitPosition,
    });
  }, [project, splitCompare, splitPosition]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (activeTool === 'move' || e.altKey)) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - (canvasPan?.x ?? 0),
        y: e.clientY - (canvasPan?.y ?? 0),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.min(4, Math.max(0.2, (prev ?? 1) + delta)));
  };

  // Center & Fit Canvas
  const handleFitToScreen = () => {
    if (!containerRef.current || !project) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 100 || clientHeight <= 100) {
      setZoomLevel(0.6);
      setCanvasPan({ x: 0, y: -25 });
      return;
    }
    const padding = 80;
    const scaleX = (clientWidth - padding) / (project.width || 1200);
    const scaleY = (clientHeight - padding - 120) / (project.height || 800);
    const fitZoom = Math.min(scaleX, scaleY, 1);
    setZoomLevel(Math.max(0.2, fitZoom));
    setCanvasPan({ x: 0, y: -25 });
  };

  useEffect(() => {
    handleFitToScreen();
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      handleFitToScreen();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [project?.width, project?.height]);

  // Safe layer transform helper
  const updateLayerTransform = (layerId: string, transformUpdates: Partial<LayerTransform>) => {
    if (!activeLayer) return;
    const currentTransform = activeLayer.transform || {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
    };
    updateLayer(layerId, {
      transform: {
        ...currentTransform,
        ...transformUpdates,
      },
    });
  };

  // Horizontal scroll helper for profiles
  const scrollProfiles = (direction: 'left' | 'right') => {
    if (!profilesScrollRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    profilesScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Switch crop aspect ratio preset
  const handleSelectRatio = (ratioId: typeof cropAspectRatio) => {
    setCropAspectRatio(ratioId);
    if (!project) return;
    const factor = getRatioFactor(ratioId, project.width, project.height);
    if (factor !== null) {
      let newW = 86;
      let newH = newW / factor;
      if (newH > 86) {
        newH = 86;
        newW = newH * factor;
      }
      const newX = (100 - newW) / 2;
      const newY = (100 - newH) / 2;
      setCropRect({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: Math.min(100, newW),
        height: Math.min(100, newH),
      });
    }
  };

  // Start dragging a crop handle or moving the box
  const handleCropHandleDown = (e: React.MouseEvent, handle: CropHandle) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingCropHandle(handle);
    setCropDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      initialRect: { ...cropRect },
    });
  };

  const panX = canvasPan?.x ?? 0;
  const panY = canvasPan?.y ?? -25;
  const currentZoom = zoomLevel ?? 1;

  // Global mousemove and mouseup listeners for crop resizing & moving
  useEffect(() => {
    if (!draggingCropHandle || !cropDragStart || !project) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const canvasDisplayW = (project.width || 1200) * currentZoom;
      const canvasDisplayH = (project.height || 800) * currentZoom;
      if (canvasDisplayW <= 0 || canvasDisplayH <= 0) return;

      const deltaPercentX = ((e.clientX - cropDragStart.clientX) / canvasDisplayW) * 100;
      const deltaPercentY = ((e.clientY - cropDragStart.clientY) / canvasDisplayH) * 100;
      const init = cropDragStart.initialRect;
      const factor = getRatioFactor(cropAspectRatio, project.width, project.height);

      let next = { ...init };

      if (draggingCropHandle === 'move') {
        let nx = init.x + deltaPercentX;
        let ny = init.y + deltaPercentY;
        nx = Math.max(0, Math.min(100 - init.width, nx));
        ny = Math.max(0, Math.min(100 - init.height, ny));
        next.x = nx;
        next.y = ny;
      } else {
        let x1 = init.x;
        let y1 = init.y;
        let x2 = init.x + init.width;
        let y2 = init.y + init.height;

        if (draggingCropHandle.includes('w')) {
          x1 = Math.max(0, Math.min(x2 - 8, init.x + deltaPercentX));
        }
        if (draggingCropHandle.includes('e')) {
          x2 = Math.min(100, Math.max(x1 + 8, init.x + init.width + deltaPercentX));
        }
        if (draggingCropHandle.includes('n')) {
          y1 = Math.max(0, Math.min(y2 - 8, init.y + deltaPercentY));
        }
        if (draggingCropHandle.includes('s')) {
          y2 = Math.min(100, Math.max(y1 + 8, init.y + init.height + deltaPercentY));
        }

        let newW = x2 - x1;
        let newH = y2 - y1;

        if (factor !== null) {
          if (draggingCropHandle === 'e' || draggingCropHandle === 'w') {
            newH = newW / factor;
            if (y1 + newH > 100) {
              newH = 100 - y1;
              newW = newH * factor;
            }
          } else if (draggingCropHandle === 'n' || draggingCropHandle === 's') {
            newW = newH * factor;
            if (x1 + newW > 100) {
              newW = 100 - x1;
              newH = newW / factor;
            }
          } else if (draggingCropHandle === 'se') {
            const targetH = newW / factor;
            if (y1 + targetH <= 100) {
              newH = targetH;
            } else {
              newH = 100 - y1;
              newW = newH * factor;
            }
          } else if (draggingCropHandle === 'nw') {
            const targetH = newW / factor;
            if (y2 - targetH >= 0) {
              y1 = y2 - targetH;
              newH = targetH;
            } else {
              y1 = 0;
              newH = y2;
              newW = newH * factor;
              x1 = x2 - newW;
            }
          } else if (draggingCropHandle === 'ne') {
            const targetH = newW / factor;
            if (y2 - targetH >= 0) {
              y1 = y2 - targetH;
              newH = targetH;
            } else {
              y1 = 0;
              newH = y2;
              newW = newH * factor;
            }
          } else if (draggingCropHandle === 'sw') {
            const targetH = newW / factor;
            if (y1 + targetH <= 100) {
              newH = targetH;
            } else {
              newH = 100 - y1;
              newW = newH * factor;
              x1 = x2 - newW;
            }
          }
        }

        next = {
          x: Math.max(0, x1),
          y: Math.max(0, y1),
          width: Math.max(8, Math.min(100 - x1, newW)),
          height: Math.max(8, Math.min(100 - y1, newH)),
        };
      }

      setCropRect(next);
    };

    const handleGlobalMouseUp = () => {
      setDraggingCropHandle(null);
      setCropDragStart(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingCropHandle, cropDragStart, project, currentZoom, cropAspectRatio, getRatioFactor]);

  // Apply Crop to Canvas Project with pixel precision and layer realignment
  const handleApplyCrop = () => {
    if (!project) return;
    const currentW = project.width;
    const currentH = project.height;

    const pixelX = Math.round((cropRect.x / 100) * currentW);
    const pixelY = Math.round((cropRect.y / 100) * currentH);
    const pixelW = Math.max(100, Math.round((cropRect.width / 100) * currentW));
    const pixelH = Math.max(100, Math.round((cropRect.height / 100) * currentH));

    // Shift center offset so image layers remain perfectly stationary under the crop
    const oldCenterX = currentW / 2;
    const oldCenterY = currentH / 2;
    const newCenterX = pixelX + pixelW / 2;
    const newCenterY = pixelY + pixelH / 2;
    const shiftX = oldCenterX - newCenterX;
    const shiftY = oldCenterY - newCenterY;

    const updatedLayers = project.layers.map((layer) => {
      const currentTransform = layer.transform || {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        flipH: false,
        flipV: false,
      };
      return {
        ...layer,
        transform: {
          ...currentTransform,
          x: (currentTransform.x ?? 0) + shiftX,
          y: (currentTransform.y ?? 0) + shiftY,
        },
      };
    });

    setProject((prev) => ({
      ...prev,
      width: pixelW,
      height: pixelH,
      layers: updatedLayers,
      syncStatus: 'pending',
    }));

    setCropRect({ x: 6, y: 6, width: 88, height: 88 });
    setActiveTool('move');
    showToast(`Cropped canvas to ${pixelW} × ${pixelH} px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 h-full w-full bg-[#121214] overflow-hidden relative flex flex-col items-center justify-center select-none"
    >
      {/* Top Floating Precision Tool Palette */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#18181b]/90 backdrop-blur-md p-1 rounded-lg border border-[#27272a] shadow-2xl">
        <button
          onClick={() => setActiveTool('move')}
          className={`p-2 rounded transition cursor-pointer ${
            activeTool === 'move'
              ? 'bg-indigo-600 text-white border border-indigo-400'
              : 'text-zinc-400 hover:text-white hover:bg-[#27272a]'
          }`}
          title="Pan / Move Tool (V)"
        >
          <Move className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool(activeTool === 'crop' ? 'move' : 'crop')}
          className={`p-2 rounded transition cursor-pointer ${
            activeTool === 'crop'
              ? 'bg-indigo-600 text-white border border-indigo-400'
              : 'text-zinc-400 hover:text-white hover:bg-[#27272a]'
          }`}
          title="Aspect Ratio Framing & Crop Tool (C)"
        >
          <Crop className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-[#27272a] mx-0.5" />

        {/* Quick Layer Transforms */}
        {activeLayer && (
          <>
            <button
              onClick={() => {
                const currentRot = activeLayer.transform?.rotation ?? 0;
                updateLayerTransform(activeLayer.id, {
                  rotation: (currentRot + 90) % 360,
                });
              }}
              className="p-2 rounded text-zinc-400 hover:text-white hover:bg-[#27272a] transition cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const currentFlipH = activeLayer.transform?.flipH ?? false;
                updateLayerTransform(activeLayer.id, {
                  flipH: !currentFlipH,
                });
              }}
              className="p-2 rounded text-zinc-400 hover:text-white hover:bg-[#27272a] transition cursor-pointer"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const currentFlipV = activeLayer.transform?.flipV ?? false;
                updateLayerTransform(activeLayer.id, {
                  flipV: !currentFlipV,
                });
              }}
              className="p-2 rounded text-zinc-400 hover:text-white hover:bg-[#27272a] transition cursor-pointer"
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Floating Crop Ratio & Action Bar (when Crop tool active) */}
      {activeTool === 'crop' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#18181b]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-indigo-500/50 text-xs shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold mr-1 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5" /> Ratio:
          </span>
          <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-lg border border-[#27272a]">
            {[
              { id: 'free', label: 'Free' },
              { id: '1:1', label: '1:1' },
              { id: '4:5', label: '4:5' },
              { id: '16:9', label: '16:9' },
              { id: '3:2', label: '3:2' },
              { id: '9:16', label: '9:16' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => handleSelectRatio(ratio.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  cropAspectRatio === ratio.id
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-[#18181b]'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#27272a] mx-1" />

          {/* Real-time size display in toolbar */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-zinc-300">
            <span className="text-zinc-500 text-[10px]">SIZE:</span>
            <span className="text-white font-bold">
              {Math.round((cropRect.width / 100) * (project?.width || 1200))} ×{' '}
              {Math.round((cropRect.height / 100) * (project?.height || 800))}
            </span>
          </div>

          <div className="w-px h-4 bg-[#27272a] mx-1" />

          {/* Action buttons */}
          <button
            onClick={handleApplyCrop}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Apply Crop
          </button>
          <button
            onClick={() => setActiveTool('move')}
            className="p-1.5 hover:bg-[#27272a] text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Cancel Crop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Right Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-[#18181b]/90 backdrop-blur-md p-1 rounded-lg border border-[#27272a] text-zinc-300 shadow-2xl">
        <button
          onClick={() => setZoomLevel((prev) => Math.max(0.2, (prev ?? 1) - 0.15))}
          className="p-1.5 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono px-2 text-zinc-300 font-bold min-w-12 text-center">
          {Math.round(currentZoom * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel((prev) => Math.min(4, (prev ?? 1) + 0.15))}
          className="p-1.5 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-[#27272a] mx-0.5" />
        <button
          onClick={handleFitToScreen}
          className="p-1.5 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white transition cursor-pointer"
          title="Fit Canvas to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas Viewport Surface */}
      <div
        className="relative shadow-2xl transition-transform duration-75 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${currentZoom})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={project?.width || 1200}
          height={project?.height || 800}
          className="bg-[#0c0c0e] ring-1 ring-white/10 shadow-2xl block"
        />

        {/* Dynamic High-Visibility Interactive Cropping Box with Draggable Handles */}
        {activeTool === 'crop' && (
          <CropOverlay
            cropRect={cropRect}
            projectWidth={project?.width || 1200}
            projectHeight={project?.height || 800}
            canvasRef={canvasRef}
            onHandleDown={handleCropHandleDown}
          />
        )}

        {/* Split Comparison Slider Line and Handle */}
        {splitCompare && (
          <div
            className="absolute inset-y-0 z-30 pointer-events-none"
            style={{ left: `${(splitPosition ?? 0.5) * 100}%` }}
          >
            <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] relative">
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#18181b] border-2 border-white flex items-center justify-center shadow-2xl">
                <SplitSquareVertical className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera EXIF Metadata Overlay Badge */}
      <div className="absolute bottom-26 md:bottom-22 left-6 z-20 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded border border-[#27272a] text-[10px] font-mono tracking-tighter text-zinc-400">
        <span className="text-zinc-200 font-bold">ISO 400</span> • f/2.8 • 1/250s • 4K RAW • Pro Color Matrix
      </div>

      {/* Profile Scroll Navigation Carousel Under Image */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-2xl w-full px-4">
        {/* Left Arrow */}
        <button
          onClick={() => scrollProfiles('left')}
          className="p-2 bg-[#18181b]/95 hover:bg-[#27272a] border border-[#27272a] hover:border-zinc-500 rounded-full text-zinc-300 hover:text-white shadow-xl transition active:scale-90 shrink-0 cursor-pointer"
          title="Scroll Profiles Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Horizontally Scrollable Profiles List */}
        <div
          ref={profilesScrollRef}
          className="flex-1 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
        >
          {AI_PRESET_FILTERS.map((preset: AIPresetFilter) => (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="min-w-[125px] h-[72px] bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-indigo-500 rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 group relative overflow-hidden shadow-lg"
            >
              <div className="w-10 h-5 rounded mb-1 overflow-hidden bg-zinc-900 border border-[#27272a]">
                <img
                  src={preset.thumbnailUrl}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                />
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-300 group-hover:text-indigo-400 truncate max-w-full font-mono">
                {preset.name.replace(' Film', '').replace(' AI', '')}
              </span>
              <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{preset.tag}</span>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollProfiles('right')}
          className="p-2 bg-[#18181b]/95 hover:bg-[#27272a] border border-[#27272a] hover:border-zinc-500 rounded-full text-zinc-300 hover:text-white shadow-xl transition active:scale-90 shrink-0 cursor-pointer"
          title="Scroll Profiles Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
