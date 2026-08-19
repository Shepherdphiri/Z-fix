import React, { useState } from 'react';
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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentMode,
    setCurrentMode,
    project,
    setProject,
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

  return (
    <header className="h-14 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-4 md:px-6 select-none z-30 shrink-0 text-[#e4e4e7]">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tighter text-white font-serif italic">
            Z-FIX<span className="not-italic font-light opacity-50 font-sans text-xs ml-1 tracking-normal uppercase">Studio</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#27272a]">
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
            className="bg-transparent hover:bg-[#18181b] focus:bg-[#18181b] text-zinc-300 text-xs px-2 py-1 rounded border border-transparent focus:border-[#27272a] outline-none w-44 truncate font-sans"
            title="Rename Project"
          />
          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
            {project.width} × {project.height}
          </span>
        </div>
      </div>

      {/* Center Navigation Switcher */}
      <nav className="flex items-center gap-5 text-xs md:text-sm font-medium">
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
            onClick={() => setCurrentMode('admin')}
            className={`transition-colors py-4 flex items-center gap-1.5 ${
              currentMode === 'admin'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Admin Authorized" />
          </button>
        )}

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
      </nav>

      {/* Right Controls & Tools */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo in Editor */}
        {currentMode === 'editor' && (
          <div className="hidden md:flex items-center gap-0.5 bg-[#18181b] p-0.5 rounded border border-[#27272a]">
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
          className="hidden sm:flex items-center gap-2 bg-[#18181b] hover:bg-[#222226] px-3 py-1.5 rounded-full border border-[#27272a] transition cursor-pointer"
          title={
            lastSyncedAt
              ? `Synced with PostgreSQL at ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : 'Sync changes to PostgreSQL Cloud Store'
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
            {isSyncing ? 'Syncing...' : 'DB: PostgreSQL'}
          </span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition active:scale-95 shadow-sm"
        >
          Export
        </button>

        {/* User Profile / Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-lg transition"
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
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition ${
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
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <User className="w-3.5 h-3.5" />
                    OAuth 2.0 Auth
                  </button>

                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowUserMenu(false);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Manage
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
