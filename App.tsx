import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { AdjustmentPanel } from './components/AdjustmentPanel';
import { BottomFilmstrip } from './components/BottomFilmstrip';
import { ImageUploader } from './components/ImageUploader';
import { ImageCard } from './components/ImageCard';
import { CostModal } from './components/CostModal';
import { ImageFile, ProcessingOptions } from './types';
import { DEFAULT_OPTIONS } from './constants';
import { processImageWithGemini } from './services/geminiService';
import { Key, Lock, ArrowRight, Menu, Sliders, Moon, Sun, ChevronRight, Images } from 'lucide-react';

const App = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [options, setOptions] = useState<ProcessingOptions>(DEFAULT_OPTIONS);
  const [projectContext, setProjectContext] = useState('');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'single'>('grid'); 
  const [globalCompareMode, setGlobalCompareMode] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(undefined);
  
  // Mobile/Tablet Panel States
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  // Mobile Filmstrip State
  const [showFilmstrip, setShowFilmstrip] = useState(true); // Desktop default: true

  // Masking Mode State
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  
  // Cost Modal State
  const [showCostModal, setShowCostModal] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Responsive Init
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 1024) {
              setShowFilmstrip(false); // Hide on mobile by default
          } else {
              setShowFilmstrip(true);
          }
      };
      // Set initial state
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check API Key on Mount
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const has = await aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Global Key Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Avoid triggers when typing
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const key = e.key.toLowerCase();
        
        if (key === 'y') {
            setGlobalCompareMode(prev => !prev);
        }
        
        if (key === 'i') {
            setViewMode(prev => prev === 'grid' ? 'single' : 'grid');
            setIsMaskingMode(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilesAdded = (newFiles: File[]) => {
    const newImageFiles: ImageFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    setFiles(prev => {
        const updated = [...prev, ...newImageFiles];
        return updated;
    });

    if (newImageFiles.length > 0) {
        setSelectedImageId(newImageFiles[0].id);
        // On mobile, if first file added, open filmstrip briefly or switch to single view
        if (window.innerWidth < 1024) setShowFilmstrip(true);
    }
    setViewMode('single');
  };

  const handleStartProcess = () => {
    const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
    if (pendingCount === 0) return;
    setShowCostModal(true);
  };

  const handleConfirmCost = () => {
    setShowCostModal(false);
    processBatch();
    setShowRightPanel(false);
  };

  const updateFileStatus = (id: string, status: ImageFile['status'], resultUrl?: string, errorMsg?: string) => {
    setFiles(currentFiles => 
      currentFiles.map(f => 
        f.id === id ? { ...f, status, resultUrl, errorMsg } : f
      )
    );
  };

  const handleManualMaskProcess = async (id: string, maskData: string) => {
     const imgFile = files.find(f => f.id === id);
     if (!imgFile) return;

     updateFileStatus(id, 'processing');
     
     try {
        const resultUrl = await processImageWithGemini(imgFile.file, {
            options,
            projectContext,
            extraPrompt
        }, maskData);
        updateFileStatus(id, 'completed', resultUrl);
     } catch (error: any) {
        updateFileStatus(imgFile.id, 'error', undefined, error.message || 'Lỗi xử lý Mask');
     }
  };

  const processBatch = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);

    const promises = pendingFiles.map(async (imgFile) => {
      updateFileStatus(imgFile.id, 'processing');
      try {
        const resultUrl = await processImageWithGemini(imgFile.file, {
          options,
          projectContext,
          extraPrompt
        });
        updateFileStatus(imgFile.id, 'completed', resultUrl);
      } catch (error: any) {
        console.error("Processing failed for", imgFile.id, error);
        updateFileStatus(imgFile.id, 'error', undefined, error.message || 'Lỗi không xác định');
      }
    });

    await Promise.allSettled(promises);
    setIsProcessing(false);
  };

  const handleDownloadAll = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.resultUrl);
    if (completedFiles.length === 0) return;

    completedFiles.forEach((file, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = file.resultUrl!;
            link.download = `t-red-${file.file.name.split('.')[0]}-processed.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 500);
    });
  };

  const selectedImage = files.find(f => f.id === selectedImageId) || files[0];

  if (!hasApiKey) {
    return (
      <div className="flex h-screen w-full bg-[#F4F7FA] dark:bg-[#051525] items-center justify-center p-4 transition-colors bg-grid-pattern">
        <div className="max-w-md w-full bg-white dark:bg-[#0C2B4E] border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xl p-8 text-center space-y-8 backdrop-blur-sm">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-navy-900 dark:text-white tracking-tighter">
                    T-RED <span className="text-red-accent">AI</span>
                </h1>
                <p className="text-teal-main dark:text-slate-300 text-sm font-medium uppercase tracking-widest">Hệ thống Diễn họa Kiến trúc AI</p>
            </div>
          
          <div className="w-20 h-20 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto border border-red-accent/30 shadow-[0_0_20px_rgba(230,39,39,0.1)]">
            <Lock className="text-red-accent" size={32} />
          </div>
          
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-red-accent hover:bg-red-hover text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
          >
            <Key size={20} strokeWidth={2.5} /> Kết nối API Key <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#F4F7FA] dark:bg-[#051525] overflow-hidden text-slate-900 dark:text-slate-100 font-sans select-none relative transition-colors duration-300 bg-grid-pattern">
      
      <CostModal 
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        onConfirm={handleConfirmCost}
        resolution={options.Resolution}
        imageCount={files.filter(f => f.status === 'pending' || f.status === 'error').length}
      />

        {/* --- MAIN HEADER --- */}
        <header className="h-14 lg:h-16 bg-white/80 dark:bg-[#0C2B4E]/80 backdrop-blur-md border-b border-slate-200 dark:border-navy-700 flex items-center justify-between px-4 lg:px-6 shrink-0 z-50 transition-colors shadow-sm">
             {/* Left: Brand */}
             <div className="flex items-center gap-4">
                 <div className="lg:hidden">
                    <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="p-2 text-teal-main dark:text-white hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"><Menu size={24} /></button>
                 </div>
                 <h1 className="text-xl lg:text-3xl font-black text-navy-900 dark:text-white tracking-tighter flex items-center gap-2">
                    <span className="text-red-accent">T-RED</span>
                    <span className="text-teal-main dark:text-slate-200 opacity-90 hidden sm:inline">ARCHITECT</span>
                    <span className="text-[10px] bg-teal-main/10 dark:bg-navy-800 text-teal-main dark:text-teal-light px-2 py-0.5 rounded font-bold uppercase tracking-widest self-start mt-1 hidden md:inline-block">Pro</span>
                 </h1>
             </div>

             {/* Right: Actions */}
             <div className="flex items-center gap-2">
                 {/* Theme Toggle */}
                 <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-lg text-teal-main dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Chế độ tối/sáng"
                 >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>

                 {/* Mobile Settings Toggle */}
                 <div className="lg:hidden">
                    <button onClick={() => setShowRightPanel(!showRightPanel)} className="p-2 text-red-accent bg-red-accent/10 rounded-lg"><Sliders size={20} /></button>
                 </div>
                 
                 {/* Desktop Shortcuts Hint */}
                 <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-700">
                    <div className={`w-2 h-2 rounded-full ${globalCompareMode ? 'bg-red-accent animate-pulse' : 'bg-teal-main'}`} />
                    <span className="text-[10px] text-teal-main dark:text-slate-400 font-mono uppercase">
                        HOTKEYS: <strong className="text-navy-900 dark:text-white">Y</strong> (COMPARE) • <strong className="text-navy-900 dark:text-white">I</strong> (VIEW)
                    </span>
                 </div>
             </div>
        </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 1. LEFT SIDEBAR (Input/Settings) */}
        <aside className={`
            fixed inset-y-0 left-0 z-40 bg-white dark:bg-[#0C2B4E] lg:bg-white dark:lg:bg-[#0C2B4E] border-r border-slate-200 dark:border-navy-700
            transform transition-transform duration-300 ease-out lg:relative lg:transform-none lg:flex flex-col
            ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}
            w-[85vw] sm:w-[380px] lg:w-[320px] h-full shadow-2xl lg:shadow-none transition-colors
        `}>
             <div className="flex-1 overflow-hidden flex flex-col">
                 <div className="lg:hidden p-4 flex justify-between items-center border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E]">
                    <span className="font-bold text-teal-main dark:text-white uppercase tracking-widest text-sm">Cấu hình đầu vào</span>
                    <button onClick={() => setShowLeftPanel(false)} className="text-slate-600 dark:text-slate-300 hover:text-red-accent"><ChevronRight /></button>
                 </div>
                 <ControlPanel 
                    options={options} 
                    setOptions={setOptions}
                    projectContext={projectContext}
                    setProjectContext={setProjectContext}
                    extraPrompt={extraPrompt}
                    setExtraPrompt={setExtraPrompt}
                    isMaskingMode={isMaskingMode}
                    setIsMaskingMode={setIsMaskingMode}
                    onFilesAdded={handleFilesAdded}
                 />
             </div>
        </aside>

        {/* Backdrop for Mobile Left */}
        {showLeftPanel && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setShowLeftPanel(false)} />}


        {/* 2. CENTER STAGE (Viewport) */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative transition-colors">
            
            {/* Viewport Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {/* Filmstrip Toggle - Mobile Bottom Right */}
                {files.length > 0 && (
                    <div className="lg:hidden absolute bottom-4 right-4 z-30 pointer-events-auto">
                        <button 
                            onClick={() => setShowFilmstrip(!showFilmstrip)}
                            className={`p-3 rounded-full shadow-xl flex items-center justify-center transition-all ${showFilmstrip ? 'bg-white dark:bg-navy-800 text-teal-main' : 'bg-teal-main text-white'}`}
                        >
                            <Images size={20} />
                        </button>
                    </div>
                )}

                {files.length === 0 ? (
                    <div className="w-full h-full p-6 flex flex-col items-center justify-center overflow-y-auto">
                         {/* Centered Image Uploader with Fixed Aspect Ratio - Fixes tablet stretching */}
                        <div className="w-full max-w-4xl aspect-[16/10] max-h-[80vh] rounded-3xl border-2 border-dashed border-slate-300 dark:border-navy-700 bg-white/60 dark:bg-navy-900/60 backdrop-blur-sm hover:bg-white dark:hover:bg-navy-800 hover:border-teal-main transition-all group relative flex flex-col shadow-sm hover:shadow-lg">
                             <ImageUploader onFilesAdded={handleFilesAdded} hasFiles={false} />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Render View */}
                        <div className="w-full h-full relative">
                            {viewMode === 'single' && selectedImage && (
                                <ImageCard 
                                    image={selectedImage}
                                    globalCompareMode={globalCompareMode}
                                    viewMode="single"
                                    isMaskingMode={isMaskingMode}
                                    onManualProcess={handleManualMaskProcess}
                                />
                            )}
                            {viewMode !== 'single' && (
                                <div className="w-full h-full overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                                    <div className={`grid gap-6 pb-20 ${
                                        viewMode === 'grid' 
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                                            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                                    }`}>
                                        {files.map(image => (
                                            <div key={image.id} onClick={() => { setSelectedImageId(image.id); setViewMode('single'); }} className="cursor-pointer">
                                                <ImageCard image={image} globalCompareMode={globalCompareMode} viewMode={viewMode} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Filmstrip (Timeline) - Conditionally Rendered */}
            {files.length > 0 && (
                <div className={`transition-all duration-300 ease-in-out overflow-hidden border-t border-slate-200 dark:border-navy-700 flex-shrink-0 ${showFilmstrip ? 'h-48' : 'h-0 border-none'}`}>
                     <BottomFilmstrip 
                        files={files} 
                        onFilesAdded={handleFilesAdded}
                        selectedId={selectedImageId}
                        onSelect={(id) => { setSelectedImageId(id); }}
                    />
                </div>
            )}
        </main>


        {/* 3. RIGHT SIDEBAR (Adjustments) */}
        <aside className={`
            fixed inset-y-0 right-0 z-50 bg-white dark:bg-[#0C2B4E] lg:bg-white dark:lg:bg-[#0C2B4E] border-l border-slate-200 dark:border-navy-700
            transform transition-transform duration-300 ease-out lg:relative lg:transform-none lg:flex flex-col
            ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}
            w-[85vw] sm:w-[380px] lg:w-[350px] h-full shadow-2xl lg:shadow-none transition-colors
        `}>
             <div className="flex-1 overflow-hidden flex flex-col">
                <div className="lg:hidden p-4 flex justify-between items-center border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E]">
                    <span className="font-bold text-teal-main dark:text-white uppercase tracking-widest text-sm">Tinh chỉnh & Xuất</span>
                    <button onClick={() => setShowRightPanel(false)} className="text-slate-600 dark:text-slate-300 hover:text-red-accent"><ChevronRight className="rotate-180"/></button>
                 </div>
                 <AdjustmentPanel 
                    options={options}
                    setOptions={setOptions}
                    isProcessing={isProcessing}
                    onProcess={handleStartProcess}
                    files={files}
                    onDownloadAll={handleDownloadAll}
                 />
             </div>
        </aside>

        {/* Backdrop for Mobile Right */}
        {showRightPanel && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setShowRightPanel(false)} />}

      </div>
    </div>
  );
};

export default App;