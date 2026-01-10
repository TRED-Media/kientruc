import { 
  ProcessingOptions, 
  SkyReplacement, 
  AutoWhiteBalance, 
  LightsOnOffMode, 
  DayToNightMode, 
  PeopleStyle, 
  AddPeople, 
  Vehicles
} from './types';

export const DEFAULT_OPTIONS: ProcessingOptions = {
  Resolution: '2K', // Mặc định chất lượng cao
  AspectRatio: 'ORIGINAL',
  
  CleanTrash: true,
  RemovePowerLines: true,
  RemoveSensorSpots: true,
  CleanPaving: 'STRONG', // Mặc định mạnh
  CleanWalls: 'MEDIUM',
  CleanGlass: 'MEDIUM',
  CleanGroundTiles: 'STRONG',
  RemoveUrbanNoise: 'MEDIUM',
  
  AutoPerspectiveCorrection: true,
  AutoVerticals: true,
  AutoLensCorrection: true,
  AutoLevelHorizon: true,

  AutoHDRBatch: 'MEDIUM',
  AutoWhiteBalance: AutoWhiteBalance.ARCHITECTURAL_NEUTRAL,
  OptimizeInterior: false, // Default off

  SkyReplacement: SkyReplacement.OFF,
  SkyStrength: 100, // Default 100% intensity
  MatchLightDirectionToOriginal: true,
  CPLFilterEffect: false,

  SmoothSoftSurfaces: 'MEDIUM',

  LightsOnOffMode: LightsOnOffMode.MIXED,
  DayToNightMode: DayToNightMode.OFF,

  AddPeople: AddPeople.OFF,
  PeopleStyle: PeopleStyle.RESIDENTS,
  Vehicles: Vehicles.OFF,
  FurnitureEnhance: 'LIGHT',

  ColorConsistencyByProject: true,
};

export const SYSTEM_INSTRUCTION_HEADER = `
You are an advanced AI specialized in ARCHITECTURAL IMAGE RETOUCHING.

CORE OBJECTIVES:
1. GEOMETRY CORRECTION:
   - Make all vertical lines perfectly vertical (90 degrees to horizon).
   - Fix perspective distortion. The building must look structural and upright.

2. SURFACE RESTORATION (CLEANING):
   - FLOORS/PAVEMENT: Remove water stains, oil spots, moss, and patchy discoloration. Make pavement look dry, clean, and uniform in color.
   - WALLS: Remove mold, dirt streaks, and weathering stains.
   - GENERAL: Remove trash, debris, and loose wires.

3. SKY REPLACEMENT (STRICT MASKING):
   - TARGET: Replace ONLY the sky pixels.
   - PROTECTION: PRESERVE all distant buildings, mountains, skylines, and landscape details at the horizon. 
   - CONSTRAINT: Do NOT replace or cover the background city/landscape with clouds. Only change the sky above them.
   - LIGHTING: Adjust the foreground lighting to match the new sky.

4. OUTPUT QUALITY:
   - Photorealistic, High Resolution, Sharp details.
   - No blur, no hallucinations. Preserve original building structure.
`;

// Cấu hình giá (Pricing)
export const PRICING_CONFIG = {
  USD_TO_VND: 26270,
  // Giá cho Model Pro
  PRICE_USD: {
    '2K': 0.14,
    '4K': 0.24
  }
};

// Giá hiển thị VND
export const PRICING_VND = {
  BASE: 450, // Giá gốc cao hơn cho bản Pro
  FEATURE_COST: {
    PEOPLE: 50,
    SKY: 30,
    GEOMETRY: 10,
    CLEANING: 25,
    CPL_FILTER: 25,
    SENSOR_SPOTS: 15
  }
};