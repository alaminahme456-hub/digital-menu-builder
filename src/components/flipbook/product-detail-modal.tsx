'use client';

import React, { useState, useEffect } from 'react';
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ProductDetailModalProps {
  item: MenuItem;
  business: Business;
  onClose: () => void;
  onAddToBasket: (item: MenuItem, quantity: number) => void;
  onOrderDirect: (item: MenuItem, quantity: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Product Detail Modal                                                */
/* ------------------------------------------------------------------ */
export default function ProductDetailModal({
  item,
  business,
  onClose,
  onAddToBasket,
  onOrderDirect,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  const primaryColor = business.primaryColor || '#10b981';

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToBasket = () => {
    onAddToBasket(item, quantity);
    handleClose();
  };

  const handleOrderDirect = () => {
    onOrderDirect(item, quantity);
  };

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);


  // Stop click propagation to prevent page turn
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Modal container: bottom sheet on mobile, centered dialog on desktop */}
      <div
        className="fixed z-[9001] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          // Mobile: bottom sheet
          bottom: isVisible ? 0 : '100%',
          left: 0,
          right: 0,
          width: '100%',
          borderRadius: '1.5rem 1.5rem 0 0',
          transition: 'bottom 0.3s ease-out',
        }}
        onClick={handleContentClick}
      >
        {/* Desktop overlay via inline style hack - on md+ screens override to center */}
        <div
          className="p-0 md:p-0"
          style={undefined}
        />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Image */}
        {item.image && (
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {!item.available && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                Unavailable
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Name & Price */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <span
              className="text-xl font-bold flex-shrink-0"
              style={{ color: primaryColor }}
            >
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Category badge */}
          <div className="mb-3">
            <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              Menu Item
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {item.description}
            </p>
          )}

          {/* Quantity Selector */}
          {item.available && business.showQuantitySelector && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-0 border rounded-xl overflow-hidden w-fit">
                <button
                  onClick={handleDecrement}
                  className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <div className="px-6 py-3 text-lg font-semibold text-gray-900 min-w-[60px] text-center border-x">
                  {quantity}
                </div>
                <button
                  onClick={handleIncrement}
                  className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Total */}
          {item.available && (
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mb-5">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                {formatPrice(item.price * quantity)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {item.available && (
            <div className="space-y-3">
              {/* Add to Basket */}
              {business.basketEnabled && (
                <button
                  onClick={handleAddToBasket}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Basket
                </button>
              )}

              {/* Order on WhatsApp (direct) */}
              {business.whatsappOrder && business.showOrderButton && business.whatsapp && (
                <button
                  onClick={handleOrderDirect}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#20BD5A] transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Order on WhatsApp
                </button>
              )}
            </div>
          )}

          {/* Unavailable message */}
          {!item.available && (
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              This item is currently unavailable
            </div>
          )}
        </div>
      </div>
    </>
  );
}
