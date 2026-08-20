import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  X,
  FilePlus,
  Layers,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';

export const ImageImportModal: React.FC = () => {
  const {
    showImageImportModal,
    setShowImageImportModal,
    pendingImportFile,
    setPendingImportFile,
    openImageAsNewProject,
    addLayer,
    project,
    showToast,
  } = useStudio();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load preview when pending file changes
  React.useEffect(() => {
    if (pendingImportFile) {
      const url = URL.createObjectURL(pendingImportFile);
      setPreviewUrl(url);
      setProjectName(pendingImportFile.name.replace(/\.[^/.]+$/, ''));

      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setImageDimensions(null);
    }
  }, [pendingImportFile]);

  if (!showImageImportModal || !pendingImportFile) return null;

  const handleOpenAsNewProject = async () => {
    setIsProcessing(true);
    try {
      await openImageAsNewProject(pendingImportFile);
      setShowImageImportModal(false);
      setPendingImportFile(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to create new project from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAsLayer = () => {
    if (!previewUrl) return;
    setIsProcessing(true);
    try {
      addLayer('image', {
        name: pendingImportFile.name.replace(/\.[^/.]+$/, ''),
        url: previewUrl,
        width: imageDimensions?.width || 1200,
        height: imageDimensions?.height || 800,
      });
      showToast(`Added "${pendingImportFile.name}" as layer`);
      setShowImageImportModal(false);
      setPendingImportFile(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to add layer');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-indigo-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Import Image
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                Choose how you want to open and edit this photo
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setShowImageImportModal(false);
              setPendingImportFile(null);
            }}
            className="p-1 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview & Details Card */}
        <div className="flex items-center gap-4 p-3 bg-[#121214] border border-[#27272a] rounded-xl">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Import Preview"
              className="w-20 h-20 object-cover rounded-lg border border-[#27272a] shrink-0"
            />
          )}
          <div className="text-xs space-y-1 min-w-0 flex-1">
            <span className="font-bold text-white block truncate">{pendingImportFile.name}</span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span>{(pendingImportFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              <span>•</span>
              {imageDimensions ? (
                <span>
                  {imageDimensions.width} × {imageDimensions.height} px
                </span>
              ) : (
                <span>Loading dimensions...</span>
              )}
            </div>
          </div>
        </div>

        {/* Options Selection */}
        <div className="space-y-3">
          <button
            onClick={handleOpenAsNewProject}
            disabled={isProcessing}
            className="w-full p-4 bg-gradient-to-r from-indigo-950/60 to-indigo-900/30 hover:from-indigo-900/80 hover:to-indigo-800/40 border border-indigo-500/50 hover:border-indigo-400 rounded-xl text-left transition group cursor-pointer flex items-start gap-3.5 shadow-lg"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-sm mt-0.5">
              <FilePlus className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white">Open as New Project</h3>
                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-mono uppercase font-bold border border-indigo-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Creates a fresh project sized exactly to {imageDimensions ? `${imageDimensions.width}×${imageDimensions.height}` : 'this photo'} with its own dedicated layer stack and independent history.
              </p>
            </div>
          </button>

          <button
            onClick={handleAddAsLayer}
            disabled={isProcessing}
            className="w-full p-4 bg-[#121214] hover:bg-[#18181b] border border-[#27272a] hover:border-zinc-500 rounded-xl text-left transition group cursor-pointer flex items-start gap-3.5"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1e1e24] text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-white transition mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white">
                Add as Layer to Current Project
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Inserts the photo as a new overlay layer into "{project.title}" without resetting the existing canvas.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel footer */}
        <div className="flex justify-end pt-2 border-t border-[#27272a]">
          <button
            onClick={() => {
              setShowImageImportModal(false);
              setPendingImportFile(null);
            }}
            className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 rounded text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
