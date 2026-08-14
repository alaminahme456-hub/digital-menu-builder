'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import type { Business, MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/auth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OrderBasketProps {
  items: MenuItem[];
  basket: Map<string, number>;
  onUpdate: (item: MenuItem, quantity: number) => void;
  onClear: () => void;
  onOrder: () => void;
  business: Business;
  basketTotal: { total: number; count: number };
}

/* ------------------------------------------------------------------ */
/*  Order Basket Component                                              */
/* ------------------------------------------------------------------ */
export default function OrderBasket({
  items,
  basket,
  onUpdate,
  onClear,
  onOrder,
  business,
  basketTotal,
}: OrderBasketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const primaryColor = business.primaryColor || '#10b981';

  // Don't render if basket is disabled or empty
  if (!business.basketEnabled || basketTotal.count === 0) return null;

  const basketItems: { item: MenuItem; quantity: number }[] = [];
  basket.forEach((qty, id) => {
    const item = items.find((i) => i.id === id);
    if (item) basketItems.push({ item, quantity: qty });
  });

  return (
    <>
      {/* Floating basket button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[8000] flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-2xl hover:shadow-3xl active:scale-95 transition-all duration-200"
        style={{ backgroundColor: primaryColor }}
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="text-sm">{basketTotal.count} items</span>
        <span className="text-sm opacity-80">|</span>
        <span className="text-sm">{formatPrice(basketTotal.total)}</span>
      </button>

      {/* Basket drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[8500] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-[8501] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900">Your Order</h3>
              </div>
              <div className="flex items-center gap-2">
                {basketTotal.count > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear();
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {basketItems.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                >
                  {/* Image */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {item.name.charAt(0)}
                    </div>
                  )}

                  {/* Name & Price */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.price)} x {quantity} ={' '}
                      <span className="font-semibold" style={{ color: primaryColor }}>
                        {formatPrice(item.price * quantity)}
                      </span>
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-0 border rounded-lg overflow-hidden">
                    <button
                      onClick={() => onUpdate(item, quantity - 1)}
                      className="p-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold text-gray-900 min-w-[32px] text-center border-x">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdate(item, quantity + 1)}
                      className="p-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-gray-50 rounded-b-3xl">
              {/* Total */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(basketTotal.total)}
                </span>
              </div>

              {/* Order button */}
              {business.whatsappOrder && business.whatsapp && (
                <button
                  onClick={() => {
                    onOrder();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#20BD5A] transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </button>
              )}

              {/* Ordering turned off message */}
              {!business.whatsappOrder && (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-400 bg-gray-100">
                  <MessageCircle className="w-4 h-4" />
                  Ordering is currently unavailable
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
