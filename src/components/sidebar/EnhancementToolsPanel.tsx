import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  applyNoiseReduction,
  applySkinRetouching,
  upscaleImageLayer,
  removeOrReplaceBackground,
  applyAutoEnhance,
  loadImage,
} from '../../utils/imageProcessors';
import {
  Sparkles,
  Zap,
  Wand2,
  Maximize2,
  Scissors,
  Smile,
  Sliders,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  ZoomIn,
  SplitSquareVertical,
  Activity,
} from 'lucide-react';

export const EnhancementToolsPanel: React.FC = () => {
  const {
    activeLayer,
    updateLayer,
    project,
    setProject,
    showToast,
  } = useStudio();

  const [activeEnhanceSection, setActiveEnhanceSection] = useState<
    'denoise' | 'upscale' | 'bg_remover' | 'skin_retouch' | 'auto_enhance'
  >('denoise');

  // Noise Reduction State
  const [denoiseStrength, setDenoiseStrength] = useState<number>(65);
  const [colorDenoise, setColorDenoise] = useState<number>(50);
  const [isDenoising, setIsDenoising] = useState<boolean>(false);

  // Upscaler State
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);

  // Background Remover State
  const [bgMode, setBgMode] = useState<'transparent' | 'color' | 'blur' | 'gradient'>('transparent');
  const [bgColor, setBgColor] = useState<string>('#0a0a0b');
  const [bgBlurRadius, setBgBlurRadius] = useState<number>(25);
  const [bgThreshold, setBgThreshold] = useState<number>(45);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);

  // Skin Retouching State
  const [skinSmoothing, setSkinSmoothing] = useState<number>(60);
  const [blemishReduction, setBlemishReduction] = useState<number>(50);
  const [skinGlow, setSkinGlow] = useState<number>(30);
  const [isSkinRetouching, setIsSkinRetouching] = useState<boolean>(false);

  // Live Preview Canvas State & Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const [isPreviewRendering, setIsPreviewRendering] = useState<boolean>(false);
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0-100 percentage
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<'fit' | '100%' | '200%'>('fit');
  const [renderLatencyMs, setRenderLatencyMs] = useState<number>(12);
  const [liveCanvasOverlay, setLiveCanvasOverlay] = useState<boolean>(false);

  // Load active layer source image for fast memory caching
  useEffect(() => {
    if (!activeLayer?.imageUrl) return;
    let isMounted = true;
    loadImage(activeLayer.imageUrl)
      .then((img) => {
        if (isMounted) {
          originalImgRef.current = img;
          triggerLivePreview();
        }
      })
      .catch((err) => console.error('Failed to load layer image for live preview:', err));

    return () => {
      isMounted = false;
    };
  }, [activeLayer?.imageUrl]);

  // Master Live Preview Engine: Computes real-time preview as sliders change
  const triggerLivePreview = useCallback(() => {
    const origImg = originalImgRef.current;
    const canvas = previewCanvasRef.current;
    if (!origImg || !canvas) return;

    setIsPreviewRendering(true);
    const startTime = performance.now();

    const pCtx = canvas.getContext('2d', { willReadFrequently: true });
    if (!pCtx) return;

    // Fast working resolution for preview
    const aspect = (origImg.naturalWidth || origImg.width) / (origImg.naturalHeight || origImg.height);
    const targetWidth = 480;
    const targetHeight = Math.round(targetWidth / aspect);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw base original image
    pCtx.clearRect(0, 0, targetWidth, targetHeight);
    pCtx.drawImage(origImg, 0, 0, targetWidth, targetHeight);

    // If user is pressing "Hold to Compare", keep original and stop
    if (isComparingOriginal) {
      setIsPreviewRendering(false);
      setRenderLatencyMs(Math.round(performance.now() - startTime));
      return;
    }

    // Apply the active tool's live effect onto the preview canvas
    if (activeEnhanceSection === 'denoise') {
      applyNoiseReduction(pCtx, targetWidth, targetHeight, denoiseStrength, colorDenoise);
    } else if (activeEnhanceSection === 'skin_retouch') {
      applySkinRetouching(pCtx, targetWidth, targetHeight, skinSmoothing, blemishReduction, skinGlow);
    } else if (activeEnhanceSection === 'auto_enhance') {
      applyAutoEnhance(pCtx, targetWidth, targetHeight);
    } else if (activeEnhanceSection === 'bg_remover') {
      // Fast procedural background preview
      const imgData = pCtx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      // Sample corner as background estimate
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const threshDist = (bgThreshold / 100) * 180;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);

        if (dist < threshDist) {
          if (bgMode === 'transparent') {
            data[i + 3] = 0;
          } else if (bgMode === 'color') {
            // Apply solid color
            const parsedHex = bgColor.replace('#', '');
            const cr = parseInt(parsedHex.substring(0, 2), 16) || 0;
            const cg = parseInt(parsedHex.substring(2, 4), 16) || 0;
            const cb = parseInt(parsedHex.substring(4, 6), 16) || 0;
            data[i] = cr;
            data[i + 1] = cg;
            data[i + 2] = cb;
          } else if (bgMode === 'blur') {
            data[i] = Math.round(data[i] * 0.4);
            data[i + 1] = Math.round(data[i + 1] * 0.4);
            data[i + 2] = Math.round(data[i + 2] * 0.4);
          } else if (bgMode === 'gradient') {
            const yRatio = Math.floor(i / 4 / targetWidth) / targetHeight;
            data[i] = Math.round(15 + yRatio * 50);
            data[i + 1] = Math.round(20 + yRatio * 80);
            data[i + 2] = Math.round(40 + yRatio * 160);
          }
        }
      }
      pCtx.putImageData(imgData, 0, 0);
    } else if (activeEnhanceSection === 'upscale') {
      // Simulate ultra-crisp edge reconstruction
      pCtx.filter = 'contrast(108%) saturate(104%)';
      pCtx.drawImage(canvas, 0, 0);
      pCtx.filter = 'none';
    }

    // If Split comparison is active (< 100%), draw original on left half
    if (splitPosition < 100) {
      const splitX = Math.round((splitPosition / 100) * targetWidth);
      pCtx.save();
      pCtx.beginPath();
      pCtx.rect(0, 0, splitX, targetHeight);
      pCtx.clip();
      pCtx.drawImage(origImg, 0, 0, targetWidth, targetHeight);
      pCtx.restore();

      // Draw vertical divider line
      pCtx.strokeStyle = '#ffffff';
      pCtx.lineWidth = 2;
      pCtx.beginPath();
      pCtx.moveTo(splitX, 0);
      pCtx.lineTo(splitX, targetHeight);
      pCtx.stroke();
    }

    setIsPreviewRendering(false);
    setRenderLatencyMs(Math.max(4, Math.round(performance.now() - startTime)));
  }, [
    activeEnhanceSection,
    denoiseStrength,
    colorDenoise,
    upscaleFactor,
    bgMode,
    bgColor,
    bgBlurRadius,
    bgThreshold,
    skinSmoothing,
    blemishReduction,
    skinGlow,
    splitPosition,
    isComparingOriginal,
  ]);

  // Trigger live preview whenever any parameter changes
  useEffect(() => {
    const handle = requestAnimationFrame(triggerLivePreview);
    return () => cancelAnimationFrame(handle);
  }, [triggerLivePreview]);

  if (!activeLayer) {
    return (
      <div className="p-4 text-center text-xs text-zinc-500 font-mono">
        Select an image layer to run neural enhancements
      </div>
    );
  }

  // --- 1. Apply Noise Reduction ---
  const handleApplyDenoise = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsDenoising(true);
      const img = await loadImage(activeLayer.imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applyNoiseReduction(ctx, canvas.width, canvas.height, denoiseStrength, colorDenoise);

      const processedDataUrl = canvas.toDataURL('image/png');
      updateLayer(activeLayer.id, {
        imageUrl: processedDataUrl,
      });

      showToast(`Noise reduction applied (${denoiseStrength}% strength)`);
    } catch (err: any) {
      showToast(`Denoise error: ${err?.message || 'Failed'}`);
    } finally {
      setIsDenoising(false);
    }
  };

  // --- 2. Apply AI Upscaler ---
  const handleApplyUpscale = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsUpscaling(true);
      showToast(`Synthesizing ${upscaleFactor}X Super-Resolution neural pixels...`);

      const result = await upscaleImageLayer(activeLayer.imageUrl, upscaleFactor, true);

      updateLayer(activeLayer.id, {
        imageUrl: result.dataUrl,
        originalWidth: result.width,
        originalHeight: result.height,
      });

      setProject((prev) => ({
        ...prev,
        width: Math.max(prev.width, result.width),
        height: Math.max(prev.height, result.height),
      }));

      showToast(`Upscaled layer to ${result.width} × ${result.height} px (${upscaleFactor}X)`);
    } catch (err: any) {
      showToast(`Upscaling error: ${err?.message || 'Failed'}`);
    } finally {
      setIsUpscaling(false);
    }
  };

  // --- 3. Apply Background Remover ---
  const handleApplyBgRemover = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsRemovingBg(true);
      showToast(`Isolating foreground subject and applying ${bgMode} backdrop...`);

      const processedUrl = await removeOrReplaceBackground(activeLayer.imageUrl, bgMode, {
        color: bgColor,
        blurRadius: bgBlurRadius,
        threshold: bgThreshold,
      });

      updateLayer(activeLayer.id, {
        imageUrl: processedUrl,
      });

      showToast(`Background processing complete (${bgMode})`);
    } catch (err: any) {
      showToast(`BG Remover error: ${err?.message || 'Failed'}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // --- 4. Apply Skin Retouching ---
  const handleApplySkinRetouching = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsSkinRetouching(true);
      const img = await loadImage(activeLayer.imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applySkinRetouching(ctx, canvas.width, canvas.height, skinSmoothing, blemishReduction, skinGlow);

      const processedDataUrl = canvas.toDataURL('image/png');
      updateLayer(activeLayer.id, {
        imageUrl: processedDataUrl,
      });

      showToast(`Skin retouching applied (Smooth: ${skinSmoothing}%, Glow: ${skinGlow}%)`);
    } catch (err: any) {
      showToast(`Skin Retouch error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSkinRetouching(false);
    }
  };

  // --- 5. Apply Auto Enhance ---
  const handleApplyAutoEnhance = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      const img = await loadImage(activeLayer.imageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applyAutoEnhance(ctx, canvas.width, canvas.height);

      const processedDataUrl = canvas.toDataURL('image/png');
      updateLayer(activeLayer.id, {
        imageUrl: processedDataUrl,
      });

      showToast('Applied Smart Dynamic Auto-Enhance');
    } catch (err: any) {
      showToast(`Auto-enhance error: ${err?.message || 'Failed'}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* 5 Pro Enhancement Tool Switchers */}
      <div className="grid grid-cols-5 gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
        {[
          { id: 'denoise', label: 'De-Noise', icon: Sliders },
          { id: 'upscale', label: 'Upscaler', icon: Maximize2 },
          { id: 'bg_remover', label: 'BG Clear', icon: Scissors },
          { id: 'skin_retouch', label: 'Retouch', icon: Smile },
          { id: 'auto_enhance', label: 'Auto HDR', icon: Wand2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeEnhanceSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveEnhanceSection(tab.id as any)}
              className={`py-2 px-1 rounded flex flex-col items-center justify-center gap-1 transition relative ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-mono whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-2 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* --- MASTER REAL-TIME LIVE PREVIEW VIEWPORT --- */}
      <div className="p-3 bg-[#111114] rounded-xl border border-indigo-500/30 shadow-2xl space-y-2.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-white font-mono">
            <Eye className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="uppercase tracking-wider">Live Preview Viewport</span>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded border border-white/10 text-emerald-400 font-semibold">
              <Activity className="w-2.5 h-2.5" />
              {renderLatencyMs}ms • Real-time
            </span>
          </div>
        </div>

        {/* Live Canvas Viewport Box */}
        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#070709] min-h-[160px] max-h-[220px] flex items-center justify-center shadow-inner group">
          {/* Transparency grid backdrop */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          />

          <canvas
            ref={previewCanvasRef}
            className={`max-w-full max-h-[210px] object-contain block transition-transform duration-150 ${
              previewZoom === '100%' ? 'scale-125' : previewZoom === '200%' ? 'scale-150' : 'scale-100'
            }`}
          />

          {/* Interactive Split Position Bar */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 text-[9px] font-mono text-zinc-300 pointer-events-none">
            <span className="text-zinc-400">Original</span>
            <span className="text-white font-bold">|</span>
            <span className="text-indigo-400 font-bold">Live {activeEnhanceSection.replace('_', ' ').toUpperCase()}</span>
          </div>

          {/* Quick "Hold to See Original" Button */}
          <button
            onMouseDown={() => setIsComparingOriginal(true)}
            onMouseUp={() => setIsComparingOriginal(false)}
            onMouseLeave={() => setIsComparingOriginal(false)}
            onTouchStart={() => setIsComparingOriginal(true)}
            onTouchEnd={() => setIsComparingOriginal(false)}
            className="absolute bottom-2 right-2 bg-black/85 hover:bg-zinc-800 text-zinc-200 border border-white/20 text-[9px] font-mono font-bold px-2 py-1 rounded shadow transition active:scale-95 flex items-center gap-1 cursor-pointer select-none"
            title="Press and hold to view original without enhancements"
          >
            <SplitSquareVertical className="w-3 h-3 text-indigo-400" />
            <span>Hold to Compare</span>
          </button>
        </div>

        {/* Live Preview Controls: Split Wipe & Zoom */}
        <div className="flex items-center justify-between gap-3 text-[10px] font-mono pt-1 text-zinc-400">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-zinc-500 uppercase text-[9px] font-bold">Split Wipe:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={(e) => setSplitPosition(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title="Slide to wipe between Before (left) and After (right)"
            />
            <span className="text-zinc-300 w-7 text-right">{splitPosition}%</span>
          </div>

          <div className="flex items-center gap-1">
            {(['fit', '100%', '200%'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setPreviewZoom(z)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition ${
                  previewZoom === z
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- 1. NOISE REDUCTION TOOL --- */}
      {activeEnhanceSection === 'denoise' && (
        <div className="p-3.5 bg-[#18181b] rounded-lg border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                AI Noise Reduction
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black text-indigo-400 border border-[#27272a]">
              BILATERAL FILTER
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Eliminates high-ISO digital grain and sensor noise while retaining crisp object edges and sharp focus details.
          </p>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Luminance Noise Reduction</span>
                <span className="font-mono text-white">{denoiseStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={denoiseStrength}
                onChange={(e) => setDenoiseStrength(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Color Noise Suppression</span>
                <span className="font-mono text-white">{colorDenoise}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={colorDenoise}
                onChange={(e) => setColorDenoise(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setDenoiseStrength(65);
                setColorDenoise(50);
                showToast('Reset De-Noise settings');
              }}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-400 hover:text-white rounded text-xs font-mono transition"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleApplyDenoise}
              disabled={isDenoising}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50"
            >
              {isDenoising ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Denoise...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply De-Noise to Layer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- 2. AI UPSCALER TOOL --- */}
      {activeEnhanceSection === 'upscale' && (
        <div className="p-3.5 bg-[#18181b] rounded-lg border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Super-Resolution Upscaler
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black text-emerald-400 border border-[#27272a]">
              NEURAL EDGE 4K
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Multi-pass sub-pixel synthesis increases image resolution by 200% or 400% with Laplacian edge reconstruction without blur or pixelation.
          </p>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Upscale Target Factor
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUpscaleFactor(2)}
                className={`py-2 px-3 rounded text-xs font-mono font-bold flex flex-col items-center justify-center border transition ${
                  upscaleFactor === 2
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                    : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                }`}
              >
                <span>2X Super HD</span>
                <span className="text-[9px] opacity-75 font-normal">
                  {(activeLayer.originalWidth || project.width) * 2} × {(activeLayer.originalHeight || project.height) * 2} px
                </span>
              </button>

              <button
                onClick={() => setUpscaleFactor(4)}
                className={`py-2 px-3 rounded text-xs font-mono font-bold flex flex-col items-center justify-center border transition ${
                  upscaleFactor === 4
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                    : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                }`}
              >
                <span>4X Ultra HD</span>
                <span className="text-[9px] opacity-75 font-normal">
                  {(activeLayer.originalWidth || project.width) * 4} × {(activeLayer.originalHeight || project.height) * 4} px
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={handleApplyUpscale}
            disabled={isUpscaling}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50"
          >
            {isUpscaling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Reconstructing Pixels ({upscaleFactor}X)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upscale Layer to {upscaleFactor}X</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* --- 3. BG REMOVER TOOL --- */}
      {activeEnhanceSection === 'bg_remover' && (
        <div className="p-3.5 bg-[#18181b] rounded-lg border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                AI Background Remover & Studio Compositor
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black text-purple-400 border border-[#27272a]">
              SEGMENTATION
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Segments foreground subjects and generates transparent cutouts, studio solid backdrops, or optical bokeh blurs.
          </p>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Replacement Mode
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'transparent', label: 'Transparent PNG' },
                { id: 'blur', label: 'Bokeh Blur Backdrop' },
                { id: 'color', label: 'Studio Solid Color' },
                { id: 'gradient', label: 'Studio Gradient' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setBgMode(m.id as any)}
                  className={`py-1.5 px-2 rounded text-[11px] font-medium border text-left transition ${
                    bgMode === m.id
                      ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                      : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {bgMode === 'color' && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Backdrop Color Preset
              </span>
              <div className="flex items-center gap-2">
                {[
                  { color: '#000000', label: 'Black' },
                  { color: '#ffffff', label: 'White' },
                  { color: '#1e293b', label: 'Slate' },
                  { color: '#4f46e5', label: 'Indigo' },
                  { color: '#059669', label: 'Emerald' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setBgColor(c.color)}
                    className={`w-6 h-6 rounded-full border border-white/20 transition ${
                      bgColor === c.color ? 'ring-2 ring-purple-400 scale-110' : 'opacity-70'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                  title="Custom Color"
                />
              </div>
            </div>
          )}

          {bgMode === 'blur' && (
            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Depth Blur Radius</span>
                <span className="font-mono text-white">{bgBlurRadius} px</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={bgBlurRadius}
                onChange={(e) => setBgBlurRadius(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
              <span>Edge Extraction Sensitivity</span>
              <span className="font-mono text-white">{bgThreshold}</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={bgThreshold}
              onChange={(e) => setBgThreshold(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <button
            onClick={handleApplyBgRemover}
            disabled={isRemovingBg}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50"
          >
            {isRemovingBg ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Segmenting Subject...</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Apply Background ({bgMode})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* --- 4. SKIN RETOUCHING TOOL --- */}
      {activeEnhanceSection === 'skin_retouch' && (
        <div className="p-3.5 bg-[#18181b] rounded-lg border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                AI Skin Retouching & Portrait Glow
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black text-amber-400 border border-[#27272a]">
              PORTRAIT AI
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Frequency-separation dermal algorithm softens wrinkles and spots while preserving natural skin pores, eyelashes, and lip structure.
          </p>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Dermal Smoothing</span>
                <span className="font-mono text-white">{skinSmoothing}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skinSmoothing}
                onChange={(e) => setSkinSmoothing(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Blemish & Spot Softening</span>
                <span className="font-mono text-white">{blemishReduction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blemishReduction}
                onChange={(e) => setBlemishReduction(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Porcelain Glow & Warmth</span>
                <span className="font-mono text-white">{skinGlow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skinGlow}
                onChange={(e) => setSkinGlow(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setSkinSmoothing(60);
                setBlemishReduction(50);
                setSkinGlow(30);
                showToast('Reset Skin Retouching settings');
              }}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-400 hover:text-white rounded text-xs font-mono transition"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleApplySkinRetouching}
              disabled={isSkinRetouching}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50"
            >
              {isSkinRetouching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Retouching Skin...</span>
                </>
              ) : (
                <>
                  <Smile className="w-3.5 h-3.5" />
                  <span>Apply Skin Retouch to Layer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- 5. SMART AUTO-ENHANCE --- */}
      {activeEnhanceSection === 'auto_enhance' && (
        <div className="p-3.5 bg-[#18181b] rounded-lg border border-[#27272a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Smart Auto HDR Dynamic Range
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black text-cyan-400 border border-[#27272a]">
              HISTOGRAM BALANCER
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Performs intelligent dynamic range stretching, white-point recalibration, shadow detail recovery, and highlight roll-off compression in one click.
          </p>

          <button
            onClick={handleApplyAutoEnhance}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply Smart Auto-Enhance to Layer</span>
          </button>
        </div>
      )}
    </div>
  );
};
