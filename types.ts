
export enum SkyReplacement {
  OFF = 'OFF',
  CLEAR_BLUE = 'CLEAR_BLUE',
  SOFT_OVERCAST = 'SOFT_OVERCAST',
  GOLDEN_HOUR = 'GOLDEN_HOUR',
  DRAMATIC_CLOUDY = 'DRAMATIC_CLOUDY',
  NIGHT_LUXURY = 'NIGHT_LUXURY',
  CUSTOM = 'CUSTOM', // New: Tùy chỉnh prompt
}

export enum AutoWhiteBalance {
  ARCHITECTURAL_NEUTRAL = 'ARCHITECTURAL_NEUTRAL',
  WARM = 'WARM',
  COOL = 'COOL',
}

export enum LightsOnOffMode {
  OFF = 'OFF',
  ON = 'ON',
  MIXED = 'MIXED',
  ORIGINAL = 'ORIGINAL', // New: Giữ nguyên
}

export enum DayToNightMode {
  OFF = 'OFF',
  MORNING = 'MORNING',           // Buổi sáng
  NOON = 'NOON',                 // Buổi trưa
  AFTERNOON = 'AFTERNOON',       // Buổi chiều
  GOLDEN_HOUR = 'GOLDEN_HOUR',   // Giờ vàng
  BLUE_HOUR = 'BLUE_HOUR',       // Giờ xanh
  NIGHT = 'NIGHT',               // Buổi tối
}

export enum PeopleStyle {
  BUSINESS = 'BUSINESS',
  RESIDENTS = 'RESIDENTS',
  FAMILY = 'FAMILY',
  TOURISTS = 'TOURISTS',
  LIFESTYLE_MINIMAL = 'LIFESTYLE_MINIMAL',
}

export enum AddPeople {
  OFF = 'OFF',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum Vehicles {
  OFF = 'OFF',
  FEW = 'FEW',
  MANY = 'MANY',
}

// ModelType enum removed - hardcoded to Pro in service

export type OutputResolution = '2K' | '4K';

export type AspectRatio = 'ORIGINAL' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

export interface ProcessingOptions {
  // Model removed from here
  Resolution: OutputResolution;
  AspectRatio: AspectRatio;

  // Cleaning
  CleanTrash: boolean;
  RemovePowerLines: boolean;
  RemoveSensorSpots: boolean;
  CleanPaving: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';
  CleanWalls: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';
  CleanGlass: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';
  CleanGroundTiles: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG'; // Kept for compatibility but types unified
  RemoveUrbanNoise: 'LOW' | 'MEDIUM' | 'STRONG';
  
  // Geometry
  AutoPerspectiveCorrection: boolean;
  AutoVerticals: boolean;
  AutoLensCorrection: boolean;
  AutoLevelHorizon: boolean;

  // Lighting & HDR
  AutoHDRBatch: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';
  AutoWhiteBalance: AutoWhiteBalance;
  OptimizeInterior: boolean;

  // Environment
  SkyReplacement: SkyReplacement;
  SkyCustomPrompt: string; // New: Prompt tùy chỉnh cho bầu trời
  SkyStrength: number;
  MatchLightDirectionToOriginal: boolean;
  CPLFilterEffect: boolean;

  // Soft Surfaces
  SmoothSoftSurfaces: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';

  // Scene & Atmosphere
  LightsOnOffMode: LightsOnOffMode;
  DayToNightMode: DayToNightMode;

  // Staging
  AddPeople: AddPeople;
  PeopleStyle: PeopleStyle;
  Vehicles: Vehicles;
  FurnitureEnhance: 'OFF' | 'LIGHT' | 'HEAVY';

  // Batch
  ColorConsistencyByProject: boolean;
}

export interface ProjectState {
  projectContext: string;
  extraPrompt: string;
  options: ProcessingOptions;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  errorMsg?: string;
  maskData?: string;
}
