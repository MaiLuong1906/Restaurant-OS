'use client';

import * as React from 'react';
import {
  UtensilsCrossed,
  Plus,
  History,
  Search,
  Save,
  X,
  Trash2,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  grossQty: number; // e.g. 0.22 kg
  netQty: number; // e.g. 0.20 kg
  unit: string;
  unitCost: number;
  yieldLossPct: number;
}

interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  image: string;
  ingredients: Ingredient[];
}

const INITIAL_DISHES: DishItem[] = [
  {
    id: 'dish-1',
    name: 'Bò Lúc Lắc Wagyu A4',
    category: 'Món Chính / À la carte',
    price: 480000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'ing-1', name: 'Thịt bò Wagyu Nhật A4', sku: 'RAW-WAGYU-A4', grossQty: 0.22, netQty: 0.20, unit: 'kg', unitCost: 650000, yieldLossPct: 9.1 },
      { id: 'ing-2', name: 'Nấm Truffle đen ngâm dầu', sku: 'RAW-TRUFFLE-OIL', grossQty: 0.015, netQty: 0.015, unit: 'lít', unitCost: 1200000, yieldLossPct: 0.0 },
      { id: 'ing-3', name: 'Bơ lạt Anchor New Zealand', sku: 'RAW-BUTTER-NZ', grossQty: 0.03, netQty: 0.03, unit: 'kg', unitCost: 240000, yieldLossPct: 0.0 },
      { id: 'ing-4', name: 'Gia vị & tiêu đen Phú Quốc', sku: 'SPICE-PEPPER-PQ', grossQty: 0.01, netQty: 0.01, unit: 'kg', unitCost: 180000, yieldLossPct: 0.0 },
    ],
  },
  {
    id: 'dish-2',
    name: 'Royal Lamb Biryani',
    category: 'Cơm Đặc Biệt',
    price: 360000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'ing-21', name: 'Thịt đùi cừu New Zealand', sku: 'RAW-LAMB-NZ', grossQty: 0.25, netQty: 0.22, unit: 'kg', unitCost: 320000, yieldLossPct: 12.0 },
      { id: 'ing-22', name: 'Gạo thơm Basmati Ấn Độ', sku: 'RAW-RICE-BASMATI', grossQty: 0.15, netQty: 0.15, unit: 'kg', unitCost: 65000, yieldLossPct: 0.0 },
      { id: 'ing-23', name: 'Nghệ tây Saffron Iran cao cấp', sku: 'RAW-SAFFRON-IRAN', grossQty: 0.001, netQty: 0.001, unit: 'kg', unitCost: 45000000, yieldLossPct: 0.0 },
    ],
  },
  {
    id: 'dish-3',
    name: 'Tandoori King Prawns',
    category: 'Món Nướng Lò Đất',
    price: 420000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'ing-31', name: 'Tôm sú tươi loại 1 (King Prawn)', sku: 'RAW-PRAWN-K1', grossQty: 0.30, netQty: 0.24, unit: 'kg', unitCost: 380000, yieldLossPct: 20.0 },
      { id: 'ing-32', name: 'Sốt sữa chua ướp Masala', sku: 'RAW-YOGURT-MASALA', grossQty: 0.08, netQty: 0.08, unit: 'lít', unitCost: 120000, yieldLossPct: 0.0 },
    ],
  },
  {
    id: 'dish-4',
    name: 'Château Margaux 2015',
    category: 'Rượu Vang Hảo Hạng',
    price: 8500000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'ing-41', name: 'Rượu vang Château Margaux 2015', sku: 'WINE-MARGAUX-15', grossQty: 1.0, netQty: 1.0, unit: 'chai', unitCost: 3570000, yieldLossPct: 0.0 },
    ],
  },
];

