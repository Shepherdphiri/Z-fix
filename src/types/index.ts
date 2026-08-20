export type LayerType = 'image' | 'adjustment' | 'text' | 'shape' | 'solid';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface HSLChannel {
  hue: number;        // -100 to 100
  saturation: number; // -100 to 100
  luminance: number;  // -100 to 100
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface Adjustments {
  // Light
  exposure: number;    // -100 to 100
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  highlights: number;  // -100 to 100
  shadows: number;     // -100 to 100
  whites: number;      // -100 to 100
  blacks: number;      // -100 to 100

  // Color
  temperature: number; // -100 to 100
  tint: number;        // -100 to 100
  vibrance: number;    // -100 to 100
  saturation: number;  // -100 to 100

  // Detail & Effects
  sharpness: number;   // 0 to 100
  clarity: number;     // -100 to 100
  blur: number;        // 0 to 50
  vignette: number;    // 0 to 100
  grain: number;       // 0 to 100

  // HSL Channels
  hsl: {
    red: HSLChannel;
    orange: HSLChannel;
    yellow: HSLChannel;
    green: HSLChannel;
    cyan: HSLChannel;
    blue: HSLChannel;
    purple: HSLChannel;
    magenta: HSLChannel;
  };

  // Tone Curve
  curve: {
    rgb: CurvePoint[];
    red: CurvePoint[];
    green: CurvePoint[];
    blue: CurvePoint[];
  };
}

export interface LayerTransform {
  x: number;
  y: number;
  width?: number;
  height?: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  flipH: boolean;
  flipV: boolean;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  blendMode: BlendMode;
  transform: LayerTransform;
  
  // Image layer data
  imageUrl?: string;
  originalWidth?: number;
  originalHeight?: number;

  // Text layer data
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  fontWeight?: string;

  // Solid color / shape layer data
  fillColor?: string;

  // Per-layer adjustment stack
  adjustments: Adjustments;
}

export interface Project {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: Layer[];
  activeLayerId: string;
  updatedAt: string;
  createdAt: string;
  previewUrl?: string;
  syncStatus: 'synced' | 'syncing' | 'offline_cached' | 'pending';
}

export interface BatchItem {
  id: string;
  name: string;
  originalUrl: string;
  previewUrl: string;
  processedUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  size: number;
  width: number;
  height: number;
  progress: number;
  appliedPresetId?: string;
  adjustments: Adjustments;
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  outputQuality: number; // 0.1 to 1.0
}

export type UserRole = 'admin' | 'pro' | 'editor' | 'viewer';

export interface UserPermissions {
  canBatchProcess: boolean;
  canUseGenerativeAI: boolean;
  canExport4K: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  maxProjects: number;
  maxStorageMB: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  permissions: UserPermissions;
  quotaUsed: {
    aiCallsCount: number;
    batchExportsCount: number;
    storageUsedMB: number;
  };
  lastActive: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action:
    | 'auth_login'
    | 'auth_logout'
    | 'project_create'
    | 'project_save'
    | 'layer_add'
    | 'layer_modify'
    | 'ai_enhancement'
    | 'ai_relight'
    | 'ai_style_transfer'
    | 'batch_process_start'
    | 'batch_export'
    | 'permission_update'
    | 'user_role_change'
    | 'cloud_sync';
  details: string;
  ip: string;
  platform: 'iOS' | 'Android' | 'Web Desktop' | 'Web Mobile';
  status: 'success' | 'warning' | 'failed';
}

export interface AnalyticsSummary {
  activeUsers24h: number;
  totalProjects: number;
  aiOperationsTotal: number;
  batchJobsProcessed: number;
  avgLatencyMs: number;
  cloudStorageUsedMB: number;
  cloudStorageTotalMB: number;
  userEngagementGrowth: number;
  apiSuccessRate: number;
}

export interface AIPresetFilter {
  id: string;
  name: string;
  category: 'Cinematic' | 'Portrait' | 'Film Stock' | 'Mood' | 'Artistic' | 'Studio Light';
  description: string;
  thumbnailUrl: string;
  adjustments: Partial<Adjustments>;
  aiPrompt?: string;
  tag: string;
}

export interface LiveEnhancementState {
  activeTool: 'none' | 'denoise' | 'upscale' | 'bg_remover' | 'skin_retouch' | 'auto_enhance';
  denoise: {
    luminance: number;
    color: number;
  };
  upscale: {
    factor: 2 | 4;
  };
  bgRemover: {
    mode: 'transparent' | 'color' | 'blur' | 'gradient' | 'photo';
    color: string;
    photoUrl?: string;
    blurRadius: number;
    threshold: number;
    feather: number;
    protectSubject: boolean;
    activeTab?: 'background' | 'erase_restore' | 'shadow';
    brushMode?: 'erase' | 'restore';
    brushSize?: number;
    brushSoftness?: number;
    shadowType?: 'none' | 'drop' | 'floor' | 'floating';
    shadowOpacity?: number;
    shadowBlur?: number;
  };
  skinRetouch: {
    smoothing: number;
    blemish: number;
    glow: number;
  };
  isComparingOriginal: boolean;
}

export function createDefaultLiveEnhancement(): LiveEnhancementState {
  return {
    activeTool: 'none',
    denoise: { luminance: 65, color: 50 },
    upscale: { factor: 2 },
    bgRemover: {
      mode: 'transparent',
      color: '#ffffff',
      photoUrl: '',
      blurRadius: 24,
      threshold: 45,
      feather: 4,
      protectSubject: true,
      activeTab: 'background',
      brushMode: 'erase',
      brushSize: 32,
      brushSoftness: 50,
      shadowType: 'none',
      shadowOpacity: 45,
      shadowBlur: 20,
    },
    skinRetouch: { smoothing: 60, blemish: 50, glow: 30 },
    isComparingOriginal: false,
  };
}

