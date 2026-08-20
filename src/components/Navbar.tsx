import React, { useState, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import {
  Sliders,
  CopyCheck,
  ShieldAlert,
  BarChart3,
  Undo2,
  Redo2,
  Check,
  Cloud,
  SplitSquareVertical,
  ChevronDown,
  User,
  LogOut,
  Layers,
  Lock,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  Edit3,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentMode,
    setCurrentMode,
    projects,
    project,
    setProject,
    openProject,
    createNewProject,
    setShowNewProjectModal,
    setShowProjectsModal,
    setPendingImportFile,
    setShowImageImportModal,
    undo,
    redo,
    canUndo,
    canRedo,
    splitCompare,
    setSplitCompare,
    isSyncing,
    lastSyncedAt,
    syncToCloud,
    currentUser,
    usersList,
    switchAccount,
    setShowAuthModal,
    setShowExportModal,
    batchItems,
    showToast,
  } = useStudio();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectQuickMenu, setShowProjectQuickMenu] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Set as pending and prompt user: "Open as New Project" or "Add as Layer"
      setPendingImportFile(file);
      setShowImageImportModal(true);
      // Reset input value
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-3 md:px-6 select-none z-30 shrink-0 text-[#e4e4e7]">
      {/* Brand & Project Switcher */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-bold tracking-tighter text-white font-serif italic">
            Z-FIX<span className="not-italic font-light opacity-50 font-sans text-xs ml-1 tracking-normal uppercase">Studio</span>
          </span>
        </div>

        {/* Project Selector & Management */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-[#27272a]">
          <div className="relative">
            <button
              onClick={() => setShowProjectQuickMenu(!showProjectQuickMenu)}
              className="flex items-center gap-2 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-zinc-600 rounded-lg px-2.5 py-1.5 transition text-left cursor-pointer max-w-[160px] sm:max-w-[200px]"
              title="Switch or manage projects"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate flex-1">
                <span className="text-xs font-semibold text-white truncate block">{project.title}</span>
                <span className="text-[9px] text-zinc-500 font-mono hidden sm:block">
                  {project.layers?.length || 1} {project.layers?.length === 1 ? 'layer' : 'layers'} • {project.width}×{project.height}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>

            {/* Quick Projects Popover */}
            {showProjectQuickMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectQuickMenu(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-[#0c0c0e] border border-[#27272a] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-[#e4e4e7]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                      Saved Projects ({projects.length})
                    </div>
                    <button
                      onClick={() => {
                        setShowProjectQuickMenu(false);
                        setShowProjectsModal(true);
                      }}
                      className="text-[10px] text-indigo-400 hover:underline font-semibold"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto mb-2 pr-1">
                    {projects.map((p) => {
                      const isCurrent = p.id === project.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            openProject(p.id);
                            setShowProjectQuickMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-950/40 border border-indigo-500/50 text-white'
                              : 'hover:bg-[#18181b] text-zinc-300 border border-transparent'
                          }`}
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="text-xs font-semibold block truncate">{p.title}</span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {p.width}×{p.height} • {p.layers?.length || 1} layers
                            </span>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#27272a] flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowProjectQuickMenu(false);
                        setShowNewProjectModal(true);
                      }}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Project</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* New Project Quick Button */}
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="p-1.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Create New Project (+)"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Center Navigation Switcher */}
      <nav className="hidden sm:flex items-center gap-5 text-xs md:text-sm font-medium">
        <button
          onClick={() => setCurrentMode('editor')}
          className={`transition-colors py-4 ${
            currentMode === 'editor'
              ? 'text-white border-b-2 border-white font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Editor
        </button>

        <button
          onClick={() => setCurrentMode('batch')}
          className={`transition-colors py-4 relative flex items-center gap-1.5 ${
            currentMode === 'batch'
              ? 'text-white border-b-2 border-white font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span>Batch</span>
          {batchItems.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] bg-[#18181b] border border-[#27272a] text-indigo-400 rounded-full font-mono font-bold">
              {batchItems.length}
            </span>
          )}
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setCurrentMode('analytics')}
            className={`transition-colors py-4 ${
              currentMode === 'analytics'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Analytics
          </button>
        )}
      </nav>

      {/* Right Controls & Tools */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Upload Image Button */}
        {currentMode === 'editor' && (
          <>
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] transition cursor-pointer shadow-sm active:scale-95"
              title="Upload new image to edit or open as new project"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Upload Image</span>
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadImageFile}
            />
          </>
        )}

        {/* Undo / Redo in Editor */}
        {currentMode === 'editor' && (
          <div className="hidden lg:flex items-center gap-0.5 bg-[#18181b] p-0.5 rounded border border-[#27272a]">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded text-xs transition ${
                canUndo ? 'text-zinc-300 hover:bg-[#27272a]' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded text-xs transition ${
                canRedo ? 'text-zinc-300 hover:bg-[#27272a]' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Split Comparison Toggle in Editor */}
        {currentMode === 'editor' && (
          <button
            onClick={() => setSplitCompare(!splitCompare)}
            className={`px-2.5 py-1.5 rounded text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 border transition ${
              splitCompare
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-white'
            }`}
            title="Toggle Before/After Split Comparison"
          >
            <SplitSquareVertical className="w-3 h-3" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        )}

        {/* Cloud Sync Status Indicator */}
        <button
          onClick={syncToCloud}
          disabled={isSyncing}
          className="hidden md:flex items-center gap-2 bg-[#18181b] hover:bg-[#222226] px-3 py-1.5 rounded-full border border-[#27272a] transition cursor-pointer"
          title={
            lastSyncedAt
              ? `Synced to Cloud at ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : 'Save & sync project changes to Cloud Store'
          }
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isSyncing
                ? 'bg-amber-400 animate-pulse'
                : project.syncStatus === 'synced'
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
            {isSyncing ? 'Syncing...' : 'Cloud Synced'}
          </span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
        >
          Export
        </button>

        {/* User Profile / Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-lg transition cursor-pointer"
          >
            <img
              src={
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
              }
              alt="Avatar"
              className="w-6 h-6 rounded object-cover"
            />
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {/* User Popover Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-[#0c0c0e] border border-[#27272a] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-[#e4e4e7]">
                <div className="pb-3 mb-2 border-b border-[#27272a]">
                  <div className="text-xs font-semibold text-white">{currentUser?.name}</div>
                  <div className="text-[11px] text-zinc-400 font-mono truncate">{currentUser?.email}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded bg-[#18181b] text-indigo-400 border border-[#27272a]">
                      {currentUser?.role}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      AI: {currentUser?.quotaUsed.aiCallsCount} ops
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1 px-1 font-bold">
                  Quick Switch Account
                </div>

                <div className="space-y-1 mb-2">
                  {usersList.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchAccount(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
                        currentUser?.id === u.id
                          ? 'bg-[#18181b] text-indigo-400 font-medium border border-[#27272a]'
                          : 'hover:bg-[#18181b] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img src={u.avatarUrl} className="w-4 h-4 rounded object-cover" alt="" />
                        <span className="truncate">{u.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase ml-2">{u.role}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#27272a] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowUserMenu(false);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    Account Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowUserMenu(false);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
