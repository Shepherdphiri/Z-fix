import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { exportProjectImage } from '../../utils/canvasRenderer';
import { X, Download } from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { project, showExportModal, setShowExportModal, showToast } = useStudio();

  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  if (!showExportModal) return null;

  const targetWidth = Math.round(project.width * scale);
  const targetHeight = Math.round(project.height * scale);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportProjectImage(project, format, quality, scale);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const cleanTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.href = url;
      link.download = `${cleanTitle}_${targetWidth}x${targetHeight}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${targetWidth}×${targetHeight} ${ext.toUpperCase()}`);
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                EXPORT MASTER CANVAS
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">Full-resolution studio render</span>
            </div>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-1 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resolution Scaler */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            Master Resolution Scale
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '1x Native', value: 1, desc: `${project.width} × ${project.height}` },
              { label: '2x Retina', value: 2, desc: `${project.width * 2} × ${project.height * 2}` },
              { label: '4K Ultra', value: 4, desc: `${project.width * 4} × ${project.height * 4}` },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setScale(s.value)}
                className={`p-2.5 rounded border text-left transition ${
                  scale === s.value
                    ? 'bg-[#18181b] border-white text-white font-bold'
                    : 'bg-[#18181b]/50 border-[#27272a] hover:bg-[#18181b] text-zinc-400'
                }`}
              >
                <div className="text-xs">{s.label}</div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            File Format
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'JPEG', value: 'image/jpeg', sub: 'Standard RGB' },
              { label: 'PNG', value: 'image/png', sub: 'Lossless' },
              { label: 'WEBP', value: 'image/webp', sub: 'Modern Web' },
            ].map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setFormat(fmt.value as any)}
                className={`p-2 rounded border text-center transition ${
                  format === fmt.value
                    ? 'bg-[#18181b] border-white text-white font-bold'
                    : 'bg-[#18181b]/50 border-[#27272a] text-zinc-400'
                }`}
              >
                <div className="text-xs font-mono">{fmt.label}</div>
                <div className="text-[9px] text-zinc-500">{fmt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider if JPEG or WEBP */}
        {format !== 'image/png' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Encoding Quality</span>
              <span className="font-mono text-white">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-white"
            />
          </div>
        )}

        {/* Output Info */}
        <div className="p-3 bg-[#18181b] rounded border border-[#27272a] flex items-center justify-between text-xs font-mono text-zinc-400">
          <div>
            Output Canvas:{' '}
            <span className="text-white font-bold">
              {targetWidth} × {targetHeight} px
            </span>
          </div>
          <div>
            Layers: <span className="text-indigo-400 font-bold">{project.layers.length}</span>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 shadow-sm"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          {isExporting ? 'Rendering Multi-Layer Composites...' : 'Export High-Resolution Image'}
        </button>
      </div>
    </div>
  );
};
