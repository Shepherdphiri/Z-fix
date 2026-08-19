import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AI_PRESET_FILTERS, SAMPLE_IMAGES, createDefaultAdjustments } from '../../data/presets';
import { Adjustments, HSLChannel } from '../../types';
import { EnhancementToolsPanel } from './EnhancementToolsPanel';
import {
  Sparkles,
  Sun,
  Sliders,
  Palette,
  Camera,
  RotateCcw,
  Zap,
  Wand2,
  Film,
  Maximize2,
} from 'lucide-react';

const HSL_COLORS: { key: keyof Adjustments['hsl']; name: string; bg: string }[] = [
  { key: 'red', name: 'Red', bg: 'bg-rose-500' },
  { key: 'orange', name: 'Orange', bg: 'bg-orange-500' },
  { key: 'yellow', name: 'Yellow', bg: 'bg-amber-400' },
  { key: 'green', name: 'Green', bg: 'bg-emerald-500' },
  { key: 'cyan', name: 'Cyan', bg: 'bg-cyan-400' },
  { key: 'blue', name: 'Blue', bg: 'bg-blue-500' },
  { key: 'purple', name: 'Purple', bg: 'bg-indigo-500' },
  { key: 'magenta', name: 'Magenta', bg: 'bg-fuchsia-500' },
];

