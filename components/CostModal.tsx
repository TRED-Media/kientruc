import React from 'react';
import { OutputResolution } from '../types';
import { PRICING_CONFIG } from '../constants';
import { AlertTriangle, DollarSign, Check, X } from 'lucide-react';

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageCount: number;
  resolution: OutputResolution;
}

export const CostModal: React.FC<CostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  imageCount,
  resolution,
}) => {
  if (!isOpen) return null;

  // Pricing Logic Calculation (Always Pro)
  const getPricing = () => {
    const prices = PRICING_CONFIG.PRICE_USD;
    // Default to 2K if undefined, or pick specific resolution
    const unitPriceUsd = prices[resolution as keyof typeof prices] || prices['2K'];
    
    const totalPriceUsd = unitPriceUsd * imageCount;
    const unitPriceVnd = Math.round(unitPriceUsd * PRICING_CONFIG.USD_TO_VND);
    const totalPriceVnd = Math.round(totalPriceUsd * PRICING_CONFIG.USD_TO_VND);

    return {
      unitPriceUsd,
      unitPriceVnd,
      totalPriceUsd: totalPriceUsd.toFixed(2),
      totalPriceVnd: totalPriceVnd.toLocaleString('vi-VN')
    };
  };

  const pricing = getPricing();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-navy-900 p-5 border-b border-slate-200 dark:border-navy-700 flex items-center gap-3">
          <AlertTriangle className="text-red-accent" size={24} />
          <h2 className="text-lg font-black text-navy-900 dark:text-white uppercase tracking-wider">
            XÁC NHẬN CHI PHÍ
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest">Thông tin Job</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-800 dark:text-slate-200">
              <div className="flex flex-col bg-slate-50 dark:bg-navy-900 p-3 rounded border border-slate-200 dark:border-navy-700">
                <span className="text-[10px] text-teal-main dark:text-slate-400 mb-1">Model AI</span>
                <span className="font-bold text-navy-900 dark:text-white">Gemini 3 Pro Vision</span>
              </div>
              <div className="flex flex-col bg-slate-50 dark:bg-navy-900 p-3 rounded border border-slate-200 dark:border-navy-700">
                <span className="text-[10px] text-teal-main dark:text-slate-400 mb-1">Độ phân giải</span>
                <span className="font-bold">{resolution}</span>
              </div>
              <div className="flex flex-col bg-slate-50 dark:bg-navy-900 p-3 rounded border border-slate-200 dark:border-navy-700">
                 <span className="text-[10px] text-teal-main dark:text-slate-400 mb-1">Số lượng ảnh</span>
                 <span className="font-bold">{imageCount}</span>
              </div>
               <div className="flex flex-col bg-slate-50 dark:bg-navy-900 p-3 rounded border border-slate-200 dark:border-navy-700">
                 <span className="text-[10px] text-teal-main dark:text-slate-400 mb-1">Chế độ</span>
                 <span className="font-bold">Realtime</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-xs font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest">Đơn giá dự kiến</h3>
             <ul className="text-sm text-slate-700 dark:text-slate-400 space-y-1 pl-2 border-l-2 border-teal-main/20">
                <li>• {pricing.unitPriceUsd} USD / ảnh</li>
                <li>• ≈ {pricing.unitPriceVnd.toLocaleString('vi-VN')} đ / ảnh</li>
             </ul>
          </div>

          <div className="bg-slate-50 dark:bg-navy-900 p-4 rounded border border-slate-200 dark:border-navy-700">
            <h3 className="text-[10px] font-bold text-teal-main dark:text-slate-300 uppercase tracking-widest mb-1">TỔNG TẠM TÍNH</h3>
            <div className="flex justify-between items-end">
               <div className="text-3xl font-black text-red-accent leading-none">
                  {pricing.totalPriceVnd} <span className="text-sm font-medium text-navy-900 dark:text-white">VND</span>
               </div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {pricing.totalPriceUsd} USD
               </div>
            </div>
          </div>

          <p className="text-[10px] text-teal-main dark:text-slate-500 italic text-center">
            * Đây là chi phí ước tính. Chi phí thực tế có thể dao động nhẹ tùy thuộc vào hệ thống billing của Google Cloud.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white dark:bg-navy-800 border-t border-slate-200 dark:border-navy-600 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-white font-bold uppercase text-xs tracking-widest rounded transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Huỷ bỏ
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-accent hover:bg-red-hover text-white font-black uppercase text-xs tracking-widest rounded transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Check size={16} />
            Đồng ý Render
          </button>
        </div>

      </div>
    </div>
  );
};