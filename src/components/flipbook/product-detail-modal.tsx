'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Minus,
  MessageCircle,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import type { Business, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/auth';

interface ProductDetailModalProps {
  item: MenuItem;
  business: Business;
  onClose: () => void;
  onAddToBasket: (item: MenuItem, quantity: number) => void;
  onOrderDirect: (item: MenuItem, quantity: number) => void;
}

export default function ProductDetailModal({
  item,
  business,
  onClose,
  onAddToBasket,
  onOrderDirect,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const primaryColor = business.primaryColor || '#10b981';

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  // Drag to dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, [role="slider"]')) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = Math.max(0, currentY.current - startY.current);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out, bottom 0.3s ease-out';
      const deltaY = currentY.current - startY.current;
      if (deltaY > 100) {
        handleClose();
      } else {
        sheetRef.current.style.transform = '';
      }
    }
    currentY.current = 0;
  };

  // Lock body scroll, prevent page swipe
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9000] bg-black/40 transition-opacity duration-200"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed z-[9001] bg-white rounded-t-2xl shadow-2xl overflow-hidden no-swipe"
        data-no-swipe
        style={{
          bottom: isVisible ? 0 : '100%',
          left: 0,
          right: 0,
          width: '100%',
          maxHeight: '85dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          transition: 'bottom 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close */}
        <button onClick={handleClose}
          className="absolute top-2.5 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Image */}
        {item.image && (
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[50dvh] no-scrollbar">
          {/* Name & Price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.name}</h3>
            <span className="text-lg font-bold flex-shrink-0" style={{ color: primaryColor }}>
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.description}</p>
          )}

          {/* Quantity */}
          {item.available && business.showQuantitySelector && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label>
              <div className="flex items-center border rounded-xl overflow-hidden w-fit">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <div className="w-12 h-11 flex items-center justify-center text-base font-semibold text-gray-900 border-x">
                  {quantity}
                </div>
                <button onClick={() => setQuantity((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Subtotal */}
          {item.available && (
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl mb-4">
              <span className="text-xs text-gray-500">Subtotal</span>
              <span className="text-base font-bold" style={{ color: primaryColor }}>
                {formatPrice(item.price * quantity)}
              </span>
            </div>
          )}

          {/* Actions */}
          {item.available && (
            <div className="space-y-2.5">
              {business.basketEnabled && (
                <button onClick={() => { onAddToBasket(item, quantity); handleClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
                  style={{ backgroundColor: primaryColor, color: '#fff' }}>
                  <ShoppingCart className="w-4 h-4" />Add to Basket
                </button>
              )}
              {business.whatsappOrder && business.showOrderButton && business.whatsapp && (
                <button onClick={handleOrderDirect}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#25D366] text-white active:scale-[0.98] transition-all">
                  <MessageCircle className="w-4 h-4" />Order on WhatsApp
                </button>
              )}
            </div>
          )}

          {!item.available && (
            <div className="flex items-center gap-2 px-3 py-3 bg-gray-100 rounded-xl text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />Currently unavailable
            </div>
          )}
        </div>
      </div>
    </>
  );
}
