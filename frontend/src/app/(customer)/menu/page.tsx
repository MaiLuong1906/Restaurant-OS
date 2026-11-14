'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import {
  PHO_CO_DISHES,
  CustomerDish,
  triggerHaptic,
} from '@/lib/customer-menu-data';
import { formatVND } from '@/lib/utils';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import {
  CustomerBottomNav,
  CustomerTabKey,
} from '@/components/customer/CustomerBottomNav';
import { DishDetailSheet } from '@/components/customer/DishDetailSheet';
import { CallStaffSheet } from '@/components/customer/CallStaffSheet';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Flame,
  Leaf,
  Sparkles,
  History,
  TrendingUp,
  Zap,
  Users,
  Soup,
  Utensils,
  Coffee,
  Cake,
  X,
} from 'lucide-react';

type CategoryFilter = 'ALL' | 'APPETIZER' | 'MAIN' | 'SOUP' | 'DESSERT' | 'DRINK';
type MoodFilter = 'ALL' | 'VEG' | 'SPICY' | 'HOT_SOUP' | 'REFRESH';

const RECENT_SEARCH_DEFAULT = [
  'Bún chả nướng than hoa',
  'Lẩu riêu cua',
  'Trà sen vàng',
];

const TRENDING_TAGS = [
  { label: 'Nem rán Phố Cổ', highlight: true },
  { label: 'Nộm bò bóp thấu', highlight: false },
  { label: 'Nấm đông cô kho tộ chay', isVeg: true },
  { label: 'Chả cá Lã Vọng', highlight: false },
  { label: 'Chè hạt sen', highlight: false },
];

export default function MenuCustomerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CustomerTabKey>('menu');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMood, setActiveMood] = useState<MoodFilter>('ALL');
  const [recentSearches, setRecentSearches] = useState<string[]>(
    RECENT_SEARCH_DEFAULT
  );
  const [selectedDishForDetail, setSelectedDishForDetail] =
    useState<CustomerDish | null>(null);
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);

  const {
    tableNumber,
    addItem,
    updateQuantity,
    getTotalAmount,
    getTotalItemCount,
    getDishQuantityInCart,
    getPlacedItemCount,
  } = useCartStore();

  const displayTable = tableNumber || 'Bàn 04';
  const cartCount = getTotalItemCount();
  const cartTotal = getTotalAmount();
  const placedCount = getPlacedItemCount();

  // Filter dishes for Menu view
  const menuDishes = PHO_CO_DISHES.filter((dish) => {
    if (activeCategory !== 'ALL' && dish.subCategory !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dish.name.toLowerCase().includes(q) ||
        (dish.description && dish.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const appetizerDishes = menuDishes.filter(
    (d) => d.subCategory === 'APPETIZER'
  );
  const mainDishes = menuDishes.filter((d) => d.subCategory !== 'APPETIZER');

  // Filter dishes for Search & Discovery view
  const searchResults = PHO_CO_DISHES.filter((dish) => {
    if (activeMood === 'VEG' && !dish.isVegetarian) return false;
    if (activeMood === 'SPICY' && !dish.isSpicy) return false;
    if (activeMood === 'HOT_SOUP' && !dish.isHotSoup) return false;
    if (activeMood === 'REFRESH' && !dish.isRefreshing) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dish.name.toLowerCase().includes(q) ||
        (dish.description && dish.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleQuickAdd = (dish: CustomerDish, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    addItem(dish);
  };

  const handleQuickUpdateQty = (
    dishId: string,
    delta: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    triggerHaptic(10);
    updateQuantity(dishId, delta);
  };

  const renderDishCard = (dish: CustomerDish) => {
    const qtyInCart = getDishQuantityInCart(dish.id);

    return (
      <article
        key={dish.id}
        onClick={() => setSelectedDishForDetail(dish)}
        className={`gpu-accelerated cursor-pointer rounded-2xl bg-white p-3 shadow-[0_2px_8px_-2px_rgba(41,37,36,0.06)] transition-all flex gap-3 items-center border ${
          qtyInCart > 0
            ? 'border-[#9a401c]/50 ring-1 ring-[#9a401c]/20'
            : 'border-[#dcc1b8]/40 hover:border-[#9a401c]/30'
        }`}
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f5ecea]">
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={dish.name}
              loading="lazy"
              sizes="96px"
              className="h-full w-full object-cover"
            />
          ) : null}
          {dish.badge ? (
            <span
              className={`absolute top-1 left-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-xs ${
                dish.badgeVariant === 'recommend'
                  ? 'bg-[#00873a] text-white'
                  : dish.badgeVariant === 'bestseller'
                    ? 'bg-[#ba5831] text-white'
                    : dish.badgeVariant === 'special'
                      ? 'bg-[#9a401c] text-white'
                      : 'bg-[#e9e1df] text-[#1e1b1a]'
              }`}
            >
              {dish.badgeVariant === 'bestseller' && (
                <Flame className="h-2.5 w-2.5" />
              )}
              {dish.badgeVariant === 'recommend' && (
                <Sparkles className="h-2.5 w-2.5" />
              )}
              <span>{dish.badge}</span>
            </span>
          ) : null}
        </div>

        <div className="flex h-24 min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <h3 className="truncate font-display text-sm font-bold text-[#1e1b1a]">
              {dish.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#56423c]">
              {dish.description}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="ops-nums font-display text-sm font-extrabold text-[#9a401c]">
              {formatVND(dish.price)}
            </span>

            {qtyInCart > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center rounded-full bg-[#efe6e4] p-0.5 shadow-inner"
              >
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={(e) => handleQuickUpdateQty(dish.id, -1, e)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1e1b1a] shadow-2xs active:scale-90 transition-transform"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="ops-nums w-6 text-center text-xs font-bold text-[#1e1b1a]">
                  {qtyInCart}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={(e) => handleQuickAdd(dish, e)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9a401c] text-white shadow-2xs active:scale-90 transition-transform"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => handleQuickAdd(dish, e)}
                className="flex min-h-[34px] items-center gap-1 rounded-full bg-[#9a401c] hover:bg-[#ba5831] px-3 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-36">
      <CustomerHeader
        title="Phố Cổ"
        subtitle={
          activeTab === 'search' ? 'Tìm Kiếm & Gợi Ý Món Ăn' : 'Thực Đơn'
        }
        tableNumber={displayTable}
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      <main className="mx-auto w-full max-w-md">
        {activeTab === 'menu' ? (
          <>
            {/* Quick Search Bar & Vegetarian Toggle */}
            <div className="px-4 pt-3 pb-1.5">
              <div className="flex items-center gap-2 rounded-full bg-[#efe6e4] px-4 py-2.5 shadow-2xs">
                <Search className="h-4 w-4 text-[#89726a] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setActiveTab('search')}
                  placeholder="Tìm kiếm khai vị, phở cuốn, bún chả..."
                  className="w-full bg-transparent text-xs text-[#1e1b1a] placeholder:text-[#89726a] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Lọc món chay"
                  onClick={() => {
                    setActiveTab('search');
                    setActiveMood('VEG');
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5ecea] text-[#00873a] hover:bg-[#e9e1df] transition-colors"
                >
                  <Leaf className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Warm Table Greeting Notice */}
            <div className="px-4 py-1.5">
              <div className="flex items-center justify-between rounded-xl bg-[#fbf2f0] px-3.5 py-2 border border-[#dcc1b8]/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1e1b1a]">
                  <Utensils className="h-3.5 w-3.5 text-[#9a401c]" />
                  <span>Đang phục vụ {displayTable} • Tầng 1</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#00873a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00873a] animate-ping" />
                  <span>Bếp sẵn sàng</span>
                </div>
              </div>
            </div>

            {/* Sticky Category Filter Bar */}
            <div className="sticky top-16 z-30 bg-[#fff8f6]/95 py-2 backdrop-blur-md shadow-[0_4px_16px_-4px_rgba(154,64,28,0.06)]">
              <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
                {[
                  { id: 'ALL', label: 'Tất cả', count: PHO_CO_DISHES.length, icon: Utensils },
                  { id: 'APPETIZER', label: 'Khai vị', count: 4, icon: Sparkles },
                  { id: 'MAIN', label: 'Món chính', count: 4, icon: Flame },
                  { id: 'SOUP', label: 'Món Nước & Lẩu', icon: Soup },
                  { id: 'DESSERT', label: 'Tráng miệng', icon: Cake },
                  { id: 'DRINK', label: 'Thức uống', icon: Coffee },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setActiveCategory(cat.id as CategoryFilter);
                      }}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#9a401c] text-white shadow-xs'
                          : 'bg-white text-[#1e1b1a] border border-[#dcc1b8]/50 hover:bg-[#f5ecea]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                      {cat.count ? (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#ba5831] text-white'
                              : 'bg-[#efe6e4] text-[#56423c]'
                          }`}
                        >
                          {cat.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Khai Vị */}
            {appetizerDishes.length > 0 && (
              <section className="px-4 pt-3 pb-2">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1.5 rounded-full bg-[#9a401c]" />
                    <h2 className="font-display text-lg font-bold text-[#1e1b1a]">
                      Khai Vị
                    </h2>
                    <span className="text-xs text-[#56423c]">
                      Thanh đạm, kích thích vị giác
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#9a401c]">
                    {appetizerDishes.length} món
                  </span>
                </div>
                <div className="space-y-2.5">
                  {appetizerDishes.map(renderDishCard)}
                </div>
              </section>
            )}

            {/* Section 2: Món Chính & Đặc Sản */}
            {mainDishes.length > 0 && (
              <section className="px-4 pt-4 pb-2">
                <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#f5ecea] p-3.5 shadow-xs border border-[#dcc1b8]/40">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-1.5 rounded-full bg-[#9a401c]" />
                        <h2 className="font-display text-lg font-bold text-[#1e1b1a]">
                          Món Chính &amp; Thực Thực
                        </h2>
                      </div>
                      <p className="mt-0.5 text-xs text-[#56423c]">
                        Đậm đà hương vị truyền thống ngàn năm
                      </p>
                    </div>
                    <span className="rounded-full bg-[#ffdbcf] px-2.5 py-1 text-[11px] font-bold text-[#380d00]">
                      Đặc sản bếp đỏ
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {mainDishes.map(renderDishCard)}
                </div>
              </section>
            )}

            {/* Reassurance & Custom Taste Note Banner */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between rounded-2xl bg-[#efe6e4] p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffdbcf] text-[#380d00]">
                    <Utensils className="h-5 w-5 text-[#9a401c]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e1b1a]">
                      Bạn có yêu cầu khẩu vị riêng?
                    </h4>
                    <p className="text-[11px] text-[#56423c]">
                      Giảm mặn, không hành cay, ăn chay...
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="shrink-0 rounded-full bg-[#fff8f6] px-3 py-1.5 text-xs font-bold text-[#9a401c] shadow-2xs active:scale-95 transition-transform"
                >
                  Ghi chú
                </button>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: TÌM KIẾM & GỢI Ý MÓN ĂN */
          <div className="px-4 pt-3 space-y-5">
            {/* Search Input & Quick Mood Pills */}
            <div className="sticky top-16 z-30 bg-[#fff8f6]/95 py-2 backdrop-blur-md space-y-2.5">
              <div className="flex items-center gap-2 rounded-full bg-[#f5ecea] px-4 py-2.5 shadow-inner">
                <Search className="h-4 w-4 text-[#9a401c] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nem, phở, bún chả, lẩu riêu..."
                  className="w-full bg-transparent text-xs text-[#1e1b1a] placeholder:text-[#56423c]/70 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa tìm kiếm"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9e1df] text-[#56423c]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Mood / Diet Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'ALL', label: 'Tất cả', icon: Sparkles },
                  { id: 'VEG', label: 'Món chay', icon: Leaf },
                  { id: 'SPICY', label: 'Cay nồng', icon: Flame },
                  { id: 'HOT_SOUP', label: 'Món nước nóng', icon: Soup },
                  { id: 'REFRESH', label: 'Giải nhiệt', icon: Coffee },
                ].map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = activeMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => setActiveMood(mood.id as MoodFilter)}
                      className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#9a401c] text-white shadow-xs'
                          : 'bg-[#f5ecea] text-[#56423c] hover:text-[#1e1b1a]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="h-4 w-4 text-[#9a401c]" />
                    <h2 className="font-display text-sm font-bold text-[#1e1b1a]">
                      Tìm kiếm gần đây
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecentSearches([])}
                    className="text-[11px] font-medium text-[#56423c] hover:text-[#9a401c]"
                  >
                    Xóa lịch sử
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-full bg-[#f5ecea] px-3 py-1.5 text-xs text-[#1e1b1a] hover:bg-[#efe6e4] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending at Table 04 */}
            {!searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#9a401c]" />
                  <h2 className="font-display text-sm font-bold text-[#1e1b1a]">
                    Xu hướng thực khách {displayTable}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((trend) => (
                    <button
                      key={trend.label}
                      type="button"
                      onClick={() => setSearchQuery(trend.label)}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1e1b1a] shadow-2xs border border-[#dcc1b8]/40 active:scale-95 transition-transform"
                    >
                      {trend.highlight && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9a401c] animate-pulse" />
                      )}
                      {trend.isVeg && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006b2c]" />
                      )}
                      <span>{trend.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Curated Occasion Collections */}
            {!searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-[#1e1b1a]">
                    Đề xuất theo dịp ăn
                  </h2>
                  <span className="text-[11px] font-semibold text-[#9a401c]">
                    4 danh mục
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('menu');
                      setActiveCategory('APPETIZER');
                    }}
                    className="flex flex-col justify-between rounded-xl bg-[#fbf2f0] p-3.5 text-left shadow-2xs border border-[#dcc1b8]/40 hover:bg-[#f5ecea]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffdbcf] text-[#9a401c]">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#9a401c]">
                        10-15p
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h3 className="text-xs font-bold text-[#1e1b1a]">
                        Món ăn kèm nhanh
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#56423c]">
                        Khai vị, nem rán, nộm tươi mát
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('menu');
                      setActiveCategory('MAIN');
                    }}
                    className="flex flex-col justify-between rounded-xl bg-[#fbf2f0] p-3.5 text-left shadow-2xs border border-[#dcc1b8]/40 hover:bg-[#f5ecea]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7e1dd] text-[#56423c]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#56423c]">
                        Đặc trưng
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h3 className="text-xs font-bold text-[#1e1b1a]">
                        Đặc sản Hà Nội
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#56423c]">
                        Bún chả nướng que tre, chả cá
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMood('REFRESH')}
                    className="flex flex-col justify-between rounded-xl bg-[#fbf2f0] p-3.5 text-left shadow-2xs border border-[#dcc1b8]/40 hover:bg-[#f5ecea]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffdbcf] text-[#9a401c]">
                        <Coffee className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#006b2c]">
                        Thanh nhiệt
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h3 className="text-xs font-bold text-[#1e1b1a]">
                        Giải nhiệt mùa hè
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#56423c]">
                        Chè sen long nhãn, trà sen vàng
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('menu');
                      setActiveCategory('SOUP');
                    }}
                    className="flex flex-col justify-between rounded-xl bg-[#fbf2f0] p-3.5 text-left shadow-2xs border border-[#dcc1b8]/40 hover:bg-[#f5ecea]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7ffc97]/50 text-[#006b2c]">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#9a401c]">
                        3-4 người
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h3 className="text-xs font-bold text-[#1e1b1a]">
                        Combo gia đình
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#56423c]">
                        Lẩu riêu cua ấm cúng tròn vị
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Search / Recommended Dish List */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1e1b1a]">
                    {searchQuery
                      ? `Kết quả tìm kiếm (${searchResults.length})`
                      : 'Món gợi ý đắt khách'}
                  </h2>
                  <p className="text-[11px] text-[#56423c]">
                    Bếp trưởng gợi ý cho khẩu vị thanh tao Phố Cổ
                  </p>
                </div>
                <span className="rounded-full bg-[#ffdbcf] px-2.5 py-0.5 text-[10px] font-bold text-[#380d00]">
                  Top hôm nay
                </span>
              </div>
              <div className="space-y-2.5">
                {searchResults.map(renderDishCard)}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Floating Cart Dock */}
      {cartCount > 0 && (
        <aside className="fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-[#342f2e] p-2.5 pl-3.5 text-[#f8efed] shadow-[0_8px_30px_rgba(41,37,36,0.3)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#9a401c] text-white shadow-xs">
                <ShoppingBag className="h-5 w-5" />
                <span className="ops-nums absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#006b2c] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#f8efed]">
                    {cartCount} món đã chọn
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#89726a]" />
                  <span className="text-[11px] font-bold text-[#7ffc97]">
                    {displayTable}
                  </span>
                </div>
                <span className="ops-nums font-display text-sm font-bold text-[#ffdbcf]">
                  {formatVND(cartTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/cart')}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-[#9a401c] hover:bg-[#ba5831] px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-transform"
            >
              <span>Xem giỏ / Gửi bếp</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Dish Customization Bottom Sheet */}
      <DishDetailSheet
        dish={selectedDishForDetail}
        onClose={() => setSelectedDishForDetail(null)}
        onAddToCart={(dish, modifiers, note, qty) => {
          addItem(dish, modifiers, note, qty);
        }}
      />

      {/* Call Staff Modal */}
      <CallStaffSheet
        isOpen={isCallStaffOpen}
        tableNumber={displayTable}
        onClose={() => setIsCallStaffOpen(false)}
      />

      {/* 4-Tab Bottom Navigation */}
      <CustomerBottomNav
        activeTab={activeTab}
        cartCount={cartCount}
        ordersCount={placedCount}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
