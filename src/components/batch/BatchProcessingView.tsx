import React, { useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { AI_PRESET_FILTERS } from '../../data/presets';
import {
  Upload,
  Layers,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  FolderArchive,
  Image as ImageIcon,
} from 'lucide-react';

export const BatchProcessingView: React.FC = () => {
  const {
    batchItems,
    setBatchItems,
    addBatchFiles,
    removeBatchItem,
    processBatchQueue,
    isBatchProcessing,
    downloadBatchZip,
  } = useStudio();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('portra-400');
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>(
    'image/jpeg'
  );
  const [targetScale, setTargetScale] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = batchItems.filter((i) => i.status === 'completed').length;
  const progressPercent =
    batchItems.length > 0 ? Math.round((completedCount / batchItems.length) * 100) : 0;

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addBatchFiles(files);
  };

  const handleStartProcessing = () => {
    processBatchQueue(selectedPresetId);
  };

  return (
    <div className="flex-1 h-full bg-[#0a0a0b] flex flex-col overflow-y-auto select-none text-[#e4e4e7]">
      {/* Top Header */}
      <div className="p-4 md:p-6 border-b border-[#27272a] bg-[#09090b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white font-mono tracking-tight">
              HIGH-THROUGHPUT BATCH PROCESSOR
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-black text-indigo-400 border border-indigo-500/40 uppercase">
              GPU Accelerated
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Apply calibrated neural color grades, tone curves, and high-res exports to multi-image sets concurrently.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFilesSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-zinc-700 text-zinc-200 rounded text-xs font-semibold flex items-center gap-2 transition"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Add Images
          </button>

          <button
            onClick={handleStartProcessing}
            disabled={batchItems.length === 0 || isBatchProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-2 uppercase tracking-wider transition active:scale-95 disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isBatchProcessing ? 'Grading Set...' : 'Process All'}
          </button>

          <button
            onClick={downloadBatchZip}
            disabled={completedCount === 0 || isBatchProcessing}
            className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black rounded text-xs font-bold flex items-center gap-2 uppercase tracking-wider transition active:scale-95 disabled:opacity-40 shadow-sm"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            Export Zip
          </button>

          {batchItems.length > 0 && (
            <button
              onClick={() => setBatchItems([])}
              disabled={isBatchProcessing}
              className="p-2 hover:bg-[#18181b] text-zinc-500 hover:text-rose-400 rounded transition border border-transparent hover:border-[#27272a]"
              title="Clear Batch Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Processing Config Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#18181b] p-4 rounded-lg border border-[#27272a]">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Master Color Preset
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full bg-[#09090b] text-zinc-200 text-xs px-3 py-2 rounded border border-[#27272a] outline-none"
            >
              {AI_PRESET_FILTERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.tag})
                </option>
              ))}
            </select>
          </div>

          {/* Export Format */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Export Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="w-full bg-[#09090b] text-zinc-200 text-xs px-3 py-2 rounded border border-[#27272a] outline-none"
            >
              <option value="image/jpeg">JPEG (High Quality RGB)</option>
              <option value="image/png">PNG (Lossless 24-bit)</option>
              <option value="image/webp">WEBP (Modern Compressed)</option>
            </select>
          </div>

          {/* Scale Resolution */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Master Canvas Scale
            </label>
            <select
              value={targetScale}
              onChange={(e) => setTargetScale(Number(e.target.value))}
              className="w-full bg-[#09090b] text-zinc-200 text-xs px-3 py-2 rounded border border-[#27272a] outline-none font-mono"
            >
              <option value={1}>1.0x Native Resolution</option>
              <option value={2}>2.0x Retina Master</option>
              <option value={4}>4.0x Ultra-HD 4K Print</option>
            </select>
          </div>
        </div>

        {/* Global Progress Bar */}
        {batchItems.length > 0 && (
          <div className="bg-[#18181b] p-4 rounded-lg border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium font-mono">
                Batch Progress: {completedCount} / {batchItems.length} images completed
              </span>
              <span className="text-indigo-400 font-mono font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Image Grid / Queue */}
        {batchItems.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#27272a] hover:border-indigo-500/50 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#0c0c0e]/50 hover:bg-[#141417] transition group"
          >
            <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">
                Drop your raw image sets or click to browse
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Supports concurrent grading across RAW, JPEG, PNG, and WEBP
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {batchItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden flex flex-col group relative shadow-lg"
              >
                {/* Preview Image */}
                <div className="relative aspect-square bg-black overflow-hidden">
                  <img
                    src={item.processedUrl || item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2 right-2">
                    {item.status === 'completed' && (
                      <span className="p-1 rounded bg-black/80 text-emerald-400 border border-emerald-800 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="p-1 rounded bg-black/80 text-indigo-400 border border-indigo-800 flex items-center animate-spin">
                        <RotateCw className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="p-1 rounded bg-black/80 text-zinc-500 border border-[#27272a] flex items-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeBatchItem(item.id)}
                    className="absolute top-2 left-2 p-1 rounded bg-black/80 text-zinc-400 hover:text-rose-400 border border-[#27272a] opacity-0 group-hover:opacity-100 transition"
                    title="Remove from batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="p-2.5 text-xs font-mono">
                  <div className="font-semibold text-zinc-200 truncate font-sans text-[11px]">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                    <span className="uppercase">{item.outputFormat.replace('image/', '')}</span>
                    <span>{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
