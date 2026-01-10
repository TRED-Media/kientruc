import React, { useRef } from 'react';
import { ProcessingOptions, OutputResolution, AspectRatio } from '../types';
import { Camera, Zap, Briefcase, FileText, Eraser, Aperture, UploadCloud, Home, ChevronDown } from 'lucide-react';

interface ControlPanelProps {
  options: ProcessingOptions;
  setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>>;
  projectContext: string;
  setProjectContext: (val: string) => void;
  extraPrompt: string;
  setExtraPrompt: (val: string) => void;
  isMaskingMode: boolean;
  setIsMaskingMode: (val: boolean) => void;
  onFilesAdded: (files: File[]) => void;
}

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3 px-1">
      <Icon size={16} className="text-red-accent" />
      <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-sm transition-colors">
        {children}
    </div>
  </div>
);

const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700 last:border-0 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors cursor-pointer" onClick={() => onChange(!value)}>
    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${value ? 'bg-teal-main' : 'bg-slate-300 dark:bg-navy-900'}`}>
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);

const Select = ({ label, value, options, onChange, displayMap }: { label: string, value: string, options: string[], onChange: (v: any) => void, displayMap?: Record<string, string> }) => (
  <div className="p-4 border-b border-slate-200 dark:border-navy-700 last:border-0 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors group">
    <label className="block text-[10px] text-teal-main dark:text-slate-400 mb-2 uppercase font-bold tracking-wider group-hover:text-red-accent transition-colors">{label}</label>
    <div className="relative">
        <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white text-xs font-bold py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-navy-600 focus:border-teal-main focus:ring-1 focus:ring-teal-main focus:outline-none appearance-none transition-all cursor-pointer"
        >
        {options.map(opt => <option key={opt} value={opt}>{displayMap ? displayMap[opt] : opt}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// Mappings...
const levelMapLowMedStrong: Record<string, string> = { 'LOW': 'Nhẹ', 'MEDIUM': 'Vừa', 'STRONG': 'Mạnh' };
const smoothMap: Record<string, string> = { 'OFF': 'Tắt', 'LOW': 'Nhẹ', 'MEDIUM': 'Vừa', 'STRONG': 'Mạnh' };

export const ControlPanel: React.FC<ControlPanelProps> = ({
  options,
  setOptions,
  projectContext,
  setProjectContext,
  extraPrompt,
  setExtraPrompt,
  isMaskingMode,
  setIsMaskingMode,
  onFilesAdded
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateOption = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0C2B4E] transition-colors">
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-20">
        
        {/* IMPORT */}
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full mb-8 bg-slate-50 dark:bg-navy-800 hover:bg-teal-main/5 dark:hover:bg-navy-700 text-teal-main dark:text-teal-light hover:text-red-accent border border-slate-200 dark:border-navy-600 hover:border-teal-main transition-all p-5 rounded-xl flex flex-col items-center justify-center gap-3 group shadow-sm"
        >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-navy-900 flex items-center justify-center border border-slate-200 dark:border-navy-700 group-hover:border-red-accent group-hover:text-red-accent transition-colors">
                 <UploadCloud size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Thêm ảnh mới</span>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />

        {/* CONTEXT */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Briefcase size={16} className="text-red-accent" />
            <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">Mô tả dự án</h3>
          </div>
          <textarea
            className="w-full bg-white dark:bg-navy-800 text-slate-900 dark:text-white text-xs font-medium p-4 rounded-xl border border-slate-200 dark:border-navy-700 focus:border-teal-main focus:ring-1 focus:ring-teal-main focus:outline-none h-24 resize-none transition-all placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed shadow-inner"
            placeholder="Mô tả ngắn về công trình (VD: Biệt thự nghỉ dưỡng, phong cách nhiệt đới...)"
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
          />
        </div>

        {/* SPECIAL */}
        <Section title="Chế độ đặc biệt" icon={Home}>
            <Toggle label="Nội thất kín (Studio Light)" value={options.OptimizeInterior} onChange={(v) => updateOption('OptimizeInterior', v)} />
        </Section>

        {/* GEOMETRY */}
        <Section title="Hình học & Ống kính" icon={Camera}>
          <Toggle label="Chỉnh phối cảnh tự động" value={options.AutoPerspectiveCorrection} onChange={(v) => updateOption('AutoPerspectiveCorrection', v)} />
          <Toggle label="Cân bằng chiều đứng (Verticals)" value={options.AutoVerticals} onChange={(v) => updateOption('AutoVerticals', v)} />
          <Toggle label="Khử méo ống kính" value={options.AutoLensCorrection} onChange={(v) => updateOption('AutoLensCorrection', v)} />
        </Section>

        {/* FILTERS */}
        <Section title="Kính lọc quang học" icon={Aperture}>
             <Toggle label="Bộ lọc CPL (Chống phản chiếu)" value={options.CPLFilterEffect} onChange={(v) => updateOption('CPLFilterEffect', v)} />
             <Toggle label="Khóa hướng nắng (Match Light)" value={options.MatchLightDirectionToOriginal} onChange={(v) => updateOption('MatchLightDirectionToOriginal', v)} />
        </Section>

        {/* CLEANING */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-red-accent" />
                    <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">Vệ sinh & Làm sạch</h3>
                </div>
                <button
                    onClick={() => setIsMaskingMode(!isMaskingMode)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${isMaskingMode ? 'bg-red-accent/10 border-red-accent text-red-accent animate-pulse' : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:text-teal-main'}`}
                >
                    <Eraser size={12} />
                    {isMaskingMode ? 'Đang bật Mask' : 'Mask thủ công'}
                </button>
            </div>
            
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-sm transition-colors">
                <Toggle label="Xóa rác & Vật thể lạ (Auto)" value={options.CleanTrash} onChange={(v) => updateOption('CleanTrash', v)} />
                <Toggle label="Xóa dây điện" value={options.RemovePowerLines} onChange={(v) => updateOption('RemovePowerLines', v)} />
                <Toggle label="Xóa đốm bẩn Sensor" value={options.RemoveSensorSpots} onChange={(v) => updateOption('RemoveSensorSpots', v)} />
                <Select label="Làm sạch tường" value={options.CleanWalls} options={['LOW', 'MEDIUM', 'STRONG']} displayMap={levelMapLowMedStrong} onChange={(v) => updateOption('CleanWalls', v)} />
                <Select label="Làm sạch sàn/đường" value={options.CleanPaving} options={['LOW', 'MEDIUM', 'STRONG']} displayMap={levelMapLowMedStrong} onChange={(v) => updateOption('CleanPaving', v)} />
                <Select label="Làm phẳng vải" value={options.SmoothSoftSurfaces} options={['OFF', 'LOW', 'MEDIUM', 'STRONG']} displayMap={smoothMap} onChange={(v) => updateOption('SmoothSoftSurfaces', v)} />
            </div>
        </div>

        {/* PROMPT */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <FileText size={16} className="text-red-accent" />
            <h3 className="text-xs font-bold text-navy-900 dark:text-slate-200 uppercase tracking-widest">Ghi chú AI (Prompt)</h3>
          </div>
          <textarea
            className="w-full bg-white dark:bg-navy-800 text-slate-900 dark:text-white text-xs font-medium p-4 rounded-xl border border-slate-200 dark:border-navy-700 focus:border-teal-main focus:ring-1 focus:ring-teal-main focus:outline-none h-32 resize-none transition-all placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed shadow-inner"
            placeholder="Nhập các yêu cầu cụ thể khác..."
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
          />
        </div>

      </div>
      
      {/* VERSION */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E] text-[9px] text-teal-main dark:text-slate-500 text-center font-mono transition-colors">
        CORE: GEMINI 3 PRO / BUILD: 3.3.0
      </div>
    </div>
  );
};