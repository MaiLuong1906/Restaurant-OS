'use client';

import * as React from 'react';
import {
  Sparkles,
  Star,
  Coins,
  HelpCircle,
  AlertOctagon,
  Filter,
  X,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface BcgDish {
  id: string;
  name: string;
  menuType: 'dinner' | 'lunch' | 'both';
  revenue: number;
  growth: number; // e.g. +18
  margin: number; // e.g. 68%
  quadrant: 'stars' | 'cows' | 'questions' | 'dogs';
  action: string;
}

const INITIAL_BCG_DISHES: BcgDish[] = [
  // Stars
  { id: 'bcg-1', name: 'Royal Lamb Biryani', menuType: 'dinner', revenue: 215000000, growth: 18, margin: 68, quadrant: 'stars', action: 'Mở Rộng' },
  { id: 'bcg-2', name: 'Rượu Vang Château Margaux 2015', menuType: 'dinner', revenue: 189000000, growth: 24, margin: 72, quadrant: 'stars', action: 'Duy Trì Stock' },
  { id: 'bcg-3', name: 'Tandoori King Prawns Thali', menuType: 'both', revenue: 165000000, growth: 15, margin: 64, quadrant: 'stars', action: 'Ưu Tiên Bán' },

  // Cash Cows
  { id: 'bcg-4', name: 'Butter Chicken Masala', menuType: 'both', revenue: 178000000, growth: 2, margin: 61, quadrant: 'cows', action: 'Tối Ưu Cost' },
  { id: 'bcg-5', name: 'Giỏ Bánh Garlic Naan Basket', menuType: 'both', revenue: 94000000, growth: -1, margin: 78, quadrant: 'cows', action: 'Bundle Món Chính' },

  // Question Marks
  { id: 'bcg-6', name: 'Lobster Thermidor Đút Lò', menuType: 'dinner', revenue: 142000000, growth: 31, margin: 45, quadrant: 'questions', action: 'Thử Nghiệm Giá' },
  { id: 'bcg-7', name: 'Mango Lassi Alphonso', menuType: 'lunch', revenue: 38000000, growth: 28, margin: 55, quadrant: 'questions', action: 'Đẩy Marketing' },

  // Dogs
  { id: 'bcg-8', name: 'Mixed Vegetable Curry', menuType: 'lunch', revenue: 22000000, growth: -8, margin: 38, quadrant: 'dogs', action: 'Cân Nhắc Bỏ' },
  { id: 'bcg-9', name: 'Raita Dip Bowl Phụ Trợ', menuType: 'both', revenue: 8000000, growth: -12, margin: 42, quadrant: 'dogs', action: 'Tặng Kèm Thêm' },
];

export default function AdminBcgPage() {
  const [dishes, setDishes] = React.useState<BcgDish[]>(INITIAL_BCG_DISHES);
  const [filterMenu, setFilterMenu] = React.useState<'all' | 'dinner' | 'lunch'>('all');
  const [selectedDish, setSelectedDish] = React.useState<BcgDish | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateQuadrant = (dishId: string, newQuad: BcgDish['quadrant']) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, quadrant: newQuad } : d))
    );
    showToast('Đã di chuyển món ăn sang góc phần tư ma trận mới!');
    if (selectedDish?.id === dishId) {
      setSelectedDish({ ...selectedDish, quadrant: newQuad });
    }
  };

  const filteredDishes = dishes.filter(
    (d) => filterMenu === 'all' || d.menuType === filterMenu || d.menuType === 'both'
  );

  const stars = filteredDishes.filter((d) => d.quadrant === 'stars');
  const cows = filteredDishes.filter((d) => d.quadrant === 'cows');
  const questions = filteredDishes.filter((d) => d.quadrant === 'questions');
  const dogs = filteredDishes.filter((d) => d.quadrant === 'dogs');

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Ma Trận BCG — Phân Tích Danh Mục Món Ăn
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Định vị món ăn theo Tốc độ Tăng trưởng và Tỷ trọng Đóng góp để tối ưu hóa Menu Engineering và lợi nhuận gộp
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => {
                  setFilterMenu('all');
                  showToast('Hiển thị toàn bộ thực đơn');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  filterMenu === 'all' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tất Cả Món ({dishes.length})
              </button>
              <button
                onClick={() => {
                  setFilterMenu('dinner');
                  showToast('Lọc theo thực đơn Tối');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  filterMenu === 'dinner' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Menu Tối
              </button>
              <button
                onClick={() => {
                  setFilterMenu('lunch');
                  showToast('Lọc theo thực đơn Trưa');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  filterMenu === 'lunch' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Menu Trưa
              </button>
            </div>

            <button
              onClick={() => showToast('AI Engine: Đã phân tích lại toàn bộ 48 công thức và tạo đề xuất tái cơ cấu giá bán!')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Phân Tích Bằng AI</span>
            </button>
          </div>
        </div>

        {/* 4 Quadrants BCG Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Q1: STARS (Ngôi Sao) */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-emerald-600 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                <h2 className="font-ops text-base font-bold text-ops-ink">
                  STARS (Ngôi Sao) — Tăng Trưởng Cao · Thị Phần Cao
                </h2>
              </div>
              <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                Chiến lược: ĐẦU TƯ &amp; MỞ RỘNG
              </span>
            </div>

            <div className="space-y-3">
              {stars.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDish(item)}
                  className="p-3 bg-ops-bg rounded-lg border border-ops-border hover:border-emerald-500 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-ops-ink text-sm group-hover:text-emerald-700">{item.name}</h3>
                    <div className="flex items-center gap-3 pt-1 text-xs text-ops-muted font-mono">
                      <span>Doanh thu: <strong className="text-ops-ink">{formatVND(item.revenue)}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">+{item.growth}% Tăng trưởng</span>
                      <span>•</span>
                      <span>Margin: <strong>{item.margin}%</strong></span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold shrink-0">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Q2: CASH COWS (Bò Tiền) */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-amber-600 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <h2 className="font-ops text-base font-bold text-ops-ink">
                  CASH COWS (Bò Tiền) — Tăng Trưởng Thấp · Thị Phần Cao
                </h2>
              </div>
              <span className="font-mono text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-bold">
                Chiến lược: KHAI THÁC LỢI NHUẬN
              </span>
            </div>

            <div className="space-y-3">
              {cows.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDish(item)}
                  className="p-3 bg-ops-bg rounded-lg border border-ops-border hover:border-amber-500 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-ops-ink text-sm group-hover:text-amber-800">{item.name}</h3>
                    <div className="flex items-center gap-3 pt-1 text-xs text-ops-muted font-mono">
                      <span>Doanh thu: <strong className="text-ops-ink">{formatVND(item.revenue)}</strong></span>
                      <span>•</span>
                      <span className="text-amber-700 font-bold">{item.growth}% Ổn định</span>
                      <span>•</span>
                      <span>Margin: <strong>{item.margin}%</strong></span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold shrink-0">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Q3: QUESTION MARKS (Dấu Hỏi) */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-blue-600 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="font-ops text-base font-bold text-ops-ink">
                  QUESTION MARKS (Dấu Hỏi) — Tăng Trưởng Cao · Thị Phần Thấp
                </h2>
              </div>
              <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-bold">
                Chiến lược: THỬ NGHIỆM GIÁ / MARKETING
              </span>
            </div>

            <div className="space-y-3">
              {questions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDish(item)}
                  className="p-3 bg-ops-bg rounded-lg border border-ops-border hover:border-blue-500 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-ops-ink text-sm group-hover:text-blue-800">{item.name}</h3>
                    <div className="flex items-center gap-3 pt-1 text-xs text-ops-muted font-mono">
                      <span>Doanh thu: <strong className="text-ops-ink">{formatVND(item.revenue)}</strong></span>
                      <span>•</span>
                      <span className="text-blue-700 font-bold">+{item.growth}% Đột phá</span>
                      <span>•</span>
                      <span>Margin: <strong>{item.margin}%</strong></span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold shrink-0">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Q4: DOGS (Con Chó) */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-stone-500 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-stone-600" />
                <h2 className="font-ops text-base font-bold text-ops-ink">
                  DOGS (Con Chó) — Tăng Trưởng Thấp · Thị Phần Thấp
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-800 bg-stone-100 px-2 py-0.5 rounded font-bold">
                Chiến lược: LOẠI BỎ HOẶC TÁI ĐỊNH VỊ
              </span>
            </div>

            <div className="space-y-3">
              {dogs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDish(item)}
                  className="p-3 bg-ops-bg rounded-lg border border-ops-border hover:border-stone-400 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div>
                    <h3 className="font-bold text-ops-ink text-sm group-hover:text-rose-800">{item.name}</h3>
                    <div className="flex items-center gap-3 pt-1 text-xs text-ops-muted font-mono">
                      <span>Doanh thu: <strong className="text-ops-ink">{formatVND(item.revenue)}</strong></span>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">{item.growth}% Giảm sút</span>
                      <span>•</span>
                      <span>Margin: <strong>{item.margin}%</strong></span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-stone-200 text-ops-ink font-mono text-[10px] font-bold shrink-0">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strategic Recommendation Box */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-ops-border border-l-4 border-l-primary-500 space-y-3">
          <div className="flex items-center gap-2 text-primary-500">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-ops text-sm font-bold uppercase tracking-wider">
              Khuyến Nghị Chiến Lược Menu Engineering
            </h3>
          </div>
          <p className="text-xs text-ops-muted leading-relaxed">
            1. <strong>Tăng sản lượng Stars:</strong> Món Royal Lamb Biryani đang mang lại biên lợi nhuận tuyệt hảo 68%. Khuyến nghị đặt tại vị trí vàng (Top Right) trên Menu giấy và App gọi món khách hàng.<br />
            2. <strong>Bảo vệ Bò Tiền (Cash Cows):</strong> Bánh Garlic Naan có margin 78% nhưng tăng trưởng chững lại. Nên kết hợp tạo combo cố định với Butter Chicken để kích thích giá trị trung bình đơn (AOV).<br />
            3. <strong>Cắt giảm Dogs:</strong> Món Mixed Vegetable Curry có tỷ lệ hủy món 4% và doanh thu thấp, nên thay thế bằng công thức Paneer Tikka Masala cho mùa lễ hội cuối năm.
          </p>
        </div>
      </div>

      {/* Modal: Điều Chỉnh Chiến Lược Món Ăn */}
      {selectedDish && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div>
                <h3 className="font-ops text-base font-bold text-ops-ink">{selectedDish.name}</h3>
                <span className="text-xs text-ops-muted font-mono">Doanh thu: {formatVND(selectedDish.revenue)}</span>
              </div>
              <button
                onClick={() => setSelectedDish(null)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-ops-bg rounded-lg space-y-1 font-mono">
                <div className="flex justify-between text-ops-muted">
                  <span>Tăng trưởng doanh thu:</span>
                  <span className="font-bold text-emerald-700">+{selectedDish.growth}%</span>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Biên lợi nhuận gộp (Margin):</span>
                  <span className="font-bold text-primary-500">{selectedDish.margin}%</span>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1.5">
                  Tái Định Vị Góc Phần Tư Ma Trận:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'stars', label: '⭐ Ngôi Sao (Stars)' },
                      { id: 'cows', label: '💰 Bò Tiền (Cash Cows)' },
                      { id: 'questions', label: '❓ Dấu Hỏi (Questions)' },
                      { id: 'dogs', label: '🐕 Con Chó (Dogs)' },
                    ] as const
                  ).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleUpdateQuadrant(selectedDish.id, q.id)}
                      className={`p-2.5 rounded-lg border text-left font-mono text-xs font-bold cursor-pointer transition-all ${
                        selectedDish.quadrant === q.id
                          ? 'bg-primary-500 text-white border-primary-500 shadow-xs'
                          : 'bg-ops-bg hover:bg-stone-200 text-ops-ink border-ops-border'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                onClick={() => setSelectedDish(null)}
                className="px-4 py-2 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
