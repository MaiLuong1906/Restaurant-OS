'use client';

import * as React from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { AdminToast, useAdminToast } from '@/components/admin/AdminToast';
import { ApiError } from '@/lib/api-client';
import { dishService } from '@/services/dishService';
import {
  CreateDishRequest,
  DishResponseDto,
  UpdateDishAvailabilityRequest,
  UpdateDishRequest,
} from '@/types/dish';
import { PageResponse } from '@/types/user';
import {
  DeleteDishModal,
  DishCatalogList,
  DishDetailPanel,
  DishFilterBar,
  DishFormModal,
} from './components';

export default function AdminMenuBomPage() {
  // =========================================================================
  // State: data
  // =========================================================================
  const [pageData, setPageData] = React.useState<PageResponse<DishResponseDto> | null>(null);
  const [dishes, setDishes] = React.useState<DishResponseDto[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [availableDishes, setAvailableDishes] = React.useState<DishResponseDto[]>([]);

  // =========================================================================
  // State: selection & filters
  // =========================================================================
  const [selectedDish, setSelectedDish] = React.useState<DishResponseDto | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const activeRequestIdRef = React.useRef(0);
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(5);

  // Debounce search query 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // =========================================================================
  // State: loading / error
  // =========================================================================
  const [isLoading, setIsLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);

  // =========================================================================
  // State: modals
  // =========================================================================
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editDish, setEditDish] = React.useState<DishResponseDto | null>(null);
  const [deleteDish, setDeleteDish] = React.useState<DishResponseDto | null>(null);

  // =========================================================================
  // State: submitting / deleting
  // =========================================================================
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // =========================================================================
  // Toast
  // =========================================================================
  const { toastMsg, showToast, hideToast } = useAdminToast();

  // =========================================================================
  // Fetch danh sách món ăn (kèm Race Condition & Sequence Guard)
  // =========================================================================
  const fetchDishes = React.useCallback(
    async (page = 0, size = pageSize, search = debouncedSearch) => {
      const requestId = ++activeRequestIdRef.current;
      setIsLoading(true);
      setApiError(null);

      try {
        const params: Parameters<typeof dishService.getAllDishesPaged>[0] = {
          page,
          size,
        };
        if (selectedCategory !== 'ALL') params.category = selectedCategory;
        if (search.trim()) params.search = search.trim();
        if (availabilityFilter === 'AVAILABLE') params.isAvailable = true;
        if (availabilityFilter === 'UNAVAILABLE') params.isAvailable = false;

        const result = await dishService.getAllDishesPaged(params);

        // Bỏ qua nếu có request mới hơn đã được kích hoạt
        if (requestId !== activeRequestIdRef.current) return;

        setPageData(result);
        setDishes(result.items);

        // Giữ selectedDish nếu còn trong trang mới
        setSelectedDish((prev) => {
          if (!prev) return result.items[0] ?? null;
          const still = result.items.find((d) => d.id === prev.id);
          return still ?? result.items[0] ?? null;
        });
      } catch (err) {
        if (requestId !== activeRequestIdRef.current) return;
        const msg = err instanceof ApiError ? err.message : 'Không thể tải danh sách món ăn';
        setApiError(msg);
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [selectedCategory, debouncedSearch, availabilityFilter, pageSize]
  );

  // Fetch categories & non-combo dishes (for combo form) — chỉ 1 lần khi mount
  React.useEffect(() => {
    dishService.getCategories().then(setCategories).catch(() => {});
    dishService.getNonComboDishes().then(setAvailableDishes).catch(() => {});
  }, []);

  // Fetch khi filter thay đổi (reset về trang 0)
  React.useEffect(() => {
    setCurrentPage(0);
    fetchDishes(0, pageSize, debouncedSearch);
  }, [selectedCategory, debouncedSearch, availabilityFilter, pageSize, fetchDishes]);

  // =========================================================================
  // Handlers: Toggle Availability (Optimistic Update — UC20)
  // =========================================================================
  const handleToggle = async (dish: DishResponseDto, e: React.MouseEvent) => {
    e.stopPropagation();

    const nextAvailable = !dish.isAvailable;
    const payload: UpdateDishAvailabilityRequest = {
      isAvailable: nextAvailable,
      soldOutReason: nextAvailable ? undefined : 'Bếp báo tạm hết',
    };

    // Optimistic update
    const rollbackDishes = [...dishes];
    const rollbackSelected = selectedDish;
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dish.id
          ? { ...d, isAvailable: nextAvailable, soldOutReason: payload.soldOutReason ?? null }
          : d
      )
    );
    if (selectedDish?.id === dish.id) {
      setSelectedDish((prev) =>
        prev ? { ...prev, isAvailable: nextAvailable, soldOutReason: payload.soldOutReason ?? null } : prev
      );
    }

    try {
      const updated = await dishService.toggleAvailability(dish.id, payload);
      // Cập nhật chính xác từ server
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (selectedDish?.id === updated.id) setSelectedDish(updated);

      showToast(
        nextAvailable
          ? `✅ Mở bán lại: ${dish.name}`
          : `⏸ Tạm dừng bán: ${dish.name} — POS & QR khách đã cập nhật`
      );
    } catch (err) {
      // Rollback
      setDishes(rollbackDishes);
      setSelectedDish(rollbackSelected);
      const msg = err instanceof ApiError ? err.message : 'Không thể cập nhật trạng thái';
      showToast(`❌ Lỗi: ${msg}`);
    }
  };

  // =========================================================================
  // Handlers: Create Dish
  // =========================================================================
  const handleCreate = async (data: CreateDishRequest | UpdateDishRequest) => {
    setIsSubmitting(true);
    try {
      const created = await dishService.createDish(data as CreateDishRequest);
      setShowCreateModal(false);
      showToast(`✅ Đã tạo món "${created.name}" thành công!`);
      // Refresh để lấy danh sách mới (có thể thay đổi phân trang)
      setCurrentPage(0);
      await fetchDishes(0, pageSize, debouncedSearch);
      // Refresh non-combo list nếu tạo món lẻ mới
      if (!created.isCombo) {
        dishService.getNonComboDishes().then(setAvailableDishes).catch(() => {});
      }
      // Refresh categories
      dishService.getCategories().then(setCategories).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể tạo món ăn';
      showToast(`❌ Lỗi: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // Handlers: Update Dish
  // =========================================================================
  const handleUpdate = async (data: CreateDishRequest | UpdateDishRequest) => {
    if (!editDish) return;
    setIsSubmitting(true);
    try {
      const updated = await dishService.updateDish(editDish.id, data as UpdateDishRequest);
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (selectedDish?.id === updated.id) setSelectedDish(updated);
      setEditDish(null);
      showToast(`✅ Đã cập nhật món "${updated.name}"`);
      // Refresh non-combo list (có thể category thay đổi)
      dishService.getNonComboDishes().then(setAvailableDishes).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể cập nhật món ăn';
      showToast(`❌ Lỗi: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // Handlers: Delete Dish
  // =========================================================================
  const handleDelete = async () => {
    if (!deleteDish) return;
    setIsDeleting(true);
    try {
      await dishService.deleteDish(deleteDish.id);
      showToast(`🗑 Đã xóa món "${deleteDish.name}"`);

      // Xử lý phân trang chuẩn xác sau khi xóa món:
      // Nếu xóa món duy nhất còn lại trên trang (và không phải trang 0), lùi về trang trước đó
      const isOnlyItemOnPage = dishes.length <= 1;
      const targetPage = isOnlyItemOnPage && currentPage > 0 ? currentPage - 1 : currentPage;

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
      await fetchDishes(targetPage, pageSize, debouncedSearch);

      setDeleteDish(null);
      // Refresh non-combo list & categories
      dishService.getNonComboDishes().then(setAvailableDishes).catch(() => {});
      dishService.getCategories().then(setCategories).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể xóa món ăn';
      showToast(`❌ Lỗi: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // Pagination
  // =========================================================================
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDishes(page, pageSize, debouncedSearch);
  };

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="w-full">
      {/* Toast */}
      <AdminToast message={toastMsg} onClose={hideToast} />

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1720px] mx-auto w-full">
        {/* ================================================================
            Top Header
        ================================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Master Menu &amp; Quản Lý Thực Đơn
            </h1>
            <p className="text-sm font-medium text-stone-500">
              Quản lý toàn bộ món ăn đơn lẻ, combo và trạng thái bán hàng theo thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>+ Thêm Món Mới</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{apiError}</span>
            <button
              onClick={() => fetchDishes(currentPage, pageSize, debouncedSearch)}
              className="ml-auto px-2.5 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg cursor-pointer transition-colors font-bold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ================================================================
            2-Column Split Layout
        ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ==============================
              Left: Dish Catalog (5 cols)
          ============================== */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col h-full min-h-0 gap-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200 shrink-0">
                <span className="font-mono text-xs uppercase font-bold text-stone-700 tracking-wider">
                  Danh Mục Món Ăn ({pageData?.totalElements ?? 0})
                </span>
                <span className="text-xs font-semibold text-stone-500 font-mono">
                  Trang {currentPage + 1}/{Math.max(pageData?.totalPages ?? 1, 1)}
                </span>
              </div>

              {/* Filter Bar */}
              <DishFilterBar
                search={searchQuery}
                onSearchChange={setSearchQuery}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                availabilityFilter={availabilityFilter}
                onAvailabilityChange={setAvailabilityFilter}
                totalCount={pageData?.totalElements ?? 0}
              />

              {/* List */}
              <DishCatalogList
                dishes={dishes}
                selectedId={selectedDish?.id ?? null}
                onSelect={setSelectedDish}
                onToggle={handleToggle}
                isLoading={isLoading}
              />

              {/* Pagination Bar */}
              <div className="pt-3 border-t border-stone-200 shrink-0 space-y-2.5">
                {/* Thông tin số lượng & Chọn page size */}
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>
                    Hiển thị{' '}
                    <strong className="text-stone-800 font-bold font-mono">
                      {pageData && pageData.totalElements > 0
                        ? `${currentPage * pageSize + 1} - ${Math.min((currentPage + 1) * pageSize, pageData.totalElements)}`
                        : '0'}
                    </strong>{' '}
                    / <strong className="text-stone-800 font-bold font-mono">{pageData?.totalElements ?? 0}</strong> món
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-500">Mỗi trang:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        setCurrentPage(0);
                        fetchDishes(0, newSize, debouncedSearch);
                      }}
                      className="px-2 py-0.5 bg-stone-50 border border-stone-200 rounded font-mono text-xs font-bold text-stone-700 focus:outline-none focus:border-ops-brand cursor-pointer"
                    >
                      <option value={5}>5 món</option>
                      <option value={10}>10 món</option>
                      <option value={20}>20 món</option>
                      <option value={50}>50 món</option>
                    </select>
                  </div>
                </div>

                {/* Các nút điều hướng */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0 || isLoading}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
                    title="Trang đầu"
                    aria-label="Trang đầu"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || isLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-mono text-xs font-bold text-stone-700"
                    title="Trang trước"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <span className="px-3 py-1 font-mono text-xs font-extrabold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg">
                    {currentPage + 1} / {Math.max(pageData?.totalPages ?? 1, 1)}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pageData || currentPage >= pageData.totalPages - 1 || isLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-mono text-xs font-bold text-stone-700"
                    title="Trang sau"
                    aria-label="Trang sau"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePageChange((pageData?.totalPages ?? 1) - 1)}
                    disabled={!pageData || currentPage >= pageData.totalPages - 1 || isLoading}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
                    title="Trang cuối"
                    aria-label="Trang cuối"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==============================
              Right: Detail Panel (7 cols)
          ============================== */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-2xs flex flex-col h-full min-h-0">
            <DishDetailPanel
              dish={selectedDish}
              onEdit={(d) => setEditDish(d)}
              onDelete={(d) => setDeleteDish(d)}
            />
          </div>
        </div>
      </div>

      {/* ================================================================
          Modals
      ================================================================ */}

      {/* Create Modal */}
      {showCreateModal && (
        <DishFormModal
          mode="create"
          availableDishes={availableDishes}
          isSubmitting={isSubmitting}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editDish && (
        <DishFormModal
          mode="edit"
          dish={editDish}
          availableDishes={availableDishes}
          isSubmitting={isSubmitting}
          onSubmit={handleUpdate}
          onClose={() => setEditDish(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteDish && (
        <DeleteDishModal
          dish={deleteDish}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteDish(null)}
        />
      )}
    </div>
  );
}
