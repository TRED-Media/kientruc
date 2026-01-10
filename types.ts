
export enum SkyReplacement {
  OFF = 'OFF',
  CLEAR_BLUE = 'CLEAR_BLUE',
  SOFT_OVERCAST = 'SOFT_OVERCAST',
  GOLDEN_HOUR = 'GOLDEN_HOUR',
  DRAMATIC_CLOUDY = 'DRAMATIC_CLOUDY',
  NIGHT_LUXURY = 'NIGHT_LUXURY', // New: Bầu trời tối
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
  AspectRatio: AspectRatio; // New field

  // Cleaning
  CleanTrash: boolean;
  RemovePowerLines: boolean;
  RemoveSensorSpots: boolean; // New: Sensor dust
  CleanPaving: 'LOW' | 'MEDIUM' | 'STRONG';
  CleanWalls: 'LOW' | 'MEDIUM' | 'STRONG';
  CleanGlass: 'LOW' | 'MEDIUM' | 'STRONG';
  CleanGroundTiles: 'LOW' | 'MEDIUM' | 'STRONG';
  RemoveUrbanNoise: 'LOW' | 'MEDIUM' | 'STRONG';
  
  // Geometry
  AutoPerspectiveCorrection: boolean;
  AutoVerticals: boolean;
  AutoLensCorrection: boolean;
  AutoLevelHorizon: boolean;

  // Lighting & HDR
  AutoHDRBatch: 'OFF' | 'LOW' | 'MEDIUM' | 'STRONG';
  AutoWhiteBalance: AutoWhiteBalance;
  OptimizeInterior: boolean; // New: Chế độ nội thất kín

  // Environment
  SkyReplacement: SkyReplacement;
  SkyStrength: number; // New: Độ mạnh bầu trời (0-100)
  MatchLightDirectionToOriginal: boolean;
  CPLFilterEffect: boolean; // New: See through glass/water

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
  maskData?: string; // Base64 of the red mask overlay for manual removal
}