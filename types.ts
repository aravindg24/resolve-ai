export enum DangerLevel {
  Low = 'Low',
  High = 'High',
}

export type SkillLevel = 'Novice' | 'Intermediate' | 'Expert';

export interface ToolSubstitution {
  original: string;
  substitute: string;
}

export interface RepairAnalysis {
  objectName: string;
  dangerLevel: DangerLevel;
  confidenceScore: number; // 0-100
  reasoning: string; // "I see X, which implies Y..."
  safetyWarning: string;
  professionalReferral?: string; // "Contact a certified electrician"
  steps: string[];
  toolsRequired: string[];
  toolSubstitutions?: ToolSubstitution[];
  estimatedTime: string;
}

export interface MediaItem {
  id: string;
  data: string; // Base64 string for API
  mimeType: string;
  previewUrl: string; // Blob URL or Data URL for display
  type: 'image' | 'video';
}

export interface StoredScan {
  id: string;
  timestamp: number;
  analysis: RepairAnalysis;
  media: MediaItem[];
  completedSteps?: number[]; // Track progress
  skillLevel: SkillLevel;
}

export type AppState = 'IDLE' | 'SCANNING' | 'PROCESSING' | 'RESULTS' | 'ERROR' | 'HISTORY';

export interface AppContextState {
  apiKey: string | null;
  setApiKey: (key: string) => void;
}
