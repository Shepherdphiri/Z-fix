import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  X,
  Plus,
  Image as ImageIcon,
  Square,
  Smartphone,
  Monitor,
  Sparkles,
  Layers,
  Check,
  Upload,
} from 'lucide-react';

interface PresetSize {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  icon: React.ElementType;
  ratio: string;
}

const CANVAS_PRESETS: PresetSize[] = [
  { id: 'ig-square', name: 'Square Post', category: 'Social', width: 1080, height: 1080, icon: Square, ratio: '1:1' },
  { id: 'ig-portrait', name: 'Portrait Feed', category: 'Social', width: 1080, height: 1350, icon: Smartphone, ratio: '4:5' },
  { id: 'ig-story', name: 'Story / Reel', category: 'Mobile', width: 1080, height: 1920, icon: Smartphone, ratio: '9:16' },
  { id: 'yt-thumb', name: 'Landscape / YouTube', category: 'Social', width: 1920, height: 1080, icon: Monitor, ratio: '16:9' },
  { id: 'photo-std', name: 'Studio Photo HD', category: 'Photography', width: 1200, height: 800, icon: ImageIcon, ratio: '3:2' },
  { id: 'cinema-4k', name: 'Cinema 4K UHD', category: 'Film', width: 3840, height: 2160, icon: Monitor, ratio: '16:9' },
];

export const NewProjectModal: React.FC = () => {
  const { showNewProjectModal, setShowNewProjectModal, createNewProject, showToast } = useStudio();

  const [title, setTitle] = useState('Untitled Artwork');
  const [selectedPreset, setSelectedPreset] = useState<string>('photo-std');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'solid' | 'image'>('solid');
  const [fillColor, setFillColor] = useState('#09090b');
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string; width: number; height: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!showNewProjectModal) return null;

  const handleSelectPreset = (preset: PresetSize) => {
    setSelectedPreset(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setUploadedImage({
          file,
          preview,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setBackgroundType('image');
        if (title === 'Untitled Artwork' || !title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      img.src = preview;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createNewProject({
        title: title.trim() || 'Untitled Project',
        width: Math.max(100, Math.min(8192, width)),
        height: Math.max(100, Math.min(8192, height)),
        backgroundType,
        fillColor,
        imageFile: uploadedImage?.file,
        imageUrl: uploadedImage?.preview,
        initialImageName: uploadedImage?.file.name.replace(/\.[^/.]+$/, ''),
      });
      setShowNewProjectModal(false);
    } catch (err) {
      console.error(err);
      showToast('Error creating new project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Create New Project
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                Fresh isolated canvas with custom layer stack
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowNewProjectModal(false)}
            className="p-1 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Project Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Campaign Editorial"
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-indigo-500 rounded px-3 py-2 text-xs text-white outline-none font-medium"
            />
          </div>

          {/* Quick Preset Dimensions */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Canvas Presets & Aspect Ratios
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CANVAS_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id && width === preset.width && height === preset.height;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#18181b] border-[#27272a] hover:border-zinc-600 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">{preset.ratio}</span>
                    </div>
                    <span className="text-xs font-semibold block truncate">{preset.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {preset.width} × {preset.height} px
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Width & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Width (Pixels)
              </label>
              <input
                type="number"
                min={100}
                max={8192}
                value={width}
                onChange={(e) => {
                  setWidth(parseInt(e.target.value) || 1080);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-indigo-500 rounded px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Height (Pixels)
              </label>
              <input
                type="number"
                min={100}
                max={8192}
                value={height}
                onChange={(e) => {
                  setHeight(parseInt(e.target.value) || 1080);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-indigo-500 rounded px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* Background Canvas Mode */}
          <div className="space-y-2 pt-1 border-t border-[#27272a]">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
              Initial Base Layer
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBackgroundType('solid')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  backgroundType === 'solid'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Solid Color</span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundType('transparent')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  backgroundType === 'transparent'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Transparent</span>
              </button>

              <label
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  backgroundType === 'image'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Solid color picker if solid selected */}
            {backgroundType === 'solid' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#27272a] bg-transparent cursor-pointer"
                />
                <div className="flex gap-1.5">
                  {['#09090b', '#18181b', '#ffffff', '#312e81', '#0f172a', '#1e293b'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFillColor(hex)}
                      className={`w-6 h-6 rounded border transition cursor-pointer ${
                        fillColor === hex ? 'border-indigo-400 scale-110' : 'border-zinc-700'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 ml-auto uppercase">{fillColor}</span>
              </div>
            )}

            {/* Uploaded image preview */}
            {backgroundType === 'image' && uploadedImage && (
              <div className="flex items-center gap-3 p-2 bg-[#18181b] rounded border border-[#27272a] mt-2">
                <img src={uploadedImage.preview} alt="Uploaded" className="w-12 h-12 rounded object-cover border border-[#27272a]" />
                <div className="text-xs truncate flex-1">
                  <span className="font-semibold text-white block truncate">{uploadedImage.file.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {uploadedImage.width} × {uploadedImage.height} px
                  </span>
                </div>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setShowNewProjectModal(false)}
              className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 rounded text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Creating Project...' : 'Initialize Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
