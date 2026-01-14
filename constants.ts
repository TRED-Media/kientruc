
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
  CleanPaving: 'OFF', // Default OFF per user request
  CleanWalls: 'OFF',  // Default OFF per user request
  CleanGlass: 'OFF',
  CleanGroundTiles: 'OFF',
  RemoveUrbanNoise: 'MEDIUM',
  
  AutoPerspectiveCorrection: true,
  AutoVerticals: true,
  AutoLensCorrection: true,
  AutoLevelHorizon: true,

  AutoHDRBatch: 'MEDIUM',
  AutoWhiteBalance: AutoWhiteBalance.ARCHITECTURAL_NEUTRAL,
  OptimizeInterior: false, // Default off

  SkyReplacement: SkyReplacement.OFF,
  SkyCustomPrompt: '', // Default empty
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
ROLE: BẠN LÀ MỘT CHUYÊN GIA RETOUCH ẢNH KIẾN TRÚC CAO CẤP (ARCHITECTURAL RETOUCHER).

NGUYÊN TẮC BẤT DI BẤT DỊCH (CRITICAL RULES):
1. GIỮ NGUYÊN CẤU TRÚC: Không được thay đổi thiết kế, hình khối của công trình.
2. GIỮ NGUYÊN VẬT LIỆU: Nếu là tường gạch, phải giữ là gạch. Nếu là gỗ, phải giữ là gỗ. KHÔNG ĐƯỢC biến đổi vật liệu gốc sang vật liệu khác.
3. GIỮ NGUYÊN MÀU SẮC GỐC: Chỉ làm sạch, làm sáng, không được đổi màu sơn tường hay màu gạch lát (trừ khi có lệnh đổi màu cụ thể).
4. XỬ LÝ HÌNH HỌC CHUẨN: Tất cả các đường thẳng đứng phải vuông góc 90 độ với mặt đất.

NHIỆM VỤ CỦA BẠN LÀ THỰC HIỆN CÁC "TASKS" ĐƯỢC LIỆT KÊ BÊN DƯỚI MỘT CÁCH CHÍNH XÁC.
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