export default function AdminMenuBomPage() {
  const [dishes, setDishes] = React.useState<DishItem[]>(INITIAL_DISHES);
  const [selectedDishId, setSelectedDishId] = React.useState<string>('dish-1');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // New Dish Modal
  const [newDishModalOpen, setNewDishModalOpen] = React.useState(false);
  const [newDish, setNewDish] = React.useState({
    name: '',
    category: 'Món Chính / À la carte',
    price: '350000',
  });

  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Modal a11y: Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewDishModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedDish = dishes.find((d) => d.id === selectedDishId) || dishes[0];

  // Dynamic cost calculation
  const totalCogs = Math.round(
    selectedDish.ingredients.reduce((sum, ing) => sum + ing.grossQty * ing.unitCost, 0)
  );
  const foodCostPct = Number(((totalCogs / (selectedDish.price || 1)) * 100).toFixed(1));

  // Toggle availability
  const handleToggleSoldOut = (dishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const nextState = !d.isAvailable;
          showToast(
            nextState
              ? `Đã mở bán lại món ${d.name}`
              : `Đã chuyển ${d.name} sang [TẠM HẾT MÓN]. Toàn bộ POS & QR khách cập nhật tức thì!`
          );
          return { ...d, isAvailable: nextState };
        }
        return d;
      })
    );
  };

  // Add Ingredient
  const handleAddIngredient = () => {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: 'Nguyên liệu mới',
      sku: 'RAW-NEW-ITEM',
      grossQty: 0.05,
      netQty: 0.05,
      unit: 'kg',
      unitCost: 150000,
      yieldLossPct: 0.0,
    };
    setDishes((prev) =>
      prev.map((d) => (d.id === selectedDishId ? { ...d, ingredients: [...d.ingredients, newIng] } : d))
    );
    showToast('Đã thêm 1 dòng nguyên vật liệu vào công thức định lượng');
  };

  // Remove Ingredient
  const handleRemoveIngredient = (ingId: string) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === selectedDishId ? { ...d, ingredients: d.ingredients.filter((i) => i.id !== ingId) } : d
      )
    );
    showToast('Đã xóa nguyên liệu khỏi công thức');
  };

  // Update Ingredient Gross Qty
  const handleUpdateQty = (ingId: string, newQty: number) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === selectedDishId
          ? {
              ...d,
              ingredients: d.ingredients.map((i) => (i.id === ingId ? { ...i, grossQty: newQty } : i)),
            }
          : d
      )
    );
  };

  // Create New Dish
  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name) {
      showToast('Vui lòng nhập tên món ăn');
      return;
    }
    const newEntry: DishItem = {
      id: `dish-${Date.now()}`,
      name: newDish.name,
      category: newDish.category,
      price: Number(newDish.price) || 0,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80',
      ingredients: [
        {
          id: `ing-${Date.now()}`,
          name: 'Nguyên liệu chính',
          sku: 'RAW-BASE-01',
          grossQty: 0.2,
          netQty: 0.18,
          unit: 'kg',
          unitCost: 200000,
          yieldLossPct: 10.0,
        },
      ],
    };
    setDishes([newEntry, ...dishes]);
    setSelectedDishId(newEntry.id);
    setNewDishModalOpen(false);
    setNewDish({ name: '', category: 'Món Chính / À la carte', price: '350000' });
    showToast(`Đã tạo mới món ăn "${newEntry.name}" thành công!`);
  };

  const filteredDishes = dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1720px] mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Master Menu &amp; Định Lượng Kho BOM
            </h1>
            <p className="text-sm font-medium text-stone-600">
              Kiểm soát công thức chế biến chuẩn, tỷ lệ hao hụt khi sơ chế và cấu trúc chi phí giá vốn món ăn
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => showToast('Đang kết xuất lịch sử sửa đổi công thức BOM (Audit Logs)...')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <History className="h-4 w-4 text-stone-600" />
              <span>Lịch Sử Sửa BOM</span>
            </button>
            <button
              onClick={() => setNewDishModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>+ Thêm Món Ăn Mới</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Catalog Left (5 cols) & BOM Formulation Right (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dish Catalog (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="font-mono text-xs uppercase font-bold text-stone-700 tracking-wider">
                  Danh Mục Món Ăn ({filteredDishes.length})
                </span>
                <span className="text-xs font-semibold text-stone-500">Chọn món xem công thức BOM</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn, nhóm thực đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand"
                />
              </div>

              {/* Dishes List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredDishes.map((dish) => {
                  const dishCogs = Math.round(
                    dish.ingredients.reduce((sum, ing) => sum + ing.grossQty * ing.unitCost, 0)
                  );
                  const isCurrent = dish.id === selectedDish.id;
                  return (
                    <div
                      key={dish.id}
                      onClick={() => setSelectedDishId(dish.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-stone-50 border-ops-brand shadow-xs'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-14 h-14 rounded-lg object-cover aspect-square border border-stone-200 shrink-0 shadow-2xs bg-stone-100"
                        />
                        <div>
                          <strong className="text-stone-900 text-sm font-bold block">{dish.name}</strong>
                          <span className="text-xs text-stone-600 font-medium">{dish.category}</span>
                          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                            <span className="font-extrabold text-stone-900">{formatVND(dish.price)}</span>
                            <span className="text-stone-400">•</span>
                            <span className="text-stone-600 font-semibold">Cost: {formatVND(dishCogs)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Availability Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={dish.isAvailable}
                        onClick={(e) => handleToggleSoldOut(dish.id, e)}
                        className="flex items-center gap-2 group cursor-pointer shrink-0 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                        title={dish.isAvailable ? 'Món đang mở bán (Bấm để tạm dừng)' : 'Món đang tạm hết (Bấm để mở bán lại)'}
                      >
                        <span
                          className={`text-xs font-bold transition-colors ${
                            dish.isAvailable ? 'text-emerald-700' : 'text-stone-500'
                          }`}
                        >
                          {dish.isAvailable ? 'Đang bán' : 'Tạm hết'}
                        </span>
                        <div
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            dish.isAvailable ? 'bg-emerald-600' : 'bg-stone-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              dish.isAvailable ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: BOM Formulation & Food Cost Editor (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-ops text-lg font-bold text-stone-900">{selectedDish.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-xs font-bold border border-stone-200">
                    {selectedDish.category}
                  </span>
                </div>
                <span className="text-xs font-semibold text-stone-600">Định lượng tiêu chuẩn cho 01 suất phục vụ</span>
              </div>

              <button
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-800 rounded-lg font-mono text-xs uppercase font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-ops-brand" />
                <span>Thêm Nguyên Liệu</span>
              </button>
            </div>

            {/* Financial Summary Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <span className="font-mono text-xs uppercase text-stone-600 block font-bold tracking-wider">Giá Bán Niêm Yết</span>
                <span className="font-mono text-lg font-extrabold text-stone-900 mt-1 block">
                  {formatVND(selectedDish.price)}
                </span>
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-stone-600 block font-bold tracking-wider">Tổng Giá Vốn (COGS)</span>
                <span className="font-mono text-lg font-extrabold text-ops-brand mt-1 block">
                  {formatVND(totalCogs)}
                </span>
              </div>
              <div>
                <span className="font-mono text-xs uppercase text-stone-600 block font-bold tracking-wider">Tỷ Lệ Food Cost</span>
                <span
                  className={`font-mono text-lg font-extrabold mt-1 block ${
                    foodCostPct <= 32 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {foodCostPct}% {foodCostPct <= 32 ? '(Đạt chuẩn)' : '(Vượt target 32%)'}
                </span>
              </div>
            </div>

            {/* Ingredients BOM Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-stone-100 border-y border-stone-200 text-stone-700 font-mono text-xs uppercase">
                    <th className="py-3 px-3 font-bold">Nguyên Liệu & SKU</th>
                    <th className="py-3 px-3 font-bold text-right">Định Lượng Thô</th>
                    <th className="py-3 px-2 font-bold text-right">Hao Hụt %</th>
                    <th className="py-3 px-2 font-bold text-right">Đơn Giá</th>
                    <th className="py-3 px-3 font-bold text-right">Thành Tiền</th>
                    <th className="py-3 px-2 text-center font-bold">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono">
                  {selectedDish.ingredients.map((ing) => {
                    const lineCost = Math.round(ing.grossQty * ing.unitCost);
                    return (
                      <tr key={ing.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-3 font-sans">
                          <strong className="text-stone-900 block font-bold text-xs">{ing.name}</strong>
                          <span className="font-mono text-xs text-stone-500 font-medium">{ing.sku}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end bg-white border border-stone-300 rounded-lg px-2 py-1 shadow-2xs w-28 focus-within:border-ops-brand focus-within:ring-1 focus-within:ring-ops-brand transition-all">
                            <input
                              type="number"
                              step="0.001"
                              value={ing.grossQty}
                              onChange={(e) => handleUpdateQty(ing.id, Number(e.target.value) || 0)}
                              className="w-16 text-right font-mono text-xs font-bold text-stone-900 outline-none bg-transparent"
                            />
                            <span className="text-xs text-stone-500 font-semibold w-7 text-left pl-1.5 border-l border-stone-200 ml-1">
                              {ing.unit}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right text-stone-700 font-semibold">
                          {ing.yieldLossPct}%
                        </td>
                        <td className="py-3 px-2 text-right text-stone-700 font-semibold">
                          {formatVND(ing.unitCost)}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-stone-900 text-xs">
                          {formatVND(lineCost)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="Xóa nguyên liệu khỏi BOM"
                            aria-label="Xóa nguyên liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-3 border-t border-ops-border">
              <span className="text-xs text-ops-muted">
                * Mọi thay đổi định lượng được đồng bộ tự động tới thuật toán trừ tồn kho POS
              </span>
              <button
                onClick={() => showToast('Đã lưu công thức BOM cập nhật thành công vào cơ sở dữ liệu!')}
                className="px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg font-mono text-xs uppercase font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Định Lượng Món</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Thêm Món Ăn Mới */}
      {newDishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thêm Món Ăn Mới"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Thêm Món Ăn Mới Vào Master Menu</h3>
              </div>
              <button
                onClick={() => setNewDishModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Tên Món Ăn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cà Ri Tôm Sú Bombay"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-medium"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Nhóm Thực Đơn
                </label>
                <select
                  value={newDish.category}
                  onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand"
                >
                  <option value="Món Chính / À la carte">Món Chính / À la carte</option>
                  <option value="Cơm Đặc Biệt">Cơm Đặc Biệt</option>
                  <option value="Món Nướng Lò Đất">Món Nướng Lò Đất</option>
                  <option value="Rượu Vang Hảo Hạng">Rượu Vang Hảo Hạng</option>
                  <option value="Tráng Miệng / Đồ Uống">Tráng Miệng / Đồ Uống</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Giá Bán Niêm Yết (VND) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={newDish.price}
                  onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setNewDishModalOpen(false)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Tạo Món
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