export const AdjustmentsSidebar: React.FC = () => {
  const {
    activeLayer,
    updateActiveLayerAdjustments,
    applyPreset,
    aiAnalyzeAndGrade,
    aiStudioRelight,
    isAiProcessing,
    lastAiAnalysis,
    loadSampleImage,
    showToast,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'enhance' | 'ai' | 'tone' | 'color' | 'presets' | 'detail'>('enhance');
  const [selectedHslColor, setSelectedHslColor] = useState<keyof Adjustments['hsl']>('orange');

  if (!activeLayer) {
    return (
      <div className="w-80 bg-[#0c0c0e] border-l border-[#27272a] p-4 text-center text-zinc-500 text-xs flex items-center justify-center">
        Select a layer to adjust parameters
      </div>
    );
  }

  const adj = activeLayer.adjustments;

  const resetAllAdjustments = () => {
    updateActiveLayerAdjustments(createDefaultAdjustments());
    showToast('Reset all adjustments');
  };

  return (
    <div className="w-80 md:w-88 bg-[#0c0c0e] flex flex-col h-full select-none text-[#e4e4e7]">
      {/* Top Tab Switcher */}
      <div className="flex border-b border-[#27272a] bg-[#09090b] p-1 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('enhance')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'enhance'
              ? 'bg-[#18181b] text-emerald-400 font-bold border border-emerald-500/40 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Enhance: Noise Reduction, Upscaler, BG Remover, Skin Retouch"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Enhance</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'ai'
              ? 'bg-[#18181b] text-indigo-400 font-bold border border-[#27272a]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="AI Studio Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Pro</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'presets'
              ? 'bg-[#18181b] text-white font-bold border border-[#27272a]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Film LUTs"
        >
          <Film className="w-3.5 h-3.5" />
          <span>LUTs</span>
        </button>

        <button
          onClick={() => setActiveTab('tone')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'tone'
              ? 'bg-[#18181b] text-white font-bold border border-[#27272a]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Tone Dynamics"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Tone</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'color'
              ? 'bg-[#18181b] text-white font-bold border border-[#27272a]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Color Grading"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition flex items-center justify-center gap-1 ${
            activeTab === 'detail'
              ? 'bg-[#18181b] text-white font-bold border border-[#27272a]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="FX & Detail"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>FX</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* --- TAB: ENHANCEMENT TOOLS --- */}
        {activeTab === 'enhance' && <EnhancementToolsPanel />}
        {/* --- TAB: AI PRO --- */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {/* Gemini Auto-Grade */}
            <div className="p-3.5 bg-[#18181b] rounded border border-indigo-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">
                    Gemini Neural Auto-Grade
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black text-zinc-400 border border-[#27272a]">
                  MULTIMODAL
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Gemini evaluates dynamic range, highlight compression, and skin tones to compute balanced tonal curves.
              </p>

              <button
                onClick={aiAnalyzeAndGrade}
                disabled={isAiProcessing}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs flex items-center justify-center gap-2 uppercase tracking-wider transition active:scale-98 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAiProcessing ? 'Evaluating Scene...' : 'Auto-Grade Scene'}
              </button>

              {lastAiAnalysis && (
                <div className="mt-2 pt-2 border-t border-[#27272a] text-[11px] space-y-1">
                  <div className="text-indigo-300 font-semibold">
                    {lastAiAnalysis.sceneClassification}
                  </div>
                  <p className="text-zinc-400 text-[10px] italic">
                    "{lastAiAnalysis.lightingCritique}"
                  </p>
                </div>
              )}
            </div>

            {/* AI Studio Relight */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
                AI Studio Relight
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Rembrandt Key', desc: '45° Directional', icon: Sun },
                  { name: 'Cyberpunk Neon', desc: 'Indigo/Teal Rim', icon: Sparkles },
                  { name: 'Golden Hour Fill', desc: '3200K Ambient', icon: Palette },
                  { name: 'High-Key Studio', desc: 'Soft Shadowless', icon: Zap },
                ].map((style) => {
                  const IconComp = style.icon;
                  return (
                    <button
                      key={style.name}
                      onClick={() => aiStudioRelight(style.name)}
                      disabled={isAiProcessing}
                      className="p-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-indigo-500/50 rounded text-left transition group"
                    >
                      <div className="mb-1 text-indigo-400">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400">
                        {style.name}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 mt-0.5">{style.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample RAW Photos */}
            <div className="space-y-2 pt-2 border-t border-[#27272a]">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
                Sample Photography
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_IMAGES.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => loadSampleImage(sample.url, sample.title)}
                    className="relative rounded overflow-hidden border border-[#27272a] hover:border-white/30 cursor-pointer group aspect-[4/3] bg-black"
                  >
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-mono uppercase text-zinc-300 truncate">
                        {sample.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: FILM LUTS --- */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
              Film Stocks & Presets ({AI_PRESET_FILTERS.length})
            </span>

            <div className="space-y-2">
              {AI_PRESET_FILTERS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="p-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-indigo-500/50 rounded cursor-pointer transition flex items-center gap-3 group"
                >
                  <img
                    src={preset.thumbnailUrl}
                    alt={preset.name}
                    className="w-10 h-10 rounded object-cover border border-[#27272a] shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-400 truncate">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                      {preset.tag} • {preset.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: TONE & LIGHT --- */}
        {activeTab === 'tone' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                Adjustment Tools
              </span>
              <button
                onClick={resetAllAdjustments}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 uppercase tracking-wider font-mono"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Modular Tool Metric Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'exposure', label: 'Exposure', unit: 'EV', min: -100, max: 100 },
                { key: 'contrast', label: 'Contrast', unit: '%', min: -100, max: 100 },
                { key: 'highlights', label: 'Highlights', unit: '%', min: -100, max: 100 },
                { key: 'shadows', label: 'Shadows', unit: '%', min: -100, max: 100 },
                { key: 'whites', label: 'Whites', unit: '%', min: -100, max: 100 },
                { key: 'blacks', label: 'Blacks', unit: '%', min: -100, max: 100 },
              ].map((item) => {
                const val = (adj as any)[item.key] || 0;
                return (
                  <div key={item.key} className="bg-[#18181b] p-2.5 rounded border border-[#27272a]">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">{item.label}</p>
                      <span className="text-[9px] text-zinc-600 font-mono">{item.unit}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base font-mono font-bold text-white">
                        {val > 0 ? `+${val}` : val}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={val}
                      onChange={(e) =>
                        updateActiveLayerAdjustments({ [item.key]: Number(e.target.value) })
                      }
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: COLOR & HSL --- */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
              White Balance & Color
            </span>

            {/* White Balance Sliders */}
            <div className="space-y-3">
              <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Temperature</span>
                  <span className="text-xs font-mono text-white">
                    {adj.temperature > 0 ? `+${adj.temperature}` : adj.temperature} K
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adj.temperature}
                  onChange={(e) =>
                    updateActiveLayerAdjustments({ temperature: Number(e.target.value) })
                  }
                  className="w-full h-1 bg-gradient-to-r from-blue-500 via-zinc-700 to-amber-500 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="bg-[#18181b] p-3 rounded border border-[#27272a] space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Tint</span>
                  <span className="text-xs font-mono text-white">
                    {adj.tint > 0 ? `+${adj.tint}` : adj.tint}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adj.tint}
                  onChange={(e) => updateActiveLayerAdjustments({ tint: Number(e.target.value) })}
                  className="w-full h-1 bg-gradient-to-r from-emerald-500 via-zinc-700 to-fuchsia-500 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#18181b] p-2.5 rounded border border-[#27272a]">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Vibrance</p>
                  <span className="text-base font-mono font-bold text-white block mb-1.5">
                    {adj.vibrance > 0 ? `+${adj.vibrance}` : adj.vibrance}
                  </span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adj.vibrance}
                    onChange={(e) =>
                      updateActiveLayerAdjustments({ vibrance: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="bg-[#18181b] p-2.5 rounded border border-[#27272a]">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Saturation</p>
                  <span className="text-base font-mono font-bold text-white block mb-1.5">
                    {adj.saturation > 0 ? `+${adj.saturation}` : adj.saturation}
                  </span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adj.saturation}
                    onChange={(e) =>
                      updateActiveLayerAdjustments({ saturation: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* HSL Channels */}
            <div className="pt-2 border-t border-[#27272a] space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
                HSL Selective Color
              </span>

              <div className="flex items-center justify-between gap-1 p-1 bg-[#18181b] rounded border border-[#27272a]">
                {HSL_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setSelectedHslColor(c.key)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition ${c.bg} ${
                      selectedHslColor === c.key
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="space-y-2 pt-1">
                {['hue', 'saturation', 'luminance'].map((channel) => {
                  const currentHsl = adj.hsl[selectedHslColor] || {
                    hue: 0,
                    saturation: 0,
                    luminance: 0,
                  };
                  const val = (currentHsl as any)[channel] || 0;
                  return (
                    <div key={channel} className="bg-[#18181b] p-2.5 rounded border border-[#27272a]">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-1">
                        <span>
                          {selectedHslColor} {channel}
                        </span>
                        <span className="font-mono text-zinc-300">{val > 0 ? `+${val}` : val}</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={val}
                        onChange={(e) => {
                          const updatedChannel = {
                            ...currentHsl,
                            [channel]: Number(e.target.value),
                          };
                          updateActiveLayerAdjustments({
                            hsl: {
                              ...adj.hsl,
                              [selectedHslColor]: updatedChannel,
                            },
                          });
                        }}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: DETAIL & FX --- */}
        {activeTab === 'detail' && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
              Texture & Optics
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'sharpness', label: 'Sharpness', unit: '%', min: 0, max: 100 },
                { key: 'clarity', label: 'Clarity', unit: '%', min: -100, max: 100 },
                { key: 'vignette', label: 'Vignette', unit: '%', min: 0, max: 100 },
                { key: 'grain', label: 'Neural Grain', unit: '%', min: 0, max: 100 },
              ].map((item) => {
                const val = (adj as any)[item.key] || 0;
                return (
                  <div key={item.key} className="bg-[#18181b] p-2.5 rounded border border-[#27272a]">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">{item.label}</p>
                      <span className="text-[9px] text-zinc-600 font-mono">{item.unit}</span>
                    </div>
                    <span className="text-base font-mono font-bold text-white block mb-1.5">
                      {val > 0 ? `+${val}` : val}
                    </span>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={val}
                      onChange={(e) =>
                        updateActiveLayerAdjustments({ [item.key]: Number(e.target.value) })
                      }
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
