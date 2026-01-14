
import React, { useState, useEffect, useRef } from 'react';
import { ImageFile } from '../types';
import { Download, Eraser, MoveHorizontal, Check, ZoomIn, ZoomOut, Trash2, Brush, Wand2, X } from 'lucide-react';

interface ImageCardProps {
  image: ImageFile;
  globalCompareMode: boolean;
  viewMode: 'grid' | 'compact' | 'single';
  isMaskingMode?: boolean;
  onManualProcess?: (id: string, maskData: string, maskPrompt?: string) => void;
  onDelete?: (id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  globalCompareMode, 
  viewMode, 
  isMaskingMode,
  onManualProcess,
  onDelete
}) => {
  const [localShowOriginal, setLocalShowOriginal] = useState(false);
  const [isZoomMode, setIsZoomMode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  
  // Masking states
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(30); 
  const [showMaskMenu, setShowMaskMenu] = useState(false);
  const [maskAction, setMaskAction] = useState<'NONE' | 'REPLACE'>('NONE');
  const [maskPrompt, setMaskPrompt] = useState('');

  // Slider & Zoom states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setLocalShowOriginal(globalCompareMode);
  }, [globalCompareMode]);

  useEffect(() => {
    if (!isZoomMode) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }
  }, [isZoomMode, image.id]);

  useEffect(() => {
    setHasMask(false);
    setShowMaskMenu(false);
    setMaskAction('NONE');
    setMaskPrompt('');
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [image.id, isMaskingMode]);

  // --- MASK CANVAS SYNC LOGIC (CRITICAL FOR PC FIT) ---
  useEffect(() => {
      const syncCanvasSize = () => {
          if (isMaskingMode && canvasRef.current && imageRef.current && containerRef.current) {
              const img = imageRef.current;
              const canvas = canvasRef.current;
              
              // 1. Sync internal resolution to natural image size
              if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
              }

              // 2. Calculate displayed size based on object-contain logic
              // We must determine the exact dimensions of the rendered image on screen
              const containerRect = containerRef.current.getBoundingClientRect();
              const containerAspect = containerRect.width / containerRect.height;
              const imageAspect = img.naturalWidth / img.naturalHeight;

              let renderWidth, renderHeight;

              if (containerAspect > imageAspect) {
                  // Container is wider -> Height is constrained
                  renderHeight = containerRect.height;
                  renderWidth = containerRect.height * imageAspect;
              } else {
                  // Container is taller -> Width is constrained
                  renderWidth = containerRect.width;
                  renderHeight = containerRect.width / imageAspect;
              }

              // 3. Apply calculated size to canvas CSS to match visual image exactly
              canvas.style.width = `${renderWidth}px`;
              canvas.style.height = `${renderHeight}px`;
              
              // 4. Center the canvas
              canvas.style.position = 'absolute';
              canvas.style.left = '50%';
              canvas.style.top = '50%';
              canvas.style.transform = 'translate(-50%, -50%)';

              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
              }
          }
      };

      syncCanvasSize();
      const observer = new ResizeObserver(syncCanvasSize);
      if (containerRef.current) observer.observe(containerRef.current);
      window.addEventListener('resize', syncCanvasSize);

      return () => {
          observer.disconnect();
          window.removeEventListener('resize', syncCanvasSize);
      };
  }, [isMaskingMode, viewMode, image.previewUrl]);

  // --- INTERACTION LOGIC ---
  const handleMove = (clientX: number) => {
    if (!imageWrapperRef.current || isZoomMode) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };
  
  // Slider Events
  const onMouseDownSlider = (e: React.MouseEvent) => { if(!isZoomMode) { setIsDraggingSlider(true); handleMove(e.clientX); }};
  const onTouchStartSlider = (e: React.TouchEvent) => { if(!isZoomMode) { setIsDraggingSlider(true); handleMove(e.touches[0].clientX); }};
  const onMouseMoveSlider = (e: React.MouseEvent) => { if (isDraggingSlider) handleMove(e.clientX); };
  const onTouchMoveSlider = (e: React.TouchEvent) => { if (isDraggingSlider) handleMove(e.touches[0].clientX); };
  const onMouseUpSlider = () => setIsDraggingSlider(false);

  // Drawing Events
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width; 
      const scaleY = canvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaskingMode || !canvasRef.current || !imageRef.current) return;
    setIsDrawing(true);
    setHasMask(true);
    setShowMaskMenu(false);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const width = Math.max(5, (imageRef.current.naturalWidth / 1000) * brushSize);
    ctx.lineWidth = width;
    ctx.strokeStyle = '#E62727';
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoordinates(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoordinates(clientX, clientY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => { if (isDrawing) { setIsDrawing(false); setShowMaskMenu(true); setMaskAction('NONE'); }};

  // Zoom Events
  const handleWheel = (e: React.WheelEvent) => {
      if (!isZoomMode) return;
      e.preventDefault(); e.stopPropagation();
      const delta = -Math.sign(e.deltaY) * 0.2;
      const newScale = Math.min(Math.max(1, scale + delta), 10);
      if (newScale <= 1) { setIsZoomMode(false); setScale(1); setTranslate({x:0,y:0}); return; }
      setScale(newScale);
  };

  const toggleZoomMode = () => {
      if (isZoomMode) { setIsZoomMode(false); setScale(1); setTranslate({x:0, y:0}); } 
      else { setIsZoomMode(true); setScale(2); setTranslate({x:0, y:0}); }
  };

  // Action Handlers
  const handleProcessRemove = () => {
      if (canvasRef.current && onManualProcess) {
          const maskData = canvasRef.current.toDataURL('image/png');
          onManualProcess(image.id, maskData, undefined);
          const ctx = canvasRef.current.getContext('2d');
          if(ctx) ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);
          setHasMask(false);
          setShowMaskMenu(false);
      }
  };

  const isCompleted = image.status === 'completed' && image.resultUrl;
  const showOriginal = localShowOriginal; 

  // --- RENDER ---
  if (viewMode === 'compact') {
      return (
        <div className="group relative bg-white dark:bg-navy-800 rounded-lg overflow-hidden border border-slate-200 dark:border-navy-600 hover:border-teal-main transition-all cursor-pointer shadow-md">
             <div className="aspect-[4/3] w-full relative">
                <img src={image.resultUrl || image.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                {image.status === 'processing' && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center"><div className="w-5 h-5 border-2 border-teal-main border-t-transparent rounded-full animate-spin" /></div>}
             </div>
        </div>
      )
  }

  if (viewMode === 'single') {
    return (
      <div className="w-full h-full flex flex-col bg-[#F4F7FA] dark:bg-[#051525] relative overflow-hidden">
        {/* VIEWPORT */}
        <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full bg-[#F4F7FA] dark:bg-[#051525]"
            ref={containerRef}
            onMouseMove={isDraggingSlider ? onMouseMoveSlider : undefined}
            onTouchMove={isDraggingSlider ? onTouchMoveSlider : undefined}
            onMouseUp={() => { onMouseUpSlider(); stopDrawing(); }}
            onWheel={handleWheel}
        >
             {/* IMAGE WRAPPER - FORCE CONTAIN */}
             <div 
                ref={imageWrapperRef}
                className="relative flex items-center justify-center"
                style={{ 
                    // KEY FIX: Use strict 100% when not zoomed to force object-contain behavior
                    width: isZoomMode ? 'auto' : '100%', 
                    height: isZoomMode ? 'auto' : '100%',
                    transform: isZoomMode ? `translate(${translate.x}px, ${translate.y}px) scale(${scale})` : 'none',
                    cursor: isZoomMode ? (scale > 1 ? 'grab' : 'zoom-out') : 'default'
                }}
             >
                {/* BRANCH: COMPARE */}
                {isCompleted && showOriginal && !isMaskingMode && !isZoomMode ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={image.resultUrl} className="w-full h-full object-contain pointer-events-none block" draggable={false} />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}>
                             <img src={image.previewUrl} className="w-full h-full object-contain pointer-events-none block" draggable={false} />
                        </div>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-teal-main cursor-ew-resize z-20" style={{ left: `${sliderPosition}%` }} onMouseDown={onMouseDownSlider} onTouchStart={onTouchStartSlider}>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-teal-main rounded-full flex items-center justify-center shadow-lg"><MoveHorizontal size={14} className="text-teal-main" /></div>
                        </div>
                    </div>
                ) : (
                    /* BRANCH: STANDARD VIEW */
                    <div className="relative flex items-center justify-center w-full h-full">
                        <img 
                            ref={imageRef} 
                            src={(!isCompleted) ? image.previewUrl : image.resultUrl} 
                            className="w-full h-full object-contain block select-none" 
                            draggable={false} 
                        />
                        {isMaskingMode && !isZoomMode && (
                            <canvas 
                                ref={canvasRef} 
                                className="z-20 cursor-crosshair touch-none"
                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                            />
                        )}
                    </div>
                )}
             </div>

            {/* OVERLAYS */}
            {!isMaskingMode && (
                <button onClick={toggleZoomMode} className="absolute bottom-6 right-6 z-30 p-3 rounded-full shadow-xl bg-white dark:bg-navy-800 text-teal-main hover:scale-110 transition-transform">
                    {isZoomMode ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
                </button>
            )}
            
            {image.status === 'processing' && (
                <div className="absolute inset-0 z-30 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 border-2 border-slate-200 border-t-teal-main rounded-full animate-spin mb-4" />
                    <span className="text-xs font-bold text-teal-main animate-pulse">ĐANG XỬ LÝ...</span>
                </div>
            )}
            
            {/* MASKING UI */}
            {isMaskingMode && hasMask && showMaskMenu && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-navy-900 rounded-xl shadow-2xl p-3 flex gap-2 border border-slate-200 dark:border-navy-600 animate-in slide-in-from-bottom-5">
                     <button onClick={handleProcessRemove} className="flex flex-col items-center gap-1 p-3 hover:bg-red-50 text-red-accent rounded-lg"><Eraser size={20} /><span className="text-[9px] font-bold">XÓA</span></button>
                     <div className="w-px bg-slate-200 dark:bg-navy-700"></div>
                     <button onClick={() => { const ctx = canvasRef.current?.getContext('2d'); if(ctx) ctx.clearRect(0,0,9999,9999); setHasMask(false); setShowMaskMenu(false); }} className="flex flex-col items-center gap-1 p-3 hover:bg-slate-50 text-slate-500 rounded-lg"><X size={20} /><span className="text-[9px] font-bold">HỦY</span></button>
                 </div>
            )}
            {isMaskingMode && !showMaskMenu && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-navy-900/90 rounded-full px-4 py-2 flex items-center gap-3 border shadow-lg">
                    <Brush size={14} className="text-teal-main" />
                    <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 h-1 bg-slate-200 rounded-lg accent-teal-main" />
                </div>
            )}
        </div>

        {/* HEADER BAR */}
        <div className="h-14 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E] flex items-center justify-between px-6 shrink-0 z-30">
             <div className="text-sm font-bold text-navy-900 dark:text-white truncate">{image.file.name}</div>
             <div className="flex items-center gap-3">
                {isCompleted && (
                    <button onClick={() => setLocalShowOriginal(!localShowOriginal)} disabled={isZoomMode} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 text-teal-main rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors">
                        <MoveHorizontal size={16} /> So sánh
                    </button>
                )}
                 {isCompleted && (
                    <a href={image.resultUrl} download={`t-red-${image.id}.png`} className="flex items-center gap-2 px-4 py-2 bg-teal-main text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-light transition-colors">
                        <Download size={16} /> Tải về
                    </a>
                )}
                {onDelete && <button onClick={() => onDelete(image.id)} className="p-2 text-red-accent hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
             </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
      <div className="group relative bg-white dark:bg-navy-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 hover:border-teal-main transition-all shadow-sm hover:shadow-lg flex flex-col h-full">
        <div className="aspect-[4/3] w-full relative bg-slate-100 dark:bg-navy-900 overflow-hidden">
            <img src={image.status === 'completed' && image.resultUrl ? image.resultUrl : image.previewUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {image.status === 'processing' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-main border-t-transparent rounded-full animate-spin" /></div>}
            {isCompleted && <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-teal-main flex items-center justify-center text-white shadow-md"><Check size={14} strokeWidth={4} /></div>}
        </div>
        <div className="p-3 flex justify-between items-center bg-white dark:bg-navy-800">
             <span className="text-xs font-bold truncate">{image.file.name}</span>
             {isCompleted && <a href={image.resultUrl} download className="text-teal-main"><Download size={16} /></a>}
        </div>
      </div>
  );
};
