import React, { useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { BlendMode } from '../../types';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Type,
  Paintbrush,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: 'Normal', value: 'source-over' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
];

export const LayerPanel: React.FC = () => {
  const {
    project,
    activeLayer,
    setActiveLayerId,
    updateLayer,
    addLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
  } = useStudio();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        addLayer('image', { name: file.name.replace(/\.[^/.]+$/, ''), url });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] select-none text-[#e4e4e7]">
      {/* Header & Add Layer Actions */}
      <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
          Layers ({project.layers.length})
        </span>

        {/* Add Layer Menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition border border-transparent hover:border-[#27272a]"
            title="Add Image Layer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <button
            onClick={() => addLayer('text')}
            className="p-1.5 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition border border-transparent hover:border-[#27272a]"
            title="Add Typography Layer"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addLayer('solid', { color: '#312e81' })}
            className="p-1.5 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition border border-transparent hover:border-[#27272a]"
            title="Add Color Fill Solid"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer Stack List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {[...project.layers].reverse().map((layer, reverseIndex) => {
          const actualIndex = project.layers.length - 1 - reverseIndex;
          const isActive = activeLayer?.id === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`p-2.5 rounded border transition cursor-pointer ${
                isActive
                  ? 'bg-[#1c1c1f] border-white/20 shadow-lg'
                  : 'bg-[#09090b] border-[#27272a] hover:bg-[#141417]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 truncate">
                  {/* Thumbnail / Type Indicator */}
                  {layer.type === 'image' && layer.imageUrl ? (
                    <img
                      src={layer.imageUrl}
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-[#27272a] shrink-0"
                    />
                  ) : layer.type === 'solid' ? (
                    <div
                      className="w-8 h-8 rounded border border-[#27272a] shrink-0"
                      style={{ backgroundColor: layer.fillColor }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-xs font-mono font-bold text-zinc-300 shrink-0">
                      T
                    </div>
                  )}

                  <div className="truncate">
                    <input
                      type="text"
                      value={layer.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                      className="bg-transparent text-xs font-semibold text-zinc-200 hover:bg-[#18181b] px-1 py-0.5 rounded border border-transparent focus:border-[#27272a] outline-none w-28 truncate"
                    />
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>{layer.type === 'image' ? 'Mask / Raw' : layer.type}</span>
                      <span>•</span>
                      <span>{layer.opacity}%</span>
                    </div>
                  </div>
                </div>

                {/* Layer Quick Toggles */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className={`p-1 rounded hover:bg-[#27272a] transition ${
                      layer.visible ? 'text-zinc-400 hover:text-white' : 'text-zinc-700'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { locked: !layer.locked });
                    }}
                    className={`p-1 rounded hover:bg-[#27272a] transition ${
                      layer.locked ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-400'
                    }`}
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Active Layer Expanded Controls */}
              {isActive && (
                <div
                  className="mt-2.5 pt-2.5 border-t border-[#27272a] space-y-2.5 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                      Blend Mode
                    </span>
                    <select
                      value={layer.blendMode}
                      onChange={(e) =>
                        updateLayer(layer.id, { blendMode: e.target.value as BlendMode })
                      }
                      className="bg-[#09090b] text-zinc-200 text-[11px] px-2 py-1 rounded border border-[#27272a] outline-none hover:border-zinc-700"
                    >
                      {BLEND_MODES.map((bm) => (
                        <option key={bm.value} value={bm.value}>
                          {bm.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-zinc-300">{layer.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Actions: Reorder, Duplicate, Delete */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveLayer(actualIndex, actualIndex + 1)}
                        disabled={actualIndex >= project.layers.length - 1}
                        className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white disabled:opacity-30"
                        title="Bring Forward"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveLayer(actualIndex, actualIndex - 1)}
                        disabled={actualIndex <= 0}
                        className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white disabled:opacity-30"
                        title="Send Backward"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicateLayer(layer.id)}
                        className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white transition"
                        title="Duplicate Layer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLayer(layer.id)}
                        className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-rose-400 transition"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
