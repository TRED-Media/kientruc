import React, { useRef } from 'react';
import { Upload, Plus, Zap, Layers, Aperture, Cpu } from 'lucide-react';

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
  hasFiles: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesAdded, hasFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Compact version for filmstrip
  if (hasFiles) {
    return (
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-full flex flex-col items-center justify-center text-teal-main dark:text-teal-light hover:text-red-accent transition-colors group"
      >
        <Plus size={24} className="group-hover:scale-110 transition-transform mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-widest">THÊM ẢNH</span>
        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
      </button>
    );
  }

  // Large version for empty state
  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 md:p-10 transition-colors text-center overflow-hidden"
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
      
      <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-navy-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-200 dark:border-navy-600 group-hover:border-red-accent group-hover:shadow-[0_0_20px_rgba(230,39,39,0.1)] transition-all relative shrink-0">
            <Upload size={32} className="text-teal-main dark:text-teal-light group-hover:text-red-accent transition-colors relative z-10 md:w-10 md:h-10" />
            <div className="absolute inset-0 rounded-full border border-red-accent/10 scale-125 animate-pulse" />
          </div>
          
          <h3 className="text-xl md:text-3xl font-black text-navy-900 dark:text-white tracking-tight mb-2 uppercase">
            KÉO THẢ ẢNH VÀO ĐÂY
          </h3>
          <p className="text-[10px] md:text-sm font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest mb-6">
            Hoặc bấm để chọn (Hỗ trợ JPG, PNG, WEBP)
          </p>
      </div>

      {/* Tech Features Info - Horizontal Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full border-t border-slate-200 dark:border-navy-600 pt-6 mt-auto">
          <div className="text-center group-hover:text-teal-main transition-colors">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-red-accent">
                  <Cpu size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Gemini 3 Pro</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Hiểu không gian 3D
              </p>
          </div>

          <div className="text-center group-hover:text-teal-main transition-colors">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-teal-main dark:text-teal-light">
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Auto HDR</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Cân bằng sáng
              </p>
          </div>

          <div className="text-center group-hover:text-teal-main transition-colors">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-red-accent">
                  <Layers size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Geometry Fix</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Dựng thẳng cột
              </p>
          </div>

          <div className="text-center group-hover:text-teal-main transition-colors">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-teal-main dark:text-teal-light">
                  <Aperture size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Cleaning</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Xóa rác & Dây điện
              </p>
          </div>
      </div>
    </div>
  );
};