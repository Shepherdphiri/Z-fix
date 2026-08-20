import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  applyNoiseReduction,
  applySkinRetouching,
  upscaleImageLayer,
  removeOrReplaceBackground,
  applyAutoEnhance,
  loadImage,
  REMOVE_BG_PRESET_PHOTOS,
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
  RotateCcw,
  SplitSquareVertical,
  Layers,
  Download,
  Plus,
  Upload,
  Paintbrush,
  Eraser,
  Sun,
  SlidersHorizontal,
  Image as ImageIcon,
  Palette,
  EyeOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const EnhancementToolsPanel: React.FC = () => {
  const {
    activeLayer,
    updateLayer,
    addLayer,
    project,
    setProject,
    liveEnhancement,
    updateLiveEnhancement,
    resetLiveEnhancement,
    showToast,
  } = useStudio();

  const [activeEnhanceSection, setActiveEnhanceSection] = useState<
    'denoise' | 'upscale' | 'bg_remover' | 'skin_retouch' | 'auto_enhance'
  >('bg_remover');

  // Noise Reduction State
  const [denoiseStrength, setDenoiseStrength] = useState<number>(65);
  const [colorDenoise, setColorDenoise] = useState<number>(50);
  const [isDenoising, setIsDenoising] = useState<boolean>(false);

  // Upscaler State
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);

  // Background Remover State (remove.bg Suite)
  const [bgTab, setBgTab] = useState<'background' | 'erase_restore' | 'shadow'>('background');
  const [bgMode, setBgMode] = useState<'transparent' | 'color' | 'blur' | 'gradient' | 'photo'>('transparent');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [bgPhotoUrl, setBgPhotoUrl] = useState<string>(REMOVE_BG_PRESET_PHOTOS[0].url);
  const [bgBlurRadius, setBgBlurRadius] = useState<number>(24);
  const [bgShadowType, setBgShadowType] = useState<'none' | 'drop' | 'floor' | 'floating'>('none');
  const [bgShadowOpacity, setBgShadowOpacity] = useState<number>(45);
  const [bgShadowBlur, setBgShadowBlur] = useState<number>(20);
  const [bgThreshold, setBgThreshold] = useState<number>(45);
  const [bgFeather, setBgFeather] = useState<number>(4);
  const [protectSubject, setProtectSubject] = useState<boolean>(true);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [isDownloadingCutout, setIsDownloadingCutout] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Erase & Restore Brush State
  const [brushMode, setBrushMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(32);
  const [brushSoftness, setBrushSoftness] = useState<number>(50);

  // Skin Retouching State
  const [skinSmoothing, setSkinSmoothing] = useState<number>(60);
  const [blemishReduction, setBlemishReduction] = useState<number>(50);
  const [skinGlow, setSkinGlow] = useState<number>(30);
  const [isSkinRetouching, setIsSkinRetouching] = useState<boolean>(false);

  // Comparison State
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state into the global liveEnhancement engine so the main canvas renders the preview in real-time
  useEffect(() => {
    updateLiveEnhancement({
      activeTool: activeEnhanceSection,
      denoise: {
        luminance: denoiseStrength,
        color: colorDenoise,
      },
      upscale: {
        factor: upscaleFactor,
      },
      bgRemover: {
        mode: bgMode,
        color: bgColor,
        photoUrl: bgPhotoUrl,
        blurRadius: bgBlurRadius,
        threshold: bgThreshold,
        feather: bgFeather,
        protectSubject: protectSubject,
        activeTab: bgTab,
        brushMode: brushMode,
        brushSize: brushSize,
        brushSoftness: brushSoftness,
        shadowType: bgShadowType,
        shadowOpacity: bgShadowOpacity,
        shadowBlur: bgShadowBlur,
      },
      skinRetouch: {
        smoothing: skinSmoothing,
        blemish: blemishReduction,
        glow: skinGlow,
      },
      isComparingOriginal: isComparingOriginal,
    });
  }, [
    activeEnhanceSection,
    denoiseStrength,
    colorDenoise,
    upscaleFactor,
    bgTab,
    bgMode,
    bgColor,
    bgPhotoUrl,
    bgBlurRadius,
    bgShadowType,
    bgShadowOpacity,
    bgShadowBlur,
    brushMode,
    brushSize,
    brushSoftness,
    bgThreshold,
    bgFeather,
    protectSubject,
    skinSmoothing,
    blemishReduction,
    skinGlow,
    isComparingOriginal,
    updateLiveEnhancement,
  ]);

  // Clean up live enhancement preview when unmounting
  useEffect(() => {
    return () => {
      resetLiveEnhancement();
    };
  }, [resetLiveEnhancement]);

  if (!activeLayer) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500 font-mono bg-[#18181b] rounded-xl border border-[#27272a]">
        <Layers className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
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

      showToast(`Noise reduction baked to layer (${denoiseStrength}% strength)`);
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

      // Update layer with new upscaled image and update project dimensions
      updateLayer(
        activeLayer.id,
        {
          imageUrl: result.dataUrl,
          originalWidth: result.width,
          originalHeight: result.height,
        },
        {
          width: result.width,
          height: result.height,
        }
      );

      showToast(`Upscaled layer to ${result.width} × ${result.height} px (${upscaleFactor}X)`);
    } catch (err: any) {
      showToast(`Upscaling error: ${err?.message || 'Failed'}`);
    } finally {
      setIsUpscaling(false);
    }
  };

  // --- 3. Apply Background Removal (remove.bg Engine) ---
  const handleApplyBgRemover = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsRemovingBg(true);
      showToast(`Isolating subject and applying ${bgMode} backdrop...`);

      const processedUrl = await removeOrReplaceBackground(activeLayer.imageUrl, bgMode, {
        color: bgColor,
        photoUrl: bgPhotoUrl,
        blurRadius: bgBlurRadius,
        threshold: bgThreshold,
        feather: bgFeather,
        protectSubject: protectSubject,
        shadowType: bgShadowType,
        shadowOpacity: bgShadowOpacity,
        shadowBlur: bgShadowBlur,
      });

      updateLayer(activeLayer.id, {
        imageUrl: processedUrl,
      });

      showToast(`Background cutout baked successfully (${bgMode})`);
    } catch (err: any) {
      showToast(`BG Remover error: ${err?.message || 'Failed'}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // --- 3B. Add Cutout as New Project Layer ---
  const handleAddCutoutAsNewLayer = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsRemovingBg(true);
      showToast('Generating isolated subject layer...');

      const cutoutUrl = await removeOrReplaceBackground(activeLayer.imageUrl, 'transparent', {
        threshold: bgThreshold,
        feather: bgFeather,
        protectSubject: protectSubject,
      });

      addLayer('image', {
        name: `${activeLayer.name} (Cutout)`,
        imageUrl: cutoutUrl,
        originalWidth: activeLayer.originalWidth,
        originalHeight: activeLayer.originalHeight,
      });

      showToast('Added transparent cutout as new top layer!');
    } catch (err: any) {
      showToast(`Error adding cutout layer: ${err?.message || 'Failed'}`);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // --- 3C. Download High-Res PNG Cutout ---
  const handleDownloadTransparentCutout = async () => {
    if (!activeLayer.imageUrl) {
      showToast('Active layer has no raster image.');
      return;
    }
    try {
      setIsDownloadingCutout(true);
      showToast('Exporting high-resolution transparent PNG...');

      const outputUrl = await removeOrReplaceBackground(activeLayer.imageUrl, bgMode, {
        color: bgColor,
        photoUrl: bgPhotoUrl,
        blurRadius: bgBlurRadius,
        threshold: bgThreshold,
        feather: bgFeather,
        protectSubject: protectSubject,
        shadowType: bgShadowType,
        shadowOpacity: bgShadowOpacity,
        shadowBlur: bgShadowBlur,
      });

      const a = document.createElement('a');
      a.href = outputUrl;
      a.download = `${activeLayer.name.toLowerCase().replace(/\s+/g, '_')}_removebg_${bgMode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Downloaded cutout PNG successfully!');
    } catch (err: any) {
      showToast(`Download error: ${err?.message || 'Failed'}`);
    } finally {
      setIsDownloadingCutout(false);
    }
  };

  // --- 3D. Upload Custom Photo Backdrop ---
  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setBgPhotoUrl(event.target.result);
        setBgMode('photo');
        showToast(`Loaded custom background photo: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
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

      showToast(`Skin retouching baked (Smooth: ${skinSmoothing}%, Glow: ${skinGlow}%)`);
    } catch (err: any) {
      showToast(`Skin Retouch error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSkinRetouching(false);
    }
  };

  // --- 5. Apply Auto-Enhance ---
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
              className={`py-2 px-1 rounded flex flex-col items-center justify-center gap-1 transition relative cursor-pointer ${
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

      {/* Live in-canvas Status Badge & Quick Compare Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121215] rounded-lg border border-indigo-500/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-zinc-300">
            Live preview on canvas: <strong className="text-white uppercase">{activeEnhanceSection.replace('_', ' ')}</strong>
          </span>
        </div>

        {/* Hold to Compare button directly on the active canvas */}
        <button
          onMouseDown={() => setIsComparingOriginal(true)}
          onMouseUp={() => setIsComparingOriginal(false)}
          onMouseLeave={() => setIsComparingOriginal(false)}
          onTouchStart={() => setIsComparingOriginal(true)}
          onTouchEnd={() => setIsComparingOriginal(false)}
          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer select-none active:scale-95"
          title="Press and hold to view original without enhancements on the main canvas"
        >
          <SplitSquareVertical className="w-3 h-3 text-indigo-400" />
          <span>Hold to Compare</span>
        </button>
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
            Eliminates high-ISO digital grain and sensor noise while retaining crisp object edges and sharp focus details directly on the canvas image.
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
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-400 hover:text-white rounded text-xs font-mono transition cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleApplyDenoise}
              disabled={isDenoising}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50 cursor-pointer"
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
                className={`py-2 px-3 rounded text-xs font-mono font-bold flex flex-col items-center justify-center border transition cursor-pointer ${
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
                className={`py-2 px-3 rounded text-xs font-mono font-bold flex flex-col items-center justify-center border transition cursor-pointer ${
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
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg"
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

      {/* --- 3. REMOVE.BG BACKGROUND REMOVER & STUDIO COMPOSITOR --- */}
      {activeEnhanceSection === 'bg_remover' && (
        <div className="p-3.5 bg-[#18181b] rounded-xl border border-purple-500/30 space-y-3.5 shadow-lg shadow-purple-950/20">
          {/* remove.bg Branding Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Scissors className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wide text-white block">
                  REMOVE<span className="text-purple-400">.BG</span> STUDIO
                </span>
                <span className="text-[9px] text-zinc-400 font-medium">100% Automatic AI Cutout</span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              READY
            </span>
          </div>

          {/* Tab Navigation: Removed BG vs Original Toggle */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/50 rounded-lg border border-[#27272a]">
            <button
              onClick={() => setIsComparingOriginal(false)}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold text-center transition cursor-pointer ${
                !isComparingOriginal
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Removed Background
            </button>
            <button
              onClick={() => setIsComparingOriginal(true)}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold text-center transition cursor-pointer ${
                isComparingOriginal
                  ? 'bg-zinc-700 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Original Photo
            </button>
          </div>

          {/* Sub-tool Tabs: Background | Erase/Restore | Shadows */}
          <div className="flex items-center gap-1 border-b border-[#27272a] pb-2">
            {[
              { id: 'background', label: 'Background', icon: Palette },
              { id: 'erase_restore', label: 'Erase / Restore', icon: Eraser },
              { id: 'shadow', label: 'Shadows', icon: Sun },
            ].map((st) => {
              const Icon = st.icon;
              const isSelected = bgTab === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setBgTab(st.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-purple-300 border border-purple-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BACKGROUND OPTIONS */}
          {bgTab === 'background' && (
            <div className="space-y-3">
              {/* 4 Mode Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'transparent', label: 'Transparent', icon: EyeOff },
                  { id: 'photo', label: 'Photo', icon: ImageIcon },
                  { id: 'color', label: 'Color', icon: Palette },
                  { id: 'blur', label: 'Blur', icon: SlidersHorizontal },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = bgMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setBgMode(m.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/20 border-purple-400 text-purple-200 font-bold shadow-inner'
                          : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* MODE 1: TRANSPARENT PNG */}
              {bgMode === 'transparent' && (
                <div className="p-3 bg-zinc-900/80 rounded-lg border border-[#27272a] flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-white/20 shrink-0"
                    style={{
                      backgroundImage:
                        'repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%)',
                      backgroundSize: '10px 10px',
                    }}
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">
                      Transparent PNG Cutout
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      Standard transparent backdrop with zero edge halos.
                    </span>
                  </div>
                </div>
              )}

              {/* MODE 2: PHOTO BACKDROPS */}
              {bgMode === 'photo' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Curated Photo Backdrops
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {REMOVE_BG_PRESET_PHOTOS.map((p) => {
                      const isSelected = bgPhotoUrl === p.url;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setBgPhotoUrl(p.url)}
                          className={`relative rounded-md overflow-hidden aspect-video border transition cursor-pointer group ${
                            isSelected
                              ? 'ring-2 ring-purple-400 border-transparent scale-98'
                              : 'border-[#27272a] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute inset-x-0 bottom-0 text-[8px] bg-black/70 text-white font-medium px-1 py-0.5 truncate text-left">
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 3: SOLID STUDIO COLORS */}
              {bgMode === 'color' && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Studio Color Palette
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { color: '#ffffff', name: 'Pure White' },
                      { color: '#f3f4f6', name: 'Studio Gray' },
                      { color: '#334155', name: 'Slate Gray' },
                      { color: '#18181b', name: 'Obsidian' },
                      { color: '#000000', name: 'Pitch Black' },
                      { color: '#2563eb', name: 'Electric Blue' },
                      { color: '#059669', name: 'Emerald' },
                      { color: '#f97316', name: 'Warm Orange' },
                      { color: '#ec4899', name: 'Soft Rose' },
                      { color: '#7c3aed', name: 'Vibrant Purple' },
                      { color: '#fef3c7', name: 'Warm Cream' },
                      { color: '#6ee7b7', name: 'Mint Green' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setBgColor(c.color)}
                        className={`w-full aspect-square rounded-lg border border-white/20 transition cursor-pointer flex items-center justify-center ${
                          bgColor === c.color ? 'ring-2 ring-purple-400 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      >
                        {bgColor === c.color && (
                          <Check className={`w-3 h-3 ${c.color === '#ffffff' || c.color === '#fef3c7' || c.color === '#6ee7b7' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-900 rounded-lg border border-[#27272a]">
                    <span className="text-[10px] text-zinc-400 font-medium">Custom Color</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-300">{bgColor}</span>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                        title="Pick custom color"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 4: BOKEH BLUR BACKDROP */}
              {bgMode === 'blur' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { radius: 0, label: 'No Blur' },
                      { radius: 8, label: 'Soft' },
                      { radius: 24, label: 'Portrait' },
                      { radius: 48, label: 'Cinematic' },
                    ].map((b) => (
                      <button
                        key={b.radius}
                        onClick={() => setBgBlurRadius(b.radius)}
                        className={`py-1 px-1 rounded text-[10px] font-semibold border transition cursor-pointer text-center ${
                          bgBlurRadius === b.radius
                            ? 'bg-purple-600/30 border-purple-400 text-white'
                            : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                      <span>Blur Radius</span>
                      <span className="font-mono text-white">{bgBlurRadius} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={bgBlurRadius}
                      onChange={(e) => setBgBlurRadius(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ERASE / RESTORE BRUSH */}
          {bgTab === 'erase_restore' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setBrushMode('erase')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    brushMode === 'erase'
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Erase BG</span>
                </button>
                <button
                  onClick={() => setBrushMode('restore')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    brushMode === 'restore'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Restore Subject</span>
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  <span>Brush Size</span>
                  <span className="font-mono text-white">{brushSize} px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  <span>Brush Softness & Feather</span>
                  <span className="font-mono text-white">{brushSoftness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brushSoftness}
                  onChange={(e) => setBrushSoftness(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-[#27272a] text-[10px] text-zinc-400 leading-relaxed">
                Tip: Use <span className="text-purple-300 font-bold">Erase</span> to clean up edge artifacts, or <span className="text-emerald-300 font-bold">Restore</span> to recover fine hair strands, jewelry, and clothing boundaries.
              </div>
            </div>
          )}

          {/* TAB 3: SHADOW EFFECTS */}
          {bgTab === 'shadow' && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Subject Depth & Cast Shadow
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: 'No Shadow' },
                  { id: 'drop', label: 'Drop Shadow' },
                  { id: 'floor', label: 'Floor Cast' },
                  { id: 'floating', label: 'Floating Depth' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setBgShadowType(s.id as any)}
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border text-left transition cursor-pointer ${
                      bgShadowType === s.id
                        ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                        : 'bg-zinc-900 border-[#27272a] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {bgShadowType !== 'none' && (
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                      <span>Shadow Opacity</span>
                      <span className="font-mono text-white">{bgShadowOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={bgShadowOpacity}
                      onChange={(e) => setBgShadowOpacity(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                      <span>Shadow Softness (Blur)</span>
                      <span className="font-mono text-white">{bgShadowBlur} px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={bgShadowBlur}
                      onChange={(e) => setBgShadowBlur(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Advanced Precision Settings */}
          <div className="pt-1 border-t border-[#27272a]">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center justify-between w-full py-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3" />
                <span>Advanced Edge Precision & Saliency</span>
              </div>
              {showAdvancedSettings ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showAdvancedSettings && (
              <div className="space-y-2.5 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    <span>Edge Sensitivity</span>
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

                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    <span>Edge Feathering</span>
                    <span className="font-mono text-white">{bgFeather} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={bgFeather}
                    onChange={(e) => setBgFeather(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <label className="flex items-center gap-2 p-2 bg-zinc-900/80 rounded border border-[#27272a] cursor-pointer hover:bg-zinc-800/80 transition">
                  <input
                    type="checkbox"
                    checked={protectSubject}
                    onChange={(e) => setProtectSubject(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Face & Subject Protection
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      Locks skin tones, hair strands, and core clothing contours.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons (Remove.bg Style) */}
          <div className="space-y-1.5 pt-2 border-t border-[#27272a]">
            {/* 1-Click High-Res Download (Transparent / With Background) */}
            <button
              onClick={handleDownloadTransparentCutout}
              disabled={isDownloadingCutout || isRemovingBg}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 tracking-wide transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-950/40"
            >
              {isDownloadingCutout ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing High-Res Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res PNG ({bgMode})</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              {/* Add Cutout as New Layer */}
              <button
                onClick={handleAddCutoutAsNewLayer}
                disabled={isRemovingBg}
                className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] hover:border-zinc-600 text-zinc-200 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                title="Creates a new isolated transparent layer in the project stack"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Add Cutout Layer</span>
              </button>

              {/* Bake to Current Layer */}
              <button
                onClick={handleApplyBgRemover}
                disabled={isRemovingBg}
                className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] hover:border-zinc-600 text-zinc-200 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isRemovingBg ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Bake to Layer</span>
              </button>
            </div>
          </div>
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
            Frequency-separation dermal algorithm softens wrinkles and spots while preserving natural skin pores and structure directly on canvas.
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
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-400 hover:text-white rounded text-xs font-mono transition cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleApplySkinRetouching}
              disabled={isSkinRetouching}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg"
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
            Performs intelligent dynamic range stretching, white-point recalibration, shadow detail recovery, and highlight roll-off compression directly on canvas.
          </p>

          <button
            onClick={handleApplyAutoEnhance}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 shadow-md cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply Smart Auto-Enhance to Layer</span>
          </button>
        </div>
      )}
    </div>
  );
};
