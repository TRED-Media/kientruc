import React, { useState, useEffect, useRef } from 'react';
import { ImageFile } from '../types';
import { Download, EyeOff, Maximize2, Eraser, MoveHorizontal, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageCardProps {
  image: ImageFile;
  globalCompareMode: boolean;
  viewMode: 'grid' | 'compact' | 'single';
  isMaskingMode?: boolean;
  onManualProcess?: (id: string, maskData: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  globalCompareMode, 
  viewMode, 
  isMaskingMode,
  onManualProcess
}) => {
  const [localShowOriginal, setLocalShowOriginal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Masking states
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  
  // Compare Slider states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // --- ZOOM / PAN STATE FOR MODAL ---
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const zoomStep = 0.2;

  useEffect(() => {
    setLocalShowOriginal(globalCompareMode);
  }, [globalCompareMode]);

  // Reset zoom on open
  useEffect(() => {
    if (isModalOpen) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }
  }, [isModalOpen, image.id]);

  // Slider Logic (Single View)
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseDownSlider = (e: React.MouseEvent) => { setIsDraggingSlider(true); handleMove(e.clientX); };
  const onTouchStartSlider = (e: React.TouchEvent) => { setIsDraggingSlider(true); handleMove(e.touches[0].clientX); };
  const onMouseMoveSlider = (e: React.MouseEvent) => { if (isDraggingSlider) handleMove(e.clientX); };
  const onTouchMoveSlider = (e: React.TouchEvent) => { if (isDraggingSlider) handleMove(e.touches[0].clientX); };
  const onMouseUpSlider = () => setIsDraggingSlider(false);

  // --- ZOOM / PAN LOGIC (MODAL) ---
  
  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation(); 
      const delta = -Math.sign(e.deltaY) * zoomStep;
      const newScale = Math.min(Math.max(1, scale + delta), 5); // 1x to 5x
      
      setScale(newScale);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
  };

  // Dragging (Pan) - Mouse
  const handleMouseDownImage = (e: React.MouseEvent) => {
      if (scale > 1) {
          e.preventDefault();
          setIsDraggingImage(true);
          setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      }
  };

  const handleMouseMoveImage = (e: React.MouseEvent) => {
      if (isDraggingImage && scale > 1) {
          e.preventDefault();
          setTranslate({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUpImage = () => {
      setIsDraggingImage(false);
  };

  // Dragging (Pan) - Touch
  const handleTouchStartImage = (e: React.TouchEvent) => {
      if (scale > 1 && e.touches.length === 1) {
          setIsDraggingImage(true);
          setDragStart({ x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y });
      }
  };

  const handleTouchMoveImage = (e: React.TouchEvent) => {
      if (isDraggingImage && scale > 1 && e.touches.length === 1) {
          setTranslate({
              x: e.touches[0].clientX - dragStart.x,
              y: e.touches[0].clientY - dragStart.y
          });
      }
  };

  const handleTouchEndImage = () => {
      setIsDraggingImage(false);
  };

  const resetZoom = (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale(1);
      setTranslate({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isMaskingMode && canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#E62727'; // Red Mask
            ctx.lineWidth = Math.max(20, img.naturalWidth / 80); 
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }
  }, [isMaskingMode, viewMode, image.previewUrl]);

  const isCompleted = image.status === 'completed' && image.resultUrl;
  const showOriginal = localShowOriginal; 
  const displayUrl = (!isCompleted) ? image.previewUrl : image.resultUrl;
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Masking Logic
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width; 
      const scaleY = canvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaskingMode || !canvasRef.current) return;
    setIsDrawing(true);
    setHasMask(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoordinates(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoordinates(clientX, clientY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleGenMask = () => {
      if (canvasRef.current && onManualProcess) {
          const maskData = canvasRef.current.toDataURL('image/png');
          onManualProcess(image.id, maskData);
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHasMask(false);
      }
  };

  if (viewMode === 'compact') {
      return (
        <div className="group relative bg-white dark:bg-navy-800 rounded-lg overflow-hidden border border-slate-200 dark:border-navy-600 hover:border-teal-main transition-all cursor-pointer shadow-md" onClick={toggleModal}>
             <div className="aspect-[4/3] w-full relative">
                <img src={image.resultUrl || image.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                {image.status === 'processing' && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                         <div className="w-5 h-5 border-2 border-teal-main border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                 {isCompleted && <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-teal-main shadow-[0_0_5px_rgba(29,84,108,0.5)]" />}
             </div>
        </div>
      )
  }

  if (viewMode === 'single') {
    return (
      <div className="w-full h-full flex flex-col bg-[#F4F7FA] dark:bg-[#051525] transition-colors">
        <div 
            className="flex-1 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden"
            ref={containerRef}
            onMouseMove={isDraggingSlider ? onMouseMoveSlider : undefined}
            onTouchMove={isDraggingSlider ? onTouchMoveSlider : undefined}
            onMouseUp={onMouseUpSlider}
            onMouseLeave={onMouseUpSlider}
            onTouchEnd={onMouseUpSlider}
        >
             <div className="relative w-full h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-[#0C2B4E] border border-slate-200 dark:border-navy-700">
                
                {isCompleted && showOriginal && !isMaskingMode ? (
                    <>
                        <img src={image.resultUrl} alt="After" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" draggable={false} />
                        <img src={image.previewUrl} alt="Before" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10"
                            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                            draggable={false}
                        />
                        {/* Modern Slider Handle */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-teal-main cursor-ew-resize z-20 hover:shadow-[0_0_10px_#1D546C]"
                            style={{ left: `${sliderPosition}%` }}
                            onMouseDown={onMouseDownSlider}
                            onTouchStart={onTouchStartSlider}
                        >
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white backdrop-blur-md border border-teal-main rounded-full flex items-center justify-center shadow-lg transform active:scale-90 transition-transform">
                                 <MoveHorizontal size={14} className="text-teal-main" />
                             </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-navy-900 dark:text-white z-20 uppercase tracking-widest border border-slate-200 dark:border-navy-600">Trước</div>
                        <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-teal-main z-10 uppercase tracking-widest border border-slate-200 dark:border-navy-600">Sau</div>
                    </>
                ) : (
                    <>
                        <img ref={imageRef} src={(!isCompleted) ? image.previewUrl : image.resultUrl} alt="View" className="max-w-full max-h-full object-contain block" draggable={false} />
                        {isMaskingMode && (
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-20" style={{ objectFit: 'contain' }}
                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                            />
                        )}
                    </>
                )}
             </div>
            
            {image.status === 'processing' && (
                <div className="absolute inset-0 z-30 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 border-2 border-slate-200 dark:border-navy-600 border-t-teal-main rounded-full animate-spin mb-4" />
                    <span className="text-xs font-bold text-teal-main uppercase tracking-[0.3em] animate-pulse">Processing...</span>
                </div>
            )}
            
            {isMaskingMode && hasMask && (
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                    <button onClick={handleGenMask} className="bg-red-accent hover:bg-red-hover text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transform hover:-translate-y-1 transition-all">
                        <Eraser size={18} /> Xử lý Mask
                    </button>
                 </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="h-16 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E] flex items-center justify-between px-6 shrink-0 transition-colors">
             <div className="text-sm font-medium text-navy-900 dark:text-white truncate max-w-xs">{image.file.name}</div>
             <div className="flex items-center gap-4">
                {isCompleted && (
                    <button onClick={() => setLocalShowOriginal(!localShowOriginal)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider ${showOriginal ? 'bg-teal-main text-white' : 'bg-slate-100 dark:bg-navy-800 text-teal-main dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'}`}>
                        <MoveHorizontal size={16} /> So sánh
                    </button>
                )}
                 {isCompleted && (
                    <a href={image.resultUrl} download={`t-red-${image.id}.png`} className="flex items-center gap-2 px-5 py-2 bg-teal-main hover:bg-teal-light text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md">
                        <Download size={16} /> Tải về
                    </a>
                )}
             </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <>
      <div className="group relative bg-white dark:bg-navy-800 rounded-xl overflow-hidden border border-slate-200 dark:border-navy-600 hover:border-teal-main transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:-translate-y-1">
        {image.status === 'processing' && (
          <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-8 h-8 border-2 border-slate-200 dark:border-navy-600 border-t-teal-main rounded-full animate-spin" />
          </div>
        )}

        <div className="aspect-[4/3] w-full relative shrink-0 cursor-pointer overflow-hidden">
            <img src={image.status === 'completed' && image.resultUrl ? image.resultUrl : image.previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {isCompleted && (
                 <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-teal-main flex items-center justify-center shadow-lg text-white">
                    <Check size={14} strokeWidth={4} />
                 </div>
            )}
        </div>

        <div className="p-4 bg-white dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex-1 flex justify-between items-center transition-colors">
             <span className="text-xs text-navy-900 dark:text-white font-medium truncate max-w-[120px]">{image.file.name}</span>
             <div className="flex gap-2">
                <button onClick={toggleModal} className="p-2 text-teal-main dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"><Maximize2 size={16} /></button>
                {isCompleted && (
                    <a href={image.resultUrl} download={`t-red-${image.id}.png`} className="p-2 text-red-accent hover:bg-red-accent/10 rounded-lg transition-colors"><Download size={16} /></a>
                )}
            </div>
        </div>
      </div>
      
      {/* Modal View with Zoom */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 dark:bg-navy-950/95 backdrop-blur-md overflow-hidden" 
          onClick={toggleModal}
        >
            <div 
                className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none" 
                onWheel={handleWheel}
                onMouseDown={handleMouseDownImage}
                onMouseMove={handleMouseMoveImage}
                onMouseUp={handleMouseUpImage}
                onMouseLeave={handleMouseUpImage}
                onTouchStart={handleTouchStartImage}
                onTouchMove={handleTouchMoveImage}
                onTouchEnd={handleTouchEndImage}
            >
                <img 
                    src={displayUrl} 
                    className="max-w-none transition-transform duration-75 ease-linear" 
                    style={{ 
                        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                        cursor: scale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
                        maxHeight: '100%',
                        maxWidth: '100%'
                    }}
                    onClick={(e) => e.stopPropagation()} 
                    draggable={false}
                />
                
                {/* Floating Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={toggleModal} className="text-navy-900 dark:text-white hover:text-red-accent p-3 bg-white dark:bg-navy-800 rounded-full shadow-lg border border-slate-200 dark:border-navy-600 transition-all hover:scale-110">
                        <EyeOff size={24} />
                    </button>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/80 dark:bg-navy-800/80 backdrop-blur rounded-full shadow-xl border border-slate-200 dark:border-navy-600" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setScale(s => Math.max(1, s - 0.5))} className="text-teal-main dark:text-white hover:text-red-accent"><ZoomOut size={20}/></button>
                    <span className="text-xs font-bold font-mono min-w-[3rem] text-center text-navy-900 dark:text-white">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(5, s + 0.5))} className="text-teal-main dark:text-white hover:text-red-accent"><ZoomIn size={20}/></button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-navy-600 mx-2"></div>
                    <button onClick={resetZoom} className="text-teal-main dark:text-white hover:text-red-accent flex items-center gap-1 text-xs font-bold uppercase"><RotateCcw size={16}/> Reset</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};