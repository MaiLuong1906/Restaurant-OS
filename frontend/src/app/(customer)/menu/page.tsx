'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND, generateIdempotencyKey } from '@/lib/utils';
import { Dish, Category } from '@/types';
import { ShoppingBag, Plus, Minus, Check, ArrowLeft, Utensils, Coffee, Salad, Cake } from 'lucide-react';
import Link from 'next/link';
import { TiltCard } from '@/components/ui/TiltCard';

const SAMPLE_DISHES: Dish[] = [
  {
    id: 'dish-1',
    name: 'Phở Bò Đặc Biệt',
    description: 'Bánh phở tươi, nạm gầu tái lăn, nước dùng ninh xương ống bò trong 24h thảo mộc.',
    price: 75000,
    category: 'MAIN',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60',
    isAvailable: true,
  },
  {
    id: 'dish-2',
    name: 'Bún Chả Hà Nội',
    description: 'Chả nướng than hoa thơm lừng, bún tươi, rau thơm ăn kèm nước mắm đu đủ tỏi ớt.',
    price: 65000,
    category: 'MAIN',
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=60',
    isAvailable: true,
  },
  {
    id: 'dish-3',
    name: 'Nem Lụi Nướng Sả',
    description: 'Set 5 xiên nem lụi nướng sả cây, bánh tráng cuốn rau rừng chấm nước xốt gan đậu phộng.',
    price: 55000,
    category: 'APPETIZER',
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60',
    isAvailable: true,
  },
  {
    id: 'dish-4',
    name: 'Cà Phê Muối Xứ Huế',
    description: 'Hạt Robusta Đắk Lắk pha phin truyền thống hòa quyện lớp kem muối mặn béo ngậy.',
    price: 35000,
    category: 'DRINK',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    isAvailable: true,
  },
  {
    id: 'dish-5',
    name: 'Trà Mãng Cầu Đắk Lắk',
    description: 'Trà lài thượng hạng ủ lạnh cùng tép mãng cầu xiêm tươi thanh mát xua tan oi bức.',
    price: 40000,
    category: 'DRINK',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
    isAvailable: true,
  },
];

export default function MenuCustomerPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const {
    tableNumber,
    items: cartItems,
    addItem,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItemCount,
  } = useCartStore();

  const filteredDishes = activeCategory === 'ALL'
    ? SAMPLE_DISHES
    : SAMPLE_DISHES.filter((d) => d.category === activeCategory);

  const handlePlaceOrder = () => {
    const idempotencyKey = generateIdempotencyKey();
    // Simulate sending order to backend
    console.log('[Order Placed] Key:', idempotencyKey, 'Total:', getTotalAmount());
    setOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      setIsCartOpen(false);
      setOrderPlaced(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white">Thực Đơn Điện Tử</h1>
            <p className="text-[11px] text-orange-400 font-medium">
              Đang phục vụ: {tableNumber || 'Bàn 01'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition-transform active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" />
          {getTotalItemCount() > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white font-bold text-[11px] rounded-full flex items-center justify-center border-2 border-slate-950">
              {getTotalItemCount()}
            </span>
          )}
        </button>
      </header>

      {/* Categories Filter */}
      <div className="px-4 py-3 flex space-x-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'Tất cả món', icon: Utensils },
          { id: 'MAIN', label: 'Món chính', icon: Utensils },
          { id: 'APPETIZER', label: 'Khai vị', icon: Salad },
          { id: 'DRINK', label: 'Đồ uống', icon: Coffee },
          { id: 'DESSERT', label: 'Tráng miệng', icon: Cake },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as Category | 'ALL')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dishes List */}
      <div className="px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDishes.map((dish) => {
          return (
            <TiltCard
              key={dish.id}
              maxTilt={7}
              className="flex items-center p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-200"
            >
              <div className="h-20 w-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 relative">
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-600">
                    <Utensils className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="ml-3.5 flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{dish.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {dish.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-400">
                    {formatVND(dish.price)}
                  </span>
                  <button
                    onClick={() => addItem(dish)}
                    className="h-8 px-3 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar (if items exist) */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shadow-2xl shadow-orange-600/40 active:scale-98 transition-transform"
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm font-bold">{getTotalItemCount()} món trong giỏ</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black">{formatVND(getTotalAmount())}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg font-semibold">Xem giỏ</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="w-full max-w-lg mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Giỏ Hàng Của Bạn</h2>
                <p className="text-xs text-orange-400">{tableNumber || 'Bàn 01'}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.dish.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate">{item.dish.name}</h4>
                    <p className="text-xs text-orange-400 font-bold">{formatVND(item.dish.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => updateQuantity(item.dish.id, -1)}
                      className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.dish.id, 1)}
                      className="h-7 w-7 rounded-lg bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Tổng thanh toán:</span>
                <span className="text-xl font-black text-orange-400">{formatVND(getTotalAmount())}</span>
              </div>

              {orderPlaced ? (
                <div className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center space-x-2 animate-bounce">
                  <Check className="h-5 w-5" />
                  <span>Đã gửi đơn tới Bếp thành công!</span>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 font-bold text-sm text-white shadow-xl shadow-orange-600/30 transition-transform active:scale-98"
                >
                  Xác Nhận Đặt Món
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
