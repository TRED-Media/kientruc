import React from 'react';
import { ImageFile } from '../types';
import { Plus, Check, AlertCircle, Film, X } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface BottomFilmstripProps {
  files: ImageFile[];
  onFilesAdded: (files: File[]) => void;
  selectedId?: string; 
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const BottomFilmstrip: React.FC<BottomFilmstripProps> = ({ files, onFilesAdded, selectedId, onSelect, onDelete }) => {
  return (
    <div className="h-48 bg-white/95 dark:bg-[#0C2B4E]/95 border-t border-slate-200 dark:border-navy-700 flex flex-col shrink-0 z-20 backdrop-blur-md transition-colors shadow-[0_-5px_30px_rgba(0,0,0,0.05)]">
      <div className="h-10 px-6 flex items-center justify-between border-b border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/50">
        <div className="flex items-center gap-2">
            <Film size={14} className="text-red-accent" />
            <span className="text-[10px] font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest">Danh sách ảnh ({files.length})</span>
        </div>
      </div>
      
      <div className="flex-1 flex items-center overflow-x-auto px-6 gap-4 custom-scrollbar py-2 bg-white dark:bg-[#0C2B4E]">
        {/* Add Button - Fixed Size */}
        <div className="shrink-0 w-32 flex flex-col gap-2 h-full justify-center pb-2">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-navy-600 hover:border-teal-main bg-slate-50 dark:bg-navy-800 transition-colors shadow-sm hover:shadow-md group">
                 <ImageUploader onFilesAdded={onFilesAdded} hasFiles={true} />
            </div>
            {/* Spacer to match text height */}
            <div className="h-3"></div>
        </div>

        {/* Thumbnails */}
        {files.map((file) => {
            const isSelected = selectedId === file.id;
            return (
                <div 
                    key={file.id} 
                    onClick={() => onSelect && onSelect(file.id)}
                    className="shrink-0 w-32 flex flex-col gap-2 group cursor-pointer relative h-full justify-center pb-2"
                >
                    <div className={`relative aspect-[4/3] w-full rounded-xl overflow-hidden transition-all duration-200
                        ${isSelected ? 'ring-2 ring-teal-main ring-offset-2 dark:ring-offset-navy-900 shadow-lg scale-[1.02]' : 'ring-1 ring-slate-200 dark:ring-navy-600 opacity-90 hover:opacity-100 hover:scale-[1.02]'}
                    `}>
                        <img 
                            src={file.status === 'completed' && file.resultUrl ? file.resultUrl : file.previewUrl} 
                            alt="thumb" 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Status Overlays */}
                        <div className="absolute top-1 right-1 pointer-events-none z-10">
                            {file.status === 'completed' && <div className="bg-teal-main text-white p-0.5 rounded-full shadow-sm"><Check size={10} strokeWidth={4} /></div>}
                            {file.status === 'error' && <AlertCircle size={14} className="text-red-accent bg-white rounded-full shadow-sm" />}
                            {file.status === 'processing' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shadow-sm" />}
                        </div>
                    </div>

                    {/* DELETE BUTTON */}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                            className="absolute top-0 right-0 w-6 h-6 bg-white dark:bg-navy-700 text-red-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 hover:bg-red-accent hover:text-white z-20 translate-x-1/3 -translate-y-1/3"
                            title="Xóa"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    )}

                    <p className={`text-[10px] truncate text-center font-bold px-1 transition-colors ${isSelected ? 'text-teal-main dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-main'}`}>
                        {file.file.name}
                    </p>
                </div>
            );
        })}
      </div>
    </div>
  );
};