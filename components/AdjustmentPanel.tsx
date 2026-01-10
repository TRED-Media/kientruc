import React, { useMemo } from 'react';
import { 
    ProcessingOptions,
    SkyReplacement, 
    AutoWhiteBalance, 
    LightsOnOffMode, 
    DayToNightMode, 
    PeopleStyle, 
    AddPeople, 
    Vehicles,
    ImageFile,
    OutputResolution, 
    AspectRatio
} from '../types';
import { Sliders, Sun, Image as ImageIcon, Users, Zap, DollarSign, DownloadCloud, CheckCircle2, Lock, ChevronDown, Monitor } from 'lucide-react';
import { PRICING_VND } from '../constants';

interface AdjustmentPanelProps {
  options: ProcessingOptions;
  setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  isProcessing: boolean;
  onProcess: () => void;
  files?: ImageFile[];
  onDownloadAll?: () => void;
}

// Styled Components
const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mt-8 mb-4 px-1">
        <Icon size={16} className="text-red-accent" />
        <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">{title}</h3>
    </div>
);

const StyledSelect = ({ label, value, options, onChange, displayMap }: { label: string, value: string, options: string[], onChange: (v: any) => void, displayMap?: Record<string, string> }) => (
    <div className="mb-4">
      <label className="block text-[10px] text-teal-main dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">{label}</label>
      <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white text-xs font-bold py-3 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-navy-600 focus:border-teal-main focus:ring-1 focus:ring-teal-main focus:outline-none appearance-none transition-all cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-navy-800"
          >
            {options.map(opt => <option key={opt} value={opt}>{displayMap ? displayMap[opt] : opt}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
      </div>
    </div>
  );

const HDRToggle = ({ value, onChange }: { value: string, onChange: (v: any) => void }) => (
    <div className="mb-6">
        <label className="block text-[10px] text-teal-main dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">Cường độ Auto HDR</label>
        <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-navy-900 p-1.5 rounded-xl border border-slate-200 dark:border-navy-600">
            {['OFF', 'LOW', 'MEDIUM', 'STRONG'].map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`py-2 text-[9px] font-bold rounded-lg transition-all ${value === opt ? 'bg-teal-main text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-white dark:hover:bg-navy-700'}`}
                >
                    {opt === 'OFF' ? 'TẮT' : opt}
                </button>
            ))}
        </div>
    </div>
);

// Maps...
const skyMap: Record<string, string> = {
    'OFF': 'Nguyên bản',
    'CLEAR_BLUE': 'Xanh + Nắng gắt',
    'SOFT_OVERCAST': 'Mây trắng nhẹ',
    'GOLDEN_HOUR': 'Hoàng hôn (Vàng)',
    'DRAMATIC_CLOUDY': 'Mây kịch tính',
    'NIGHT_LUXURY': 'Đêm Luxury (Sao)',
};
const wbMap: Record<string, string> = { 'ARCHITECTURAL_NEUTRAL': 'Trung tính (Chuẩn)', 'WARM': 'Tone Ấm', 'COOL': 'Tone Lạnh' };
const lightsMap: Record<string, string> = { 'OFF': 'Tắt hết', 'ON': 'Bật hết', 'MIXED': 'Hỗn hợp' };
const d2nMap: Record<string, string> = { 'OFF': 'Giữ nguyên', 'MORNING': 'Sáng', 'NOON': 'Trưa', 'AFTERNOON': 'Chiều', 'GOLDEN_HOUR': 'Giờ vàng', 'BLUE_HOUR': 'Giờ xanh', 'NIGHT': 'Tối' };
const peopleMap: Record<string, string> = { 'OFF': 'Không', 'LOW': 'Ít', 'MEDIUM': 'Vừa', 'HIGH': 'Đông' };
const peopleStyleMap: Record<string, string> = { 'BUSINESS': 'Công sở', 'RESIDENTS': 'Đời thường', 'FAMILY': 'Gia đình', 'TOURISTS': 'Du lịch', 'LIFESTYLE_MINIMAL': 'Tối giản' };
const resMap: Record<string, string> = { '2K': '2K (High Res)', '4K': '4K (Ultra Res)' };
const ratioMap: Record<string, string> = { 'ORIGINAL': 'Gốc', '16:9': '16:9', '9:16': '9:16', '4:3': '4:3', '3:4': '3:4', '3:2': '3:2', '2:3': '2:3' };


export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  options,
  setOptions,
  isProcessing,
  onProcess,
  files = [],
  onDownloadAll
}) => {
  const updateOption = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const isNightLuxuryMode = options.SkyReplacement === SkyReplacement.NIGHT_LUXURY;

  const handleSkyChange = (val: string) => {
      if (val === SkyReplacement.NIGHT_LUXURY) {
          setOptions(prev => ({
              ...prev,
              SkyReplacement: SkyReplacement.NIGHT_LUXURY,
              LightsOnOffMode: LightsOnOffMode.ON,
              DayToNightMode: DayToNightMode.BLUE_HOUR,
              SkyStrength: 90
          }));
      } else {
          updateOption('SkyReplacement', val as SkyReplacement);
      }
  };

  const estimatedCost = useMemo(() => {
    let cost = PRICING_VND.BASE;
    if (options.AddPeople !== AddPeople.OFF) cost += PRICING_VND.FEATURE_COST.PEOPLE;
    if (options.SkyReplacement !== SkyReplacement.OFF) cost += PRICING_VND.FEATURE_COST.SKY;
    if (options.AutoPerspectiveCorrection || options.AutoVerticals) cost += PRICING_VND.FEATURE_COST.GEOMETRY;
    if (options.CleanTrash || options.RemovePowerLines) cost += PRICING_VND.FEATURE_COST.CLEANING;
    if (options.CPLFilterEffect) cost += PRICING_VND.FEATURE_COST.CPL_FILTER;
    if (options.RemoveSensorSpots) cost += PRICING_VND.FEATURE_COST.SENSOR_SPOTS;
    return Math.round(cost);
  }, [options]);

  const completedCount = files.filter(f => f.status === 'completed').length;
  const totalCount = files.length;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0C2B4E] transition-colors">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* OUTPUT SETTINGS (Moved from ControlPanel) */}
             <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                <Monitor size={16} className="text-red-accent" />
                <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">Định dạng đầu ra</h3>
                </div>
                <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] text-teal-main dark:text-slate-400 font-bold uppercase mb-2">Độ phân giải</label>
                            <div className="relative">
                                <select 
                                    value={options.Resolution}
                                    onChange={(e) => updateOption('Resolution', e.target.value as OutputResolution)}
                                    className="w-full bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white text-xs font-bold py-2 pl-2 pr-6 rounded border border-slate-200 dark:border-navy-600 focus:border-teal-main appearance-none outline-none"
                                >
                                    {['2K', '4K'].map(opt => <option key={opt} value={opt}>{resMap[opt]}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"/>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] text-teal-main dark:text-slate-400 font-bold uppercase mb-2">Tỷ lệ</label>
                            <div className="relative">
                                <select 
                                    value={options.AspectRatio}
                                    onChange={(e) => updateOption('AspectRatio', e.target.value as AspectRatio)}
                                    className="w-full bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white text-xs font-bold py-2 pl-2 pr-6 rounded border border-slate-200 dark:border-navy-600 focus:border-teal-main appearance-none outline-none"
                                >
                                    {Object.keys(ratioMap).map(opt => <option key={opt} value={opt}>{ratioMap[opt]}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SectionTitle title="Môi trường" icon={ImageIcon} />
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-4 shadow-sm transition-colors">
                <StyledSelect label="Thay thế bầu trời" value={options.SkyReplacement} options={Object.values(SkyReplacement)} displayMap={skyMap} onChange={handleSkyChange} />
                
                {options.SkyReplacement !== SkyReplacement.OFF && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-600">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] text-teal-main dark:text-slate-300 uppercase font-bold">Độ phủ bầu trời</label>
                             <span className="text-[10px] font-bold text-red-accent">{options.SkyStrength}%</span>
                        </div>
                         <input 
                            type="range" min="0" max="100" step="5"
                            value={options.SkyStrength}
                            onChange={(e) => updateOption('SkyStrength', parseInt(e.target.value))}
                            className="w-full"
                         />
                    </div>
                )}
            </div>

            {isNightLuxuryMode ? (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-navy-900 border border-teal-main/30 rounded-xl flex gap-3 items-start">
                    <Lock size={16} className="text-teal-main mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[11px] font-bold text-teal-main uppercase mb-1">Đã kích hoạt Night Luxury</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Hệ thống đã tự động tối ưu ánh sáng đèn và thời gian.</p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-3">
                        <StyledSelect label="Đèn nhân tạo" value={options.LightsOnOffMode} options={Object.values(LightsOnOffMode)} displayMap={lightsMap} onChange={(v) => updateOption('LightsOnOffMode', v)} />
                    </div>
                    <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-3">
                        <StyledSelect label="Thời gian" value={options.DayToNightMode} options={Object.values(DayToNightMode)} displayMap={d2nMap} onChange={(v) => updateOption('DayToNightMode', v)} />
                    </div>
                </div>
            )}
            
            <div className="mt-4">
                <StyledSelect label="Cân bằng trắng" value={options.AutoWhiteBalance} options={Object.values(AutoWhiteBalance)} displayMap={wbMap} onChange={(v) => updateOption('AutoWhiteBalance', v)} />
            </div>

            <SectionTitle title="Ánh sáng & Chi tiết" icon={Sun} />
            <HDRToggle value={options.AutoHDRBatch} onChange={(v) => updateOption('AutoHDRBatch', v)} />
            
             <SectionTitle title="Diễn họa (Staging)" icon={Users} />
             <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-4 space-y-2 transition-colors">
                <StyledSelect label="Thêm người" value={options.AddPeople} options={Object.values(AddPeople)} displayMap={peopleMap} onChange={(v) => updateOption('AddPeople', v)} />
                {options.AddPeople !== AddPeople.OFF && (
                <StyledSelect label="Phong cách" value={options.PeopleStyle} options={Object.values(PeopleStyle)} displayMap={peopleStyleMap} onChange={(v) => updateOption('PeopleStyle', v)} />
                )}
                <StyledSelect label="Xe cộ" value={options.Vehicles} options={Object.values(Vehicles)} displayMap={{'OFF': 'Không', 'FEW': 'Ít', 'MANY': 'Nhiều'}} onChange={(v) => updateOption('Vehicles', v)} />
             </div>

             <div className="h-20"></div> {/* Bottom spacer */}
        </div>

        {/* FOOTER ACTION */}
        <div className="p-5 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E] flex flex-col gap-4 relative z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-colors">
             
             {/* Cost Info */}
             {!isProcessing && completedCount === 0 && (
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-teal-main dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign size={12}/> Chi phí / ảnh
                    </span>
                    <span className="text-sm font-black text-navy-900 dark:text-white">{estimatedCost} đ</span>
                </div>
             )}

             {/* Process Button */}
             {completedCount < totalCount && (
                <button
                    onClick={onProcess}
                    disabled={isProcessing || totalCount === 0}
                    className={`w-full h-14 rounded-xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 ${
                        isProcessing || totalCount === 0
                        ? 'bg-slate-100 dark:bg-navy-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-navy-600' 
                        : 'bg-red-accent text-white shadow-lg shadow-red-accent/30 hover:bg-red-hover'
                    }`}
                >
                    {isProcessing ? (
                        <>
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        ĐANG XỬ LÝ...
                        </>
                    ) : (
                        <>
                        <Zap size={20} className="fill-white" />
                        {completedCount > 0 ? `RENDER TIẾP (${totalCount - completedCount})` : 'RENDER NGAY'}
                        </>
                    )}
                </button>
             )}

            {/* Download Button */}
            {completedCount > 0 && onDownloadAll && (
                <button 
                    onClick={onDownloadAll}
                    className="w-full h-12 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 text-teal-main dark:text-white rounded-xl border border-teal-main dark:border-slate-500 flex items-center justify-center gap-2 transition-all group"
                >
                    <DownloadCloud size={18} className="text-teal-main dark:text-white group-hover:scale-110 transition-transform"/>
                    <span className="text-xs font-bold uppercase tracking-widest">Tải về ({completedCount})</span>
                </button>
            )}

            {/* Copyright Footer */}
            <div className="text-center mt-4 pb-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Phần mềm bản quyền thuộc về T-Red Media (tred.vn)</p>
            </div>
        </div>
    </div>
  );
};