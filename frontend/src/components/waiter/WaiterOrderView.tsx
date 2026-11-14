'use client';

import * as React from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Send,
  Save,
  Sparkles,
  CookingPot,
  CheckCircle2,
  Clock,
  ChevronUp,
} from 'lucide-react';
import { useWaiterStore, removeVietnameseTones } from '@/stores/useWaiterStore';
import { formatVND, cn } from '@/lib/utils';

export function WaiterOrderView() {
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const tables = useWaiterStore((s) => s.tables);
  const menuItems = useWaiterStore((s) => s.menuItems);
  const addItemToOrder = useWaiterStore((s) => s.addItemToOrder);
  const updateItemQty = useWaiterStore((s) => s.updateItemQty);
  const removeItemFromPending = useWaiterStore((s) => s.removeItemFromPending);
  const clearPendingOrder = useWaiterStore((s) => s.clearPendingOrder);
  const openSendKitchenModal = useWaiterStore((s) => s.openSendKitchenModal);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const showToast = useWaiterStore((s) => s.showToast);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Tất cả');
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = React.useState(false);

  const currentTable = tables[selectedTableId] || tables['04'];
  const pendingItems = currentTable?.pendingItems || [];
  const confirmedItems = currentTable?.confirmedItems || [];

  const categories = ['Tất cả', 'Khai vị', 'Món chính', 'Lẩu', 'Đồ uống', 'Tráng miệng'];

  // Normalized search query for Vietnamese tone-insensitive search
  const normalizedQuery = React.useMemo(() => removeVietnameseTones(searchQuery), [searchQuery]);

  // Desktop filtered menu items
  const desktopFilteredItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
      if (!matchCategory) return false;
      if (!normalizedQuery) return true;
      const nameNorm = removeVietnameseTones(item.name);
      const skuNorm = removeVietnameseTones(item.sku);
      return nameNorm.includes(normalizedQuery) || skuNorm.includes(normalizedQuery);
    });
  }, [menuItems, selectedCategory, normalizedQuery]);

  // Mobile filtered menu items: ONLY visible when searchQuery is non-empty!
  const mobileFilteredItems = React.useMemo(() => {
    if (!normalizedQuery) return [];
    return menuItems.filter((item) => {
      const nameNorm = removeVietnameseTones(item.name);
      const skuNorm = removeVietnameseTones(item.sku);
      return nameNorm.includes(normalizedQuery) || skuNorm.includes(normalizedQuery);
    });
  }, [menuItems, normalizedQuery]);

  const quickSearchKeywords = ['Lẩu riêu cua', 'Phở bò', 'Nem rán', 'Trà sen', 'Bò cuộn'];

  const handleApplyQuickSearch = (kw: string) => {
    setSearchQuery(kw);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const totalPendingQty = pendingItems.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Bar with Table Context & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-ops-border shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('floor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ops-border bg-ops-bg hover:bg-white text-xs font-semibold text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-ops-brand" />
            <span>Sơ đồ bàn</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-ink">{currentTable?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-ops-brand-light text-ops-brand font-bold border border-ops-brand/20">
                {currentTable?.zone}
              </span>
            </div>
            <span className="text-[11px] text-ops-muted">
              {currentTable?.guests || currentTable?.seats} khách • Nhân viên: {currentTable?.server}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tracking');
              useWaiterStore.getState().setTrackingTableFilter(selectedTableId);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ops-border bg-white hover:bg-ops-bg text-xs font-semibold text-ops-muted hover:text-ink transition-colors"
          >
            <Clock className="h-4 w-4 text-sand-500" />
            <span>Xem tiến độ bếp ({confirmedItems.length} món)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Menu/Search vs Right Cart (Desktop) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        {/* LEFT SECTION: MENU & SEARCH */}
        <div className="w-full lg:w-[65%] xl:w-[68%] flex flex-col gap-4">
          {/* SEARCH INPUT & QUICK TAGS */}
          <div className="bg-white p-4 rounded-xl border border-ops-border shadow-xs flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ops-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn theo tên (nem, phở, lẩu...) hoặc mã SKU..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-ops-border bg-ops-bg/60 text-xs text-ink placeholder-sand-500 focus:bg-white focus:border-ops-brand focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ops-muted hover:text-ink"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Quick search chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] text-ops-muted whitespace-nowrap font-medium">
                Gợi ý nhanh:
              </span>
              {quickSearchKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleApplyQuickSearch(kw)}
                  className="px-2.5 py-1 rounded-full bg-ops-bg hover:bg-sand-200 border border-ops-border text-[11px] text-ink whitespace-nowrap transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* DESKTOP CATEGORY TABS (Hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shadow-xs',
                    isSelected
                      ? 'bg-ops-ink text-white border-ops-ink'
                      : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg hover:text-ink'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* MOBILE MENU SECTION: STRICTLY CONTROLLED SEARCH BEHAVIOR */}
          {/* ======================================================== */}
          <div className="block lg:hidden w-full">
            {!normalizedQuery ? (
              /* When search query is empty on mobile: HIDE dishes list and show prompt */
              <div className="p-8 bg-white rounded-xl border border-dashed border-ops-border text-center flex flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full bg-sand-100 flex items-center justify-center text-ops-brand">
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-ink">Tìm kiếm món ăn</h4>
                <p className="text-xs text-ops-muted max-w-xs">
                  Nhập từ khóa hoặc bấm vào các thẻ gợi ý nhanh ở trên để chọn món cho {currentTable?.name}.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-ops-brand font-semibold mt-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Danh sách món tự động hiển thị khi bạn nhập từ khóa</span>
                </div>
              </div>
            ) : mobileFilteredItems.length === 0 ? (
              /* When search query has no match */
              <div className="p-8 bg-white rounded-xl border border-ops-border text-center flex flex-col items-center justify-center gap-2">
                <p className="text-sm font-semibold text-ink">
                  Không tìm thấy món nào khớp với &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs text-ops-brand font-bold underline mt-1"
                >
                  Xóa tìm kiếm để thử lại
                </button>
              </div>
            ) : (
              /* When search query matches dishes on mobile */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-ink">
                    Kết quả tìm kiếm ({mobileFilteredItems.length} món)
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-[11px] text-ops-brand font-semibold"
                  >
                    Đóng kết quả
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mobileFilteredItems.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-ops-border shadow-xs text-left"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold text-ink truncate">{dish.name}</span>
                        <span className="text-[11px] text-ops-muted mt-0.5">{dish.station}</span>
                        <span className="text-xs font-bold text-ops-brand mt-1">
                          {formatVND(dish.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addItemToOrder(selectedTableId, dish);
                          showToast(`Đã thêm "${dish.name}" vào Bàn ${selectedTableId}`);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-ops-brand text-white hover:bg-ops-brand-dark transition-colors shadow-xs flex-shrink-0"
                        aria-label={`Thêm ${dish.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* DESKTOP MENU GRID: FULL CARD GRID WITH LIVE FILTERING */}
          {/* ======================================================== */}
          <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-3">
            {desktopFilteredItems.map((dish) => (
              <div
                key={dish.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-white border border-ops-border hover:border-sand-400 hover:shadow-xs transition-all text-left"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-ink leading-snug">{dish.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-ops-bg text-[10px] font-semibold text-ops-muted border border-ops-border whitespace-nowrap">
                      {dish.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-ops-muted line-clamp-2 mt-0.5 leading-relaxed">
                    {dish.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-ops-border">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-ink">{formatVND(dish.price)}</span>
                    <span className="text-[10px] text-ops-muted">{dish.station}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addItemToOrder(selectedTableId, dish);
                      showToast(`Đã thêm "${dish.name}" vào Bàn ${selectedTableId}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ops-brand text-white hover:bg-ops-brand-dark text-xs font-bold transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SECTION: CART PANEL (DESKTOP) */}
        <div className="hidden lg:flex w-full lg:w-[35%] xl:w-[32%] flex-col gap-4 sticky top-20">
          <div className="bg-white rounded-xl p-5 border border-ops-border shadow-xs flex flex-col gap-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-ops-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-ops-brand" />
                <h3 className="text-base font-bold text-ink">Đơn gọi món ({currentTable?.name})</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ops-brand-light text-ops-brand border border-ops-brand/20">
                {pendingItems.length} món mới
              </span>
            </div>

            {/* SECTION 1: PENDING ITEMS (CHƯA GỬI BẾP) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ops-brand flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Món mới chờ gửi bếp ({pendingItems.length})
                </span>
                {pendingItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingOrder(selectedTableId);
                      showToast('Đã xóa danh sách món chưa gửi bếp.');
                    }}
                    className="text-[11px] text-ops-alert hover:underline font-semibold"
                  >
                    Xóa tất cả
                  </button>
                ) : null}
              </div>

              {pendingItems.length === 0 ? (
                <div className="p-4 rounded-lg bg-ops-bg/60 border border-dashed border-ops-border text-center text-xs text-ops-muted">
                  Chưa có món mới nào được chọn.
                  <br />
                  <span className="text-[11px] text-sand-600 font-medium mt-1 inline-block">
                    Chọn món từ danh mục bên trái
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-ops-brand/20 bg-ops-brand-light/30 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-bold text-ink truncate">{item.name}</span>
                          <span className="text-[11px] text-ops-muted">{item.station}</span>
                        </div>
                        <span className="text-xs font-bold text-ink">
                          {formatVND(item.price * item.qty)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-ops-border/40">
                        {/* Stepper */}
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-ops-border p-0.5">
                          <button
                            type="button"
                            onClick={() => updateItemQty(selectedTableId, item.id, -1)}
                            className="h-6 w-6 flex items-center justify-center rounded text-ops-muted hover:text-ink hover:bg-ops-bg"
                            aria-label="Giảm"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-ink">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(selectedTableId, item.id, 1)}
                            className="h-6 w-6 flex items-center justify-center rounded text-ops-muted hover:text-ink hover:bg-ops-bg"
                            aria-label="Tăng"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItemFromPending(selectedTableId, item.id)}
                          className="p-1 text-ops-alert hover:bg-rose-50 rounded"
                          aria-label="Xóa món"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: CONFIRMED ITEMS (ĐÃ GỬI BẾP) */}
            {confirmedItems.length > 0 ? (
              <div className="flex flex-col gap-2 pt-3 border-t border-ops-border">
                <span className="text-xs font-bold uppercase tracking-wider text-ops-muted flex items-center gap-1.5">
                  <CookingPot className="h-3.5 w-3.5" />
                  Món đã gửi bếp trước đó ({confirmedItems.length})
                </span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {confirmedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-ops-bg border border-ops-border text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.status === 'served' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-ink truncate">
                          {item.qty}x {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-ops-muted font-semibold flex-shrink-0">
                        {item.statusText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* CART ACTIONS */}
            <div className="flex flex-col gap-2 pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={openSendKitchenModal}
                disabled={pendingItems.length === 0}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs',
                  pendingItems.length > 0
                    ? 'bg-ops-brand hover:bg-ops-brand-dark text-white cursor-pointer'
                    : 'bg-sand-200 text-ops-muted cursor-not-allowed opacity-70'
                )}
              >
                <Send className="h-4 w-4" />
                <span>Gửi Bếp ({pendingItems.length} món mới)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Đã lưu nháp ${pendingItems.length} món cho ${currentTable?.name}.`);
                }}
                disabled={pendingItems.length === 0}
                className="w-full py-2 rounded-xl border border-ops-border bg-white text-ops-muted hover:text-ink hover:bg-ops-bg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Tạm lưu đơn nháp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE FLOATING CART BAR & SLIDE-UP DRAWER */}
      {/* ======================================================== */}
      <div className="block lg:hidden fixed bottom-16 inset-x-0 z-30 p-3 bg-white/95 border-t border-ops-border backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-ops-brand flex items-center justify-center text-white shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              {pendingItems.length > 0 ? (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-ops-alert text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingItems.length}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink">
                {pendingItems.length} món mới ({totalPendingQty} suất)
              </span>
              <button
                type="button"
                onClick={() => setMobileCartDrawerOpen(true)}
                className="text-[11px] text-ops-brand font-semibold text-left flex items-center gap-0.5"
              >
                <span>Xem chi tiết giỏ hàng</span>
                <ChevronUp className="h-3 w-3" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={openSendKitchenModal}
            disabled={pendingItems.length === 0}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all',
              pendingItems.length > 0
                ? 'bg-ops-brand text-white active:scale-95'
                : 'bg-sand-200 text-ops-muted opacity-60'
            )}
          >
            <Send className="h-4 w-4" />
            <span>Gửi Bếp</span>
          </button>
        </div>
      </div>

      {/* MOBILE CART SLIDE-UP DRAWER */}
      {mobileCartDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div
            className="w-full bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-ops-border pb-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase text-ops-brand tracking-wider">
                  Giỏ hàng món ăn
                </span>
                <h3 className="text-lg font-bold text-ink">{currentTable?.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileCartDrawerOpen(false)}
                className="p-1 rounded-lg text-ops-muted hover:text-ink hover:bg-ops-bg"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pending Items in mobile drawer */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ops-brand">
                Món mới chưa gửi bếp ({pendingItems.length})
              </span>
              {pendingItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-ops-muted bg-ops-bg rounded-lg">
                  Không có món nào trong giỏ hàng.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-ops-border bg-ops-bg flex items-center justify-between"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold text-ink truncate">{item.name}</span>
                        <span className="text-[11px] text-ops-muted">
                          {formatVND(item.price * item.qty)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-ops-border p-0.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(selectedTableId, item.id, -1)}
                          className="h-6 w-6 flex items-center justify-center text-ops-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-ink">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(selectedTableId, item.id, 1)}
                          className="h-6 w-6 flex items-center justify-center text-ops-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => {
                  setMobileCartDrawerOpen(false);
                  openSendKitchenModal();
                }}
                disabled={pendingItems.length === 0}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs',
                  pendingItems.length > 0 ? 'bg-ops-brand text-white' : 'bg-sand-200 text-ops-muted'
                )}
              >
                <Send className="h-4 w-4" />
                <span>Gửi Bếp ({pendingItems.length} món)</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
