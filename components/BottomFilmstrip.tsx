
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
    <div className="h-40 bg-white/95 dark:bg-[#0C2B4E]/95 border-t border-slate-200 dark:border-navy-700 flex flex-col shrink-0 z-20 backdrop-blur-md shadow-[0_-5px_30px_rgba(0,0,0,0.05)]">
      <div className="h-8 px-4 flex items-center justify-between border-b border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/50">
        <div className="flex items-center gap-2">
            <Film size={14} className="text-red-accent" />
            <span className="text-[10px] font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest">Danh sách ảnh ({files.length})</span>
        </div>
      </div>
      
      <div className="flex-1 flex items-center overflow-x-auto px-4 gap-3 custom-scrollbar py-2 bg-white dark:bg-[#0C2B4E]">
        <div className="shrink-0 w-28 h-full pb-1">
            <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 dark:border-navy-600 hover:border-teal-main bg-slate-50 dark:bg-navy-800 transition-colors">
                 <ImageUploader onFilesAdded={onFilesAdded} hasFiles={true} />
            </div>
        </div>

        {files.map((file) => {
            const isSelected = selectedId === file.id;
            return (
                <div 
                    key={file.id} 
                    onClick={() => onSelect && onSelect(file.id)}
                    className="shrink-0 w-28 h-full flex flex-col gap-1 cursor-pointer group pb-1"
                >
                    <div className={`relative flex-1 rounded-lg overflow-hidden transition-all duration-200 bg-slate-100 dark:bg-navy-900 border
                        ${isSelected ? 'border-teal-main ring-1 ring-teal-main' : 'border-slate-200 dark:border-navy-700 hover:border-teal-main'}
                    `}>
                        {/* OBJECT CONTAIN FOR THUMBNAILS TO SHOW FULL IMAGE */}
                        <img 
                            src={file.status === 'completed' && file.resultUrl ? file.resultUrl : file.previewUrl} 
                            alt="thumb" 
                            className="w-full h-full object-contain bg-slate-50 dark:bg-black/20"
                        />
                        
                        <div className="absolute top-1 right-1 z-10">
                            {file.status === 'completed' && <div className="bg-teal-main text-white p-0.5 rounded-full shadow-sm"><Check size={8} strokeWidth={4} /></div>}
                            {file.status === 'error' && <AlertCircle size={12} className="text-red-accent bg-white rounded-full" />}
                            {file.status === 'processing' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        </div>
                    </div>
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="absolute -top-1 -right-1 bg-red-accent text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"><X size={10} /></button>
                    )}
                    <p className={`text-[9px] truncate text-center font-bold ${isSelected ? 'text-teal-main' : 'text-slate-400'}`}>{file.file.name}</p>
                </div>
            );
        })}
      </div>
    </div>
  );
};
