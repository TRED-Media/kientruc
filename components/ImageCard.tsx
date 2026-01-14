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
  
  // Zoom Mode State (Inline)
  const [isZoomMode, setIsZoomMode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Ref for the outer container (handling global mouse moves for slider)
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref for the inner wrapper
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  
  // Masking states
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(30); // Default brush size (1-100)
  
  // Mask Menu States
  const [showMaskMenu, setShowMaskMenu] = useState(false);
  const [maskAction, setMaskAction] = useState<'NONE' | 'REPLACE'>('NONE');
  const [maskPrompt, setMaskPrompt] = useState('');

  // Compare Slider states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // --- ZOOM / PAN STATE ---
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const zoomStep = 0.2;

  useEffect(() => {
    setLocalShowOriginal(globalCompareMode);
  }, [globalCompareMode]);

  // Reset zoom when switching images or modes
  useEffect(() => {
    if (!isZoomMode) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }
  }, [isZoomMode, image.id]);

  // Reset mask state when image changes
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

  // Slider Logic (Only active when NOT zoomed)
  const handleMove = (clientX: number) => {
    if (!imageWrapperRef.current || isZoomMode) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseDownSlider = (e: React.MouseEvent) => { 
      if(isZoomMode) return;
      setIsDraggingSlider(true); 
      handleMove(e.clientX); 
  };
  const onTouchStartSlider = (e: React.TouchEvent) => { 
      if(isZoomMode) return;
      setIsDraggingSlider(true); 
      handleMove(e.touches[0].clientX); 
  };
  const onMouseMoveSlider = (e: React.MouseEvent) => { if (isDraggingSlider) handleMove(e.clientX); };
  const onTouchMoveSlider = (e: React.TouchEvent) => { if (isDraggingSlider) handleMove(e.touches[0].clientX); };
  const onMouseUpSlider = () => setIsDraggingSlider(false);

  // --- ZOOM / PAN LOGIC ---
  const handleWheel = (e: React.WheelEvent) => {
      if (!isZoomMode) return;
      e.preventDefault();
      e.stopPropagation(); 

      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -Math.sign(e.deltaY) * zoomStep;
      const newScale = Math.min(Math.max(1, scale + delta), 10); 

      // IF ZOOM OUT COMPLETELY -> DISABLE ZOOM MODE
      if (newScale <= 1) {
          setIsZoomMode(false);
          setScale(1);
          setTranslate({ x: 0, y: 0 });
          return;
      }

      const scaleRatio = newScale / scale;
      const newX = mouseX - (mouseX - translate.x) * scaleRatio;
      const newY = mouseY - (mouseY - translate.y) * scaleRatio;

      setScale(newScale);
      setTranslate({ x: newX, y: newY });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (isMaskingMode) return; // Disable double click zoom when drawing mask
      
      if (isZoomMode) {
          setIsZoomMode(false);
          setScale(1);
          setTranslate({ x: 0, y: 0 });
      } else {
          setIsZoomMode(true);
          const container = containerRef.current;
          if (container) {
              const rect = container.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              const targetScale = 2; 
              const newX = mouseX - mouseX * targetScale;
              const newY = mouseY - mouseY * targetScale;
              setScale(targetScale);
              setTranslate({ x: newX, y: newY });
          } else {
              setScale(2);
              setTranslate({ x: 0, y: 0 });
          }
      }
  };

  const handleMouseDownImage = (e: React.MouseEvent) => {
      if (isZoomMode && scale > 1) {
          e.preventDefault();
          setIsDraggingImage(true);
          setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      }
  };

  const handleMouseMoveImage = (e: React.MouseEvent) => {
      if (isZoomMode && isDraggingImage && scale > 1) {
          e.preventDefault();
          setTranslate({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
          });
      }
  };

  const handleMouseUpImage = () => setIsDraggingImage(false);

  const handleTouchStartImage = (e: React.TouchEvent) => {
      if (isZoomMode && scale > 1 && e.touches.length === 1) {
          setIsDraggingImage(true);
          setDragStart({ x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y });
      }
  };

  const handleTouchMoveImage = (e: React.TouchEvent) => {
      if (isZoomMode && isDraggingImage && scale > 1 && e.touches.length === 1) {
          setTranslate({
              x: e.touches[0].clientX - dragStart.x,
              y: e.touches[0].clientY - dragStart.y
          });
      }
  };

  const toggleZoomMode = () => {
      if (isZoomMode) {
          setIsZoomMode(false); 
          setScale(1);
          setTranslate({ x: 0, y: 0 });
      } else {
          setIsZoomMode(true);
          setScale(2); 
          if (containerRef.current) {
             const rect = containerRef.current.getBoundingClientRect();
             const cx = rect.width / 2;
             const cy = rect.height / 2;
             setTranslate({ x: -cx, y: -cy }); 
          } else {
             setTranslate({ x: 0, y: 0 });
          }
      }
  };

  // --- MASKING LOGIC & CURSOR FIX ---

  // Sync Canvas Size with Rendered Image Size to fix cursor drift
  useEffect(() => {
      const syncCanvasSize = () => {
          if (isMaskingMode && canvasRef.current && imageRef.current) {
              const img = imageRef.current;
              const canvas = canvasRef.current;
              
              // 1. Set internal resolution (high quality)
              if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
              }

              // 2. Set display size (CSS) to match the rendered image exactly
              // This ensures getBoundingClientRect on canvas matches visual image
              canvas.style.width = `${img.width}px`;
              canvas.style.height = `${img.height}px`;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
              }
          }
      };

      // Run on init
      syncCanvasSize();

      // Watch for resize
      const observer = new ResizeObserver(syncCanvasSize);
      if (imageRef.current) observer.observe(imageRef.current);

      return () => observer.disconnect();
  }, [isMaskingMode, viewMode, image.previewUrl, scale, translate]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      
      // Calculate ratio between Natural Resolution and Displayed Resolution
      const scaleX = canvas.width / rect.width; 
      const scaleY = canvas.height / rect.height;
      
      return { 
          x: (clientX - rect.left) * scaleX, 
          y: (clientY - rect.top) * scaleY 
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaskingMode || !canvasRef.current || !imageRef.current) return;
    setIsDrawing(true);
    setHasMask(true);
    setShowMaskMenu(false); // Hide menu while drawing

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Brush Size Logic
    const calculatedWidth = Math.max(5, (imageRef.current.naturalWidth / 1000) * brushSize);
    ctx.lineWidth = calculatedWidth;
    ctx.strokeStyle = '#E62727';

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

  const stopDrawing = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setShowMaskMenu(true);
        setMaskAction('NONE'); // Reset to root menu
      }
  };

  const handleClearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasMask(false);
        setShowMaskMenu(false);
    }
  };

  const handleProcessRemove = () => {
      if (canvasRef.current && onManualProcess) {
          const maskData = canvasRef.current.toDataURL('image/png');
          onManualProcess(image.id, maskData, undefined); // No prompt = Remove
          handleClearMask();
      }
  };

  const handleProcessReplace = () => {
      if (canvasRef.current && onManualProcess && maskPrompt.trim()) {
          const maskData = canvasRef.current.toDataURL('image/png');
          onManualProcess(image.id, maskData, maskPrompt); // Prompt = Replace
          handleClearMask();
          setMaskPrompt('');
      }
  };

  const isCompleted = image.status === 'completed' && image.resultUrl;
  const showOriginal = localShowOriginal; 

  // Compact View (Thumbnail)
  if (viewMode === 'compact') {
      return (
        <div className="group relative bg-white dark:bg-navy-800 rounded-lg overflow-hidden border border-slate-200 dark:border-navy-600 hover:border-teal-main transition-all cursor-pointer shadow-md">
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

  // Single View (Main Editor)
  if (viewMode === 'single') {
    return (
      <div className="w-full h-full flex flex-col bg-[#F4F7FA] dark:bg-[#051525] transition-colors relative overflow-hidden">
        {/* Main Canvas Area */}
        <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden touch-none w-full h-full"
            ref={containerRef}
            onMouseMove={isDraggingSlider ? onMouseMoveSlider : (isZoomMode ? handleMouseMoveImage : undefined)}
            onTouchMove={isDraggingSlider ? onTouchMoveSlider : (isZoomMode ? handleTouchMoveImage : undefined)}
            onMouseUp={() => { onMouseUpSlider(); handleMouseUpImage(); stopDrawing(); }}
            onMouseLeave={() => { onMouseUpSlider(); handleMouseUpImage(); stopDrawing(); }}
            onTouchEnd={() => { onMouseUpSlider(); handleMouseUpImage(); stopDrawing(); }}
            onWheel={handleWheel}
            onMouseDown={isZoomMode ? handleMouseDownImage : undefined}
            onTouchStart={isZoomMode ? handleTouchStartImage : undefined}
            onDoubleClick={handleDoubleClick}
        >
             {/* Image Wrapper - Strict Object Contain */}
             <div 
                ref={imageWrapperRef}
                className="relative flex items-center justify-center"
                style={{ 
                    width: isZoomMode ? 'auto' : '100%', 
                    height: isZoomMode ? 'auto' : '100%',
                    maxWidth: isZoomMode ? 'none' : '100%',
                    maxHeight: isZoomMode ? 'none' : '100%',
                    transformOrigin: '0 0', 
                    transform: isZoomMode ? `translate(${translate.x}px, ${translate.y}px) scale(${scale})` : 'none',
                    transition: isDraggingImage ? 'none' : 'transform 0.1s ease-out',
                    cursor: isZoomMode ? (scale > 1 ? 'grab' : 'zoom-out') : 'default'
                }}
             >
                {/* BRANCH 1: COMPARE MODE */}
                {isCompleted && showOriginal && !isMaskingMode && !isZoomMode ? (
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                        <img 
                            src={image.resultUrl} 
                            alt="After" 
                            className="max-w-full max-h-full object-contain pointer-events-none select-none block" 
                            draggable={false} 
                        />
                        <div 
                             className="absolute inset-0 flex items-center justify-center"
                             style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                        >
                             <img 
                                src={image.previewUrl} 
                                alt="Before" 
                                className="max-w-full max-h-full object-contain pointer-events-none select-none block"
                                draggable={false}
                            />
                        </div>
                        
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
                    </div>
                ) : (
                    /* BRANCH 2: SINGLE IMAGE / ZOOM VIEW / MASK MODE */
                    <div className="relative flex items-center justify-center max-w-full max-h-full">
                        <img 
                            ref={imageRef} 
                            src={(!isCompleted) ? image.previewUrl : image.resultUrl} 
                            alt="View" 
                            className="max-w-full max-h-full object-contain block select-none" 
                            draggable={false} 
                        />
                        {isMaskingMode && !isZoomMode && (
                            <canvas 
                                ref={canvasRef} 
                                className="absolute top-1/2 left-1/2 cursor-crosshair touch-none z-20" 
                                style={{ 
                                    // Transform logic here ensures strict overlap regardless of flex parent
                                    transform: 'translate(-50%, -50%)',
                                    // Width/Height are set by JS logic to match rendered img exactly
                                }}
                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                            />
                        )}
                    </div>
                )}
             </div>

            {/* FLOATING ZOOM TOGGLE (Only if not masking) */}
            {!isMaskingMode && (
                <button 
                    onClick={toggleZoomMode}
                    className={`absolute bottom-6 right-6 z-30 p-3 rounded-full shadow-xl border border-slate-200 dark:border-navy-600 transition-all transform hover:scale-110 ${isZoomMode ? 'bg-teal-main text-white' : 'bg-white dark:bg-navy-800 text-teal-main dark:text-white'}`}
                >
                    {isZoomMode ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
                </button>
            )}
            
            {/* PROCESSING OVERLAY */}
            {image.status === 'processing' && (
                <div className="absolute inset-0 z-30 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                    <div className="w-12 h-12 border-2 border-slate-200 dark:border-navy-600 border-t-teal-main rounded-full animate-spin mb-4" />
                    <span className="text-xs font-bold text-teal-main uppercase tracking-[0.3em] animate-pulse">Processing...</span>
                </div>
            )}
            
            {/* --- MASKING UI OVERLAY (Floating Bottom Center) --- */}
            {isMaskingMode && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
                    
                    {/* 1. Mask Action Menu */}
                    {hasMask && showMaskMenu && maskAction === 'NONE' && (
                        <div className="bg-white/95 dark:bg-navy-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex flex-col gap-2 w-full animate-in slide-in-from-bottom-5 border border-slate-200 dark:border-navy-600 pointer-events-auto">
                             <div className="flex gap-2">
                                <button 
                                    onClick={handleProcessRemove}
                                    className="flex-1 flex flex-col items-center gap-1.5 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-accent border border-transparent hover:border-red-accent/20 transition-all group"
                                >
                                    <div className="bg-red-accent/10 p-2 rounded-full group-hover:scale-110 transition-transform"><Eraser size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">Xóa vật thể</span>
                                </button>
                                <div className="w-px bg-slate-200 dark:bg-navy-700 my-2"></div>
                                <button 
                                    onClick={() => setMaskAction('REPLACE')}
                                    className="flex-1 flex flex-col items-center gap-1.5 p-4 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-main dark:text-teal-light border border-transparent hover:border-teal-main/20 transition-all group"
                                >
                                    <div className="bg-teal-main/10 p-2 rounded-full group-hover:scale-110 transition-transform"><Wand2 size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">Thay thế...</span>
                                </button>
                             </div>
                             <button onClick={handleClearMask} className="w-full py-2 text-[9px] text-slate-400 font-bold uppercase hover:text-red-500 tracking-widest border-t border-slate-100 dark:border-navy-700 mt-1">Hủy & Vẽ lại</button>
                        </div>
                    )}

                    {/* 2. Replace Prompt Input */}
                    {hasMask && showMaskMenu && maskAction === 'REPLACE' && (
                        <div className="bg-white/95 dark:bg-navy-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 w-full animate-in slide-in-from-bottom-5 border border-slate-200 dark:border-navy-600 pointer-events-auto">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-teal-main uppercase tracking-wider">Nhập mô tả vật thể mới</span>
                                <button onClick={() => setMaskAction('NONE')}><X size={16} className="text-slate-400 hover:text-red-accent transition-colors" /></button>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={maskPrompt}
                                    onChange={(e) => setMaskPrompt(e.target.value)}
                                    placeholder="VD: Cái ghế sofa màu xanh, cây cọ..."
                                    className="flex-1 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-teal-main focus:ring-1 focus:ring-teal-main placeholder-slate-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleProcessReplace()}
                                />
                                <button 
                                    onClick={handleProcessReplace}
                                    disabled={!maskPrompt.trim()}
                                    className="bg-teal-main hover:bg-teal-light text-white p-3 rounded-xl disabled:opacity-50 transition-colors shadow-lg"
                                >
                                    <Wand2 size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Brush Controls (Visible when not in menu flow) */}
                    {!showMaskMenu && (
                        <div className="bg-white/90 dark:bg-navy-900/90 backdrop-blur-md px-5 py-3 rounded-full shadow-xl border border-slate-200 dark:border-navy-600 flex items-center gap-4 w-full pointer-events-auto transition-transform hover:scale-105">
                            <Brush size={16} className="text-teal-main dark:text-slate-300 shrink-0" />
                            <input 
                                type="range" 
                                min="1" 
                                max="100" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-navy-700 rounded-lg appearance-none cursor-pointer accent-teal-main"
                            />
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-navy-800 rounded-full border border-slate-200 dark:border-navy-600 shrink-0">
                                <div className="rounded-full bg-red-accent transition-all duration-200" style={{ width: Math.max(4, brushSize/4), height: Math.max(4, brushSize/4) }} />
                            </div>
                        </div>
                    )}
                 </div>
            )}
        </div>

        {/* Action Bar */}
        <div className="h-16 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-[#0C2B4E] flex items-center justify-between px-6 shrink-0 transition-colors z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
             <div className="text-sm font-bold text-navy-900 dark:text-white truncate max-w-xs flex items-center gap-2">
                <span className="text-slate-400 text-xs font-normal uppercase tracking-wider">File:</span>
                {image.file.name}
             </div>
             <div className="flex items-center gap-3">
                 
                <button 
                    onClick={toggleZoomMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider ${isZoomMode ? 'bg-teal-main text-white' : 'text-teal-main dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'}`}
                >
                    {isZoomMode ? <ZoomOut size={16} /> : <ZoomIn size={16} />} 
                    {isZoomMode ? 'Thu nhỏ' : 'Phóng to'}
                </button>

                <div className="w-px h-6 bg-slate-300 dark:bg-navy-600 mx-1"></div>

                {isCompleted && (
                    <button onClick={() => setLocalShowOriginal(!localShowOriginal)} disabled={isZoomMode} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider ${showOriginal && !isZoomMode ? 'bg-teal-main text-white shadow-md' : 'bg-slate-100 dark:bg-navy-800 text-teal-main dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'} ${isZoomMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <MoveHorizontal size={16} /> So sánh
                    </button>
                )}
                 {isCompleted && (
                    <a href={image.resultUrl} download={`t-red-${image.id}.png`} className="flex items-center gap-2 px-6 py-2 bg-teal-main hover:bg-teal-light text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md transform hover:translate-y-px">
                        <Download size={16} /> Tải về
                    </a>
                )}
                {/* DELETE BUTTON */}
                {onDelete && (
                     <button 
                        onClick={() => onDelete(image.id)}
                        className="flex items-center gap-2 px-4 py-2 text-red-accent hover:bg-red-accent/10 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider ml-1"
                        title="Xóa ảnh"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
             </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <>
      <div className="group relative bg-white dark:bg-navy-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 hover:border-teal-main transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:-translate-y-1">
        {image.status === 'processing' && (
          <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-8 h-8 border-2 border-slate-200 dark:border-navy-600 border-t-teal-main rounded-full animate-spin" />
          </div>
        )}

        <div className="aspect-[4/3] w-full relative shrink-0 cursor-pointer overflow-hidden bg-slate-100 dark:bg-navy-900">
            <img src={image.status === 'completed' && image.resultUrl ? image.resultUrl : image.previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {isCompleted && (
                 <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-teal-main flex items-center justify-center shadow-lg text-white border border-white/20">
                    <Check size={14} strokeWidth={4} />
                 </div>
            )}
            {onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-black/80 backdrop-blur rounded-full text-slate-500 hover:text-red-accent hover:bg-red-50 dark:hover:bg-red-900/50 transition-all duration-200 shadow-sm z-20 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                    title="Xóa ảnh"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>

        <div className="p-4 bg-white dark:bg-navy-800 flex-1 flex justify-between items-center transition-colors relative z-10">
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-navy-900 dark:text-white truncate">{image.file.name}</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isCompleted ? 'text-teal-main' : 'text-slate-400'}`}>
                    {isCompleted ? 'Hoàn tất' : 'Đang chờ...'}
                </span>
             </div>
             <div className="flex gap-2">
                {isCompleted && (
                    <a href={image.resultUrl} download={`t-red-${image.id}.png`} className="p-2 text-teal-main hover:bg-teal-main/10 rounded-lg transition-colors" title="Tải về"><Download size={18} /></a>
                )}
            </div>
        </div>
      </div>
    </>
  );
};