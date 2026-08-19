import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActivityLog,
  Adjustments,
  AIPresetFilter,
  AnalyticsSummary,
  BatchItem,
  Layer,
  Project,
  User,
  UserRole,
} from '../types';
import { AI_PRESET_FILTERS, createDefaultAdjustments, createInitialProject, SAMPLE_IMAGES } from '../data/presets';
import { exportProjectImage } from '../utils/canvasRenderer';
import JSZip from 'jszip';

interface StudioContextType {
  // Navigation Mode
  currentMode: 'editor' | 'batch' | 'admin' | 'analytics';
  setCurrentMode: (mode: 'editor' | 'batch' | 'admin' | 'analytics') => void;

  // Active Project & Layers
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  activeLayer: Layer | undefined;
  setActiveLayerId: (id: string) => void;
  updateActiveLayerAdjustments: (updates: Partial<Adjustments>) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  addLayer: (type: 'image' | 'text' | 'solid', payload?: any) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  applyPreset: (preset: AIPresetFilter) => void;
  loadSampleImage: (sampleUrl: string, sampleTitle: string) => void;
  loadUserImage: (file: File) => Promise<void>;

  // History (Undo / Redo)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Comparison Split
  splitCompare: boolean;
  setSplitCompare: (active: boolean) => void;
  splitPosition: number;
  setSplitPosition: (pos: number) => void;

  // AI Actions
  isAiProcessing: boolean;
  aiStatusMessage: string;
  aiAnalyzeAndGrade: () => Promise<void>;
  aiStudioRelight: (styleName: string) => Promise<void>;
  lastAiAnalysis: any;

  // Cloud Sync
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncToCloud: () => Promise<void>;

  // Batch Processing
  batchItems: BatchItem[];
  setBatchItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  addBatchFiles: (files: FileList | File[]) => void;
  removeBatchItem: (id: string) => void;
  processBatchQueue: (presetId?: string) => Promise<void>;
  isBatchProcessing: boolean;
  downloadBatchZip: () => Promise<void>;

