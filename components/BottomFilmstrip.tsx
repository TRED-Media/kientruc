import React from 'react';
import { ImageFile } from '../types';
import { Plus, Check, AlertCircle, Film } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface BottomFilmstripProps {
  files: ImageFile[];
  onFilesAdded: (files: File[]) => void;
  selectedId?: string; 
  onSelect?: (id: string) => void;
}

export const BottomFilmstrip: React.FC<BottomFilmstripProps> = ({ files, onFilesAdded, selectedId, onSelect }) => {
  return (
    <div className="h-48 bg-white dark:bg-[#0C2B4E] border-t border-slate-200 dark:border-navy-700 flex flex-col shrink-0 z-20 backdrop-blur-xl transition-colors">
      <div className="h-10 px-6 flex items-center justify-between border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
            <Film size={14} className="text-red-accent" />
            <span className="text-[10px] font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest">Danh sách ảnh ({files.length})</span>
        </div>
      </div>
      
      <div className="flex-1 flex items-center overflow-x-auto px-6 gap-4 custom-scrollbar py-2">
        {/* Add Button */}
        <div className="shrink-0 w-32 flex flex-col gap-2">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-dashed border-slate-300 dark:border-navy-600 hover:border-teal-main bg-slate-50 dark:bg-navy-800 transition-colors">
                 <ImageUploader onFilesAdded={onFilesAdded} hasFiles={true} />
            </div>
            {/* Spacer for alignment */}
            <div className="h-3"></div>
        </div>

        {/* Thumbnails */}
        {files.map((file) => {
            const isSelected = selectedId === file.id;
            return (
                <div 
                    key={file.id} 
                    onClick={() => onSelect && onSelect(file.id)}
                    className="shrink-0 w-32 flex flex-col gap-2 group cursor-pointer"
                >
                    <div className={`relative aspect-[4/3] rounded-lg overflow-hidden transition-all transform duration-200
                        ${isSelected ? 'ring-2 ring-teal-main shadow-md scale-105' : 'ring-1 ring-slate-200 dark:ring-navy-600 opacity-90 hover:opacity-100 hover:scale-105'}
                    `}>
                        <img 
                            src={file.status === 'completed' && file.resultUrl ? file.resultUrl : file.previewUrl} 
                            alt="thumb" 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Status Overlays */}
                        <div className="absolute top-1 right-1">
                            {file.status === 'completed' && <div className="bg-teal-main text-white p-0.5 rounded-full"><Check size={10} strokeWidth={4} /></div>}
                            {file.status === 'error' && <AlertCircle size={14} className="text-red-accent bg-white rounded-full" />}
                            {file.status === 'processing' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        </div>
                    </div>

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