import React, { Component, ReactNode, ErrorInfo, useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { Navbar } from './components/Navbar';
import { StudioCanvas } from './components/canvas/StudioCanvas';
import { LayerPanel } from './components/sidebar/LayerPanel';
import { AdjustmentsSidebar } from './components/sidebar/AdjustmentsSidebar';
import { BatchProcessingView } from './components/batch/BatchProcessingView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AnalyticsDashboardView } from './components/analytics/AnalyticsDashboardView';
import { ExportModal } from './components/modals/ExportModal';
import { AuthModal } from './components/modals/AuthModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { ProjectsManagerModal } from './components/modals/ProjectsManagerModal';
import { ImageImportModal } from './components/modals/ImageImportModal';
import { Layers, Sliders, CheckCircle2, Shield, Lock } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center text-[#e4e4e7] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <span className="font-mono font-bold text-lg">Z</span>
          </div>
          <h1 className="text-base font-bold font-mono text-white">Z-FIX STUDIO INITIALIZATION</h1>
          <p className="text-xs text-zinc-400 max-w-md">
            {this.state.error?.message || 'A workspace visual pipeline error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold font-mono uppercase tracking-wider"
          >
            Reload Studio Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const StudioMain: React.FC = () => {
  const {
    currentMode,
    setCurrentMode,
    toastMessage,
    batchItems,
    currentUser,
    project,
    setShowAuthModal,
    showToast,
  } = useStudio();
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'layers' | 'adjustments'>('none');

  const pendingBatchCount = batchItems.filter((i) => i.status !== 'completed').length;
  const storageUsedMB = currentUser?.quotaUsed.storageUsedMB || 4280;
  const storageMaxMB = currentUser?.permissions.maxStorageMB || 50000;

  const handleAdminButtonClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('Admin authentication required. Sign in with administrative credentials.');
      return;
    }
    if (currentUser.role !== 'admin') {
      setShowAuthModal(true);
      showToast(`Current account is '${currentUser.role}'. Admin role required.`);
      return;
    }
    setCurrentMode('admin');
    showToast('Switched to Admin Oversight Console');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0b] overflow-hidden text-[#e4e4e7] font-sans antialiased select-none">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentMode === 'editor' && (
          <>
            {/* Desktop Left Sidebar: Layers */}
            <aside className="hidden md:block w-72 h-full shrink-0 border-r border-[#27272a] bg-[#0c0c0e]">
              <LayerPanel />
            </aside>

            {/* Center Canvas Workspace */}
            <div className="flex-1 min-w-0 min-h-0 h-full relative flex flex-col bg-[#121214] overflow-hidden">
              <StudioCanvas />

              {/* Mobile Drawer Floating Action Bar */}
              <div className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#18181b]/90 border border-[#27272a] p-1 rounded-xl shadow-2xl backdrop-blur-md">
                <button
                  onClick={() =>
                    setMobileDrawer((prev) => (prev === 'layers' ? 'none' : 'layers'))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    mobileDrawer === 'layers'
                      ? 'bg-white text-black font-bold'
                      : 'text-zinc-400 hover:bg-[#27272a]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Layers
                </button>
                <button
                  onClick={() =>
                    setMobileDrawer((prev) => (prev === 'adjustments' ? 'none' : 'adjustments'))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    mobileDrawer === 'adjustments'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-zinc-400 hover:bg-[#27272a]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  AI & Adjust
                </button>
              </div>

              {/* Mobile Layer Drawer */}
              {mobileDrawer === 'layers' && (
                <div className="md:hidden absolute inset-y-0 left-0 w-80 bg-[#0c0c0e] z-40 shadow-2xl border-r border-[#27272a] animate-in slide-in-from-left duration-200">
                  <div className="flex justify-end p-2 border-b border-[#27272a]">
                    <button
                      onClick={() => setMobileDrawer('none')}
                      className="text-xs text-zinc-400 hover:text-white px-2 py-1 uppercase tracking-widest font-mono"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="h-[calc(100%-40px)]">
                    <LayerPanel />
                  </div>
                </div>
              )}

              {/* Mobile Adjustments Drawer */}
              {mobileDrawer === 'adjustments' && (
                <div className="md:hidden absolute inset-y-0 right-0 w-80 bg-[#0c0c0e] z-40 shadow-2xl border-l border-[#27272a] animate-in slide-in-from-right duration-200">
                  <div className="flex justify-start p-2 border-b border-[#27272a]">
                    <button
                      onClick={() => setMobileDrawer('none')}
                      className="text-xs text-zinc-400 hover:text-white px-2 py-1 uppercase tracking-widest font-mono"
                    >
                      ✕ Close Adjustments
                    </button>
                  </div>
                  <div className="h-[calc(100%-40px)]">
                    <AdjustmentsSidebar />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Right Sidebar: Adjustments & AI Grading */}
            <aside className="hidden md:block w-80 lg:w-88 h-full shrink-0 border-l border-[#27272a] bg-[#0c0c0e] overflow-hidden">
              <AdjustmentsSidebar />
            </aside>
          </>
        )}

        {currentMode === 'batch' && <BatchProcessingView />}
        {currentMode === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboardView />
          ) : (
            <div className="flex-1 h-full bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold font-mono uppercase tracking-widest text-white">
                Admin Console Restricted
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm">
                The administrative dashboard is strictly confidential and only visible to authorized administrator accounts.
              </p>
              <button
                onClick={() => setCurrentMode('editor')}
                className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded text-xs font-mono font-bold uppercase tracking-wider border border-[#27272a]"
              >
                Return to Editor
              </button>
            </div>
          )
        )}
        {currentMode === 'analytics' && (
          currentUser?.role === 'admin' ? (
            <AnalyticsDashboardView />
          ) : (
            <div className="flex-1 h-full bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold font-mono uppercase tracking-widest text-white">
                Analytics Restricted
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm">
                System telemetry and analytics dashboards are restricted to authorized administrators.
              </p>
              <button
                onClick={() => setCurrentMode('editor')}
                className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-white rounded text-xs font-mono font-bold uppercase tracking-wider border border-[#27272a]"
              >
                Return to Editor
              </button>
            </div>
          )
        )}
      </main>

      {/* Sophisticated Dark Bottom Status Bar Footer with Developer Credit & Admin Shield Button */}
      <footer className="h-9 bg-black border-t border-[#27272a] px-3 md:px-6 flex items-center justify-between text-[10px] text-zinc-500 shrink-0 font-mono select-none">
        {/* Left Side: Batch Status & Storage */}
        <div className="flex items-center gap-3 md:gap-5">
          <span className="uppercase tracking-widest font-bold text-indigo-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
            Batch: {pendingBatchCount > 0 ? `${pendingBatchCount} pending` : 'Ready'}
          </span>
          <span className="hidden lg:inline text-zinc-500">
            Storage: {(storageUsedMB / 1024).toFixed(1)}GB
          </span>
          <span className="hidden sm:inline text-emerald-500 font-semibold">PostgreSQL: Active</span>
        </div>

        {/* Center: Developer Credit */}
        <div className="flex items-center gap-1.5 text-zinc-400 tracking-wide font-sans text-[11px] font-medium">
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">developed by</span>
          <span className="text-white font-bold tracking-wider font-mono uppercase bg-zinc-900/90 px-2 py-0.5 rounded border border-[#27272a] text-[10px] shadow-sm">
            SHEPHERD ZISPER PHIRI
          </span>
          <span className="text-zinc-600">|</span>
        </div>

        {/* Right Side: Admin Button with Shield Icon (ONLY visible to Admin) */}
        <div className="flex items-center gap-3 md:gap-4">
          {currentUser?.role === 'admin' ? (
            <button
              onClick={handleAdminButtonClick}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                currentMode === 'admin'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                  : 'bg-[#18181b] hover:bg-[#222226] text-zinc-300 border-[#27272a] hover:border-indigo-500/50 hover:text-white'
              }`}
              title="Access Admin Oversight Console"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block ml-0.5" title="Admin Authorized" />
            </button>
          ) : (
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:inline">
              Z-FIX Engine 4K
            </span>
          )}
        </div>
      </footer>

      {/* Global Modals */}
      <ExportModal />
      <AuthModal />
      <NewProjectModal />
      <ProjectsManagerModal />
      <ImageImportModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 right-5 z-50 bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StudioProvider>
        <StudioMain />
      </StudioProvider>
    </ErrorBoundary>
  );
}