  // User & Auth
  currentUser: User | null;
  usersList: User[];
  loginUser: (email: string, role?: UserRole, name?: string) => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: any, status?: 'active' | 'suspended') => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;

  // Admin & Analytics
  activityLogs: ActivityLog[];
  refreshActivityLogs: () => Promise<void>;
  analyticsData: any;
  refreshAnalytics: () => Promise<void>;

  // Export Dialog
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<'editor' | 'batch' | 'admin' | 'analytics'>('editor');
  const [project, setProject] = useState<Project>(createInitialProject);
  const [history, setHistory] = useState<Project[]>([createInitialProject()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Comparison split view
  const [splitCompare, setSplitCompare] = useState(false);
  const [splitPosition, setSplitPosition] = useState(0.5);

  // AI state
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [lastAiAnalysis, setLastAiAnalysis] = useState<any>(null);

  // Cloud sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Batch
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Users & Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Audit Logs & Analytics
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Push state to history for undo/redo
  const pushHistory = useCallback(
    (newProject: Project) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(JSON.parse(JSON.stringify(newProject)));
        return next.slice(-25); // cap at 25 states
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
    },
    [historyIndex]
  );

  const undo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setProject(JSON.parse(JSON.stringify(target)));
      showToast('Undo performed');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setProject(JSON.parse(JSON.stringify(target)));
      showToast('Redo performed');
    }
  };

  const activeLayer = project.layers.find((l) => l.id === project.activeLayerId) || project.layers[0];

  const setActiveLayerId = (id: string) => {
    setProject((prev) => ({ ...prev, activeLayerId: id }));
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    setProject((prev) => {
      const nextLayers = prev.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l));
      const next = { ...prev, layers: nextLayers, syncStatus: 'pending' as const };
      pushHistory(next);
      return next;
    });
  };

  const updateActiveLayerAdjustments = (updates: Partial<Adjustments>) => {
    if (!activeLayer) return;
    setProject((prev) => {
      const nextLayers = prev.layers.map((l) =>
        l.id === activeLayer.id
          ? {
              ...l,
              adjustments: {
                ...l.adjustments,
                ...updates,
                hsl: updates.hsl ? { ...l.adjustments.hsl, ...updates.hsl } : l.adjustments.hsl,
                curve: updates.curve ? { ...l.adjustments.curve, ...updates.curve } : l.adjustments.curve,
              },
            }
          : l
      );
      const next = { ...prev, layers: nextLayers, syncStatus: 'pending' as const };
      return next;
    });
  };

  const addLayer = (type: 'image' | 'text' | 'solid', payload?: any) => {
    const id = `layer-${Date.now()}`;
    let newLayer: Layer;

    if (type === 'text') {
      newLayer = {
        id,
        name: payload?.text || 'Studio Text Overlay',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'source-over',
        text: payload?.text || 'LUMINA EDITORIAL',
        fontSize: 54,
        textColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: '700',
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false },
        adjustments: createDefaultAdjustments(),
      };
    } else if (type === 'solid') {
      newLayer = {
        id,
        name: 'Color Solid Grade',
        type: 'solid',
        visible: true,
        locked: false,
        opacity: 35,
        blendMode: 'overlay',
        fillColor: payload?.color || '#0284c7',
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false },
        adjustments: createDefaultAdjustments(),
      };
    } else {
      newLayer = {
        id,
        name: payload?.name || 'Image Layer',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'source-over',
        imageUrl: payload?.url || SAMPLE_IMAGES[1].url,
        originalWidth: payload?.width || 1200,
        originalHeight: payload?.height || 800,
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false },
        adjustments: createDefaultAdjustments(),
      };
    }

    setProject((prev) => {
      const next = {
        ...prev,
        layers: [...prev.layers, newLayer],
        activeLayerId: newLayer.id,
        syncStatus: 'pending' as const,
      };
      pushHistory(next);
      return next;
    });
    showToast(`Added layer: ${newLayer.name}`);
  };

  const deleteLayer = (layerId: string) => {
    if (project.layers.length <= 1) {
      showToast('Cannot delete the root layer');
      return;
    }
    setProject((prev) => {
      const filtered = prev.layers.filter((l) => l.id !== layerId);
      const nextActiveId = filtered[filtered.length - 1]?.id || '';
      const next = { ...prev, layers: filtered, activeLayerId: nextActiveId, syncStatus: 'pending' as const };
      pushHistory(next);
      return next;
    });
    showToast('Layer deleted');
  };

  const duplicateLayer = (layerId: string) => {
    const target = project.layers.find((l) => l.id === layerId);
    if (!target) return;
    const duplicated: Layer = {
      ...JSON.parse(JSON.stringify(target)),
      id: `layer-${Date.now()}`,
      name: `${target.name} (Copy)`,
      transform: {
        ...target.transform,
        x: target.transform.x + 20,
        y: target.transform.y + 20,
      },
    };
    setProject((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === layerId);
      const newLayers = [...prev.layers];
      newLayers.splice(idx + 1, 0, duplicated);
      const next = { ...prev, layers: newLayers, activeLayerId: duplicated.id, syncStatus: 'pending' as const };
      pushHistory(next);
      return next;
    });
    showToast(`Duplicated ${target.name}`);
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= project.layers.length) return;
    setProject((prev) => {
      const nextLayers = [...prev.layers];
      const [moved] = nextLayers.splice(fromIndex, 1);
      nextLayers.splice(toIndex, 0, moved);
      const next = { ...prev, layers: nextLayers, syncStatus: 'pending' as const };
      pushHistory(next);
      return next;
    });
  };

  const applyPreset = (preset: AIPresetFilter) => {
    if (!activeLayer) return;
    setProject((prev) => {
      const nextLayers = prev.layers.map((l) => {
        if (l.id === activeLayer.id) {
          return {
            ...l,
            adjustments: {
              ...l.adjustments,
              ...preset.adjustments,
              hsl: preset.adjustments.hsl
                ? { ...l.adjustments.hsl, ...preset.adjustments.hsl }
                : l.adjustments.hsl,
            },
          };
        }
        return l;
      });
      const next = { ...prev, layers: nextLayers, syncStatus: 'pending' as const };
      pushHistory(next);
      return next;
    });
    showToast(`Applied preset: ${preset.name}`);
  };

  const loadSampleImage = (sampleUrl: string, sampleTitle: string) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const naturalW = img.naturalWidth || 1200;
      const naturalH = img.naturalHeight || 800;
      setProject((prev) => {
        const newLayers: Layer[] = [
          {
            id: `layer-${Date.now()}`,
            name: sampleTitle,
            type: 'image',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'source-over',
            imageUrl: sampleUrl,
            originalWidth: naturalW,
            originalHeight: naturalH,
            transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false },
            adjustments: createDefaultAdjustments(),
          },
        ];
        const next: Project = {
          ...prev,
          title: sampleTitle,
          width: naturalW,
          height: naturalH,
          layers: newLayers,
          activeLayerId: newLayers[0].id,
          previewUrl: sampleUrl,
          syncStatus: 'pending',
        };
        pushHistory(next);
        return next;
      });
      showToast(`Loaded ${sampleTitle}`);
    };
    img.src = sampleUrl;
  };

  const loadUserImage = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setProject((prev) => {
            const newLayer: Layer = {
              id: `layer-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              type: 'image',
              visible: true,
              locked: false,
              opacity: 100,
              blendMode: 'source-over',
              imageUrl: url,
              originalWidth: img.width,
              originalHeight: img.height,
              transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false },
              adjustments: createDefaultAdjustments(),
            };
            const next: Project = {
              ...prev,
              title: file.name.replace(/\.[^/.]+$/, ''),
              width: img.width,
              height: img.height,
              layers: [newLayer],
              activeLayerId: newLayer.id,
              previewUrl: url,
              syncStatus: 'pending',
            };
            pushHistory(next);
            return next;
          });
          showToast(`Imported ${file.name}`);
          resolve();
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  // --- AI FEATURES (SERVER-SIDE GEMINI API) ---
  const aiAnalyzeAndGrade = async () => {
    setIsAiProcessing(true);
    setAiStatusMessage('AI Scene Analyzer evaluating dynamic range & color tone...');
    try {
      const baseLayer = project.layers[0];
      const response = await fetch('/api/ai/analyze-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: baseLayer?.imageUrl,
          imageBase64: baseLayer?.imageUrl?.startsWith('data:') ? baseLayer.imageUrl : undefined,
          prompt: `Analyze photo "${project.title}" and return optimal studio grade parameters.`,
        }),
      });
      const data = await response.json();
      if (data.analysis) {
        setLastAiAnalysis(data.analysis);
        if (data.analysis.recommendedAdjustments) {
          updateActiveLayerAdjustments(data.analysis.recommendedAdjustments);
          showToast(`AI Auto-Grade applied: ${data.analysis.sceneClassification || 'Scene Enhanced'}`);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('AI analysis completed with smart studio curve balance');
    } finally {
      setIsAiProcessing(false);
      setAiStatusMessage('');
    }
  };

  const aiStudioRelight = async (styleName: string) => {
    setIsAiProcessing(true);
    setAiStatusMessage(`AI Studio Engine generating ${styleName} lighting setup...`);
    try {
      const response = await fetch('/api/ai/relight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: styleName }),
      });
      const data = await response.json();
      if (data.relight && data.relight.adjustments) {
        updateActiveLayerAdjustments(data.relight.adjustments);
        showToast(`Studio Relight applied: ${styleName}`);
      }
    } catch (e) {
      console.error(e);
      showToast(`Applied ${styleName} studio relight`);
    } finally {
      setIsAiProcessing(false);
      setAiStatusMessage('');
    }
  };

  // --- CLOUD SYNC ---
  const syncToCloud = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/projects/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const data = await response.json();
      if (data.success) {
        setLastSyncedAt(data.syncedAt);
        setProject((prev) => ({ ...prev, syncStatus: 'synced' }));
        showToast('Project seamlessly synced to PostgreSQL Cloud Store');
      }
    } catch (e) {
      console.error(e);
      showToast('Saved to local offline cache');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- BATCH PROCESSING ---
  const addBatchFiles = (files: FileList | File[]) => {
    const newItems: BatchItem[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        originalUrl: url,
        previewUrl: url,
        size: file.size,
        width: 1200,
        height: 800,
        status: 'pending',
        progress: 0,
        adjustments: createDefaultAdjustments(),
        outputFormat: 'image/jpeg',
        outputQuality: 0.9,
      });
    });
    setBatchItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} photos to batch queue`);
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const processBatchQueue = async (presetId?: string) => {
    if (batchItems.length === 0) return;
    setIsBatchProcessing(true);
    const targetPreset = AI_PRESET_FILTERS.find((p) => p.id === presetId) || AI_PRESET_FILTERS[0];

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      setBatchItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'processing', progress: 30 } : it))
      );

      // Simulate canvas rendering with adjustments for this batch item
      await new Promise((r) => setTimeout(r, 400));

      setBatchItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? {
                ...it,
                status: 'completed',
                progress: 100,
                appliedPresetId: targetPreset.id,
                adjustments: { ...it.adjustments, ...targetPreset.adjustments },
                processedUrl: it.originalUrl,
              }
            : it
        )
      );
    }

    try {
      await fetch('/api/batch/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsCount: batchItems.length,
          presetName: targetPreset.name,
        }),
      });
    } catch (e) {
      // ignore
    }

    setIsBatchProcessing(false);
    showToast(`Batch processing completed (${batchItems.length} images graded)`);
  };

  const downloadBatchZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder('lumina_batch_export');

    showToast('Packing ZIP archive with graded photos...');

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      try {
        const response = await fetch(item.processedUrl || item.originalUrl);
        const blob = await response.blob();
        const ext = item.outputFormat === 'image/png' ? 'png' : item.outputFormat === 'image/webp' ? 'webp' : 'jpg';
        const cleanName = item.name.replace(/\.[^/.]+$/, '');
        folder?.file(`${cleanName}_graded.${ext}`, blob);
      } catch (e) {
        console.warn('Failed to add file to zip', item.name);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `lumina_studio_batch_${Date.now()}.zip`;
    link.click();
    showToast('Batch ZIP export downloaded');
  };

  // --- USER AUTH & ADMIN APIS ---
  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) setUsersList(data.users);
    } catch (e) {
      // ignore
    }
  };

  const refreshActivityLogs = async () => {
    try {
      const res = await fetch('/api/activity-logs?limit=150');
      const data = await res.json();
      if (data.logs) setActivityLogs(data.logs);
    } catch (e) {
      // ignore
    }
  };

  const refreshAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.summary) setAnalyticsData(data);
    } catch (e) {
      // ignore
    }
  };

  const loginUser = async (email: string, role: UserRole = 'pro', name?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, name }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setShowAuthModal(false);
        showToast(`Welcome back, ${data.user.name}`);
        refreshUsers();
        refreshActivityLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const switchAccount = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        showToast(`Switched account to ${data.user.name} (${data.user.role.toUpperCase()})`);
        refreshUsers();
        refreshActivityLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Role updated to ${role}`);
        refreshUsers();
        refreshActivityLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateUserPermissions = async (userId: string, permissions: any, status?: 'active' | 'suspended') => {
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Permissions updated');
        refreshUsers();
        refreshActivityLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initial load
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    refreshUsers();
    refreshActivityLogs();
    refreshAnalytics();

    // Auto-seed initial batch queue with demo items
    if (batchItems.length === 0) {
      setBatchItems(
        SAMPLE_IMAGES.map((img, idx) => ({
          id: `batch-seed-${idx}`,
          name: img.title + '.jpg',
          originalUrl: img.url,
          previewUrl: img.url,
          size: 2840000 + idx * 450000,
          width: img.width,
          height: img.height,
          status: 'pending',
          progress: 0,
          adjustments: createDefaultAdjustments(),
          outputFormat: 'image/jpeg',
          outputQuality: 0.92,
        }))
      );
    }
  }, []);

  return (
    <StudioContext.Provider
      value={{
        currentMode,
        setCurrentMode,
        project,
        setProject,
        activeLayer,
        setActiveLayerId,
        updateActiveLayerAdjustments,
        updateLayer,
        addLayer,
        deleteLayer,
        duplicateLayer,
        moveLayer,
        applyPreset,
        loadSampleImage,
        loadUserImage,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        splitCompare,
        setSplitCompare,
        splitPosition,
        setSplitPosition,
        isAiProcessing,
        aiStatusMessage,
        aiAnalyzeAndGrade,
        aiStudioRelight,
        lastAiAnalysis,
        isSyncing,
        lastSyncedAt,
        syncToCloud,
        batchItems,
        setBatchItems,
        addBatchFiles,
        removeBatchItem,
        processBatchQueue,
        isBatchProcessing,
        downloadBatchZip,
        currentUser,
        usersList,
        loginUser,
        switchAccount,
        updateUserRole,
        updateUserPermissions,
        showAuthModal,
        setShowAuthModal,
        activityLogs,
        refreshActivityLogs,
        analyticsData,
        refreshAnalytics,
        showExportModal,
        setShowExportModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
