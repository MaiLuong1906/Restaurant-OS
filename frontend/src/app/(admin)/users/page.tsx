'use client';

import * as React from 'react';
import { UserPlus, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { userService } from '@/services/userService';
import { UserResponseDto } from '@/types/user';
import { ApiError } from '@/lib/api-client';

import { RbacRow } from './types';
import { UserKpiCards } from './components/UserKpiCards';
import { UserFilterBar } from './components/UserFilterBar';
import { UserTable } from './components/UserTable';
import { RbacMatrixTable } from './components/RbacMatrixTable';
import { CreateUserModal } from './components/CreateUserModal';
import { ResetPinModal } from './components/ResetPinModal';
import { PromoteUserModal } from './components/PromoteUserModal';
import { DeleteUserModal } from './components/DeleteUserModal';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = React.useState<'list' | 'matrix'>('list');
  const [toastMsg, setToastMsg] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dữ liệu từ API Backend
  const [users, setUsers] = React.useState<UserResponseDto[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [resetPinUser, setResetPinUser] = React.useState<UserResponseDto | null>(null);
  const [promoteUser, setPromoteUser] = React.useState<UserResponseDto | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = React.useState<UserResponseDto | null>(null);

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
        setShowCreateModal(false);
        setResetPinUser(null);
        setPromoteUser(null);
        setDeleteConfirmUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = React.useCallback((text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ text, type });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // 1. Tải danh sách nhân sự từ Backend
  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const isActiveParam =
        activeStatusFilter === 'ACTIVE' ? true : activeStatusFilter === 'LOCKED' ? false : undefined;

      const pageData = await userService.getAllUsers({
        role: roleFilter,
        search: searchQuery,
        isActive: isActiveParam,
        page: currentPage,
        size: pageSize,
      });
      setUsers(pageData.items || []);
      setTotalElements(pageData.totalElements ?? (pageData.items ? pageData.items.length : 0));
      setTotalPages(pageData.totalPages ?? 1);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể kết nối máy chủ Backend';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery, activeStatusFilter, currentPage, pageSize, showToast]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 2. Khóa / Mở khóa tài khoản (toggle-status)
  const handleToggleUserStatus = async (user: UserResponseDto) => {
    try {
      const updated = await userService.toggleStatus(user.employeeCode || user.id);
      showToast(
        updated.isActive
          ? `Đã mở khóa tài khoản cho ${updated.fullName}`
          : `Đã tạm khóa tài khoản ${updated.fullName}. Nhân sự không thể đăng nhập POS!`
      );
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Cập nhật trạng thái thất bại';
      showToast(msg, 'error');
    }
  };

  // 3. Ma trận RBAC Tham Chiếu (Read-only Reference)
  const [matrix] = React.useState<RbacRow[]>([
    { id: '1', feature: 'Xem Tổng Quan KPI & Doanh Thu Realtime', owner: true, manager: true, chef: true, staff: false },
    { id: '2', feature: 'Hủy Món / Sửa Đơn sau khi Gửi Bếp (Void Item)', owner: true, manager: true, chef: false, staff: false },
    { id: '3', feature: 'Áp Dụng Chiết Khấu / Giảm Giá Hóa Đơn', owner: true, manager: true, chef: false, staff: false },
    { id: '4', feature: 'Kiểm Đếm Két Tiền & Chốt Ca (Shift Close)', owner: true, manager: true, chef: false, staff: false },
    { id: '5', feature: 'Xem Báo Cáo Tài Chính P&L & Lợi Nhuận Gộp', owner: true, manager: false, chef: false, staff: false },
    { id: '6', feature: 'Xếp Lịch Ca Tuần & Phê Duyệt Nghỉ/Đổi Ca', owner: true, manager: true, chef: false, staff: false },
    { id: '7', feature: 'Phân Bổ Quỹ Tip & Quyết Toán Bảng Lương', owner: true, manager: false, chef: false, staff: false },
    { id: '8', feature: 'Cập Nhật Định Lượng BOM & Giá Cost Menu', owner: true, manager: false, chef: true, staff: false },
    { id: '9', feature: 'Nghiệm Thu Đơn Nhập Kho (Inbound PO)', owner: true, manager: true, chef: true, staff: false },
    { id: '10', feature: 'Cấp Quyền & Đổi Mã PIN Hệ Thống RBAC', owner: true, manager: false, chef: false, staff: false },
  ]);

  // Tính toán KPI động
  const activeCount = users.filter((u) => u.isActive).length;
  const lockedCount = users.filter((u) => !u.isActive).length;
  const pinCount = users.filter((u) => u.hasPin).length;
  const maxCeiling = users.reduce((max, u) => Math.max(max, u.discountCeiling || 0), 0);

  return (
    <div className="w-full">
      {/* Toast Alert Toàn Cục */}
      {toastMsg && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-md max-w-md ${
            toastMsg.type === 'error'
              ? 'bg-rose-900/95 border-rose-700 text-rose-100 shadow-rose-950/40'
              : 'bg-stone-900/95 border-stone-700 text-emerald-300 shadow-stone-950/40'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-white flex-1 leading-snug">{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-stone-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Quản Trị Tài Khoản &amp; Phân Quyền RBAC
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Cấp phát tài khoản nhân sự, mã PIN xác thực trạm POS/KDS, trần hạn mức chiết khấu và ma trận quyền truy cập
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Sub-tab switcher */}
            <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-ops-brand text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Danh Sách ({totalElements})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'bg-ops-brand text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ma Trận Quyền Hạn
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cấp Tài Khoản Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Core RBAC KPI Cards */}
        <UserKpiCards
          totalCount={totalElements}
          activeCount={activeCount}
          lockedCount={lockedCount}
          pinCount={pinCount}
          maxCeiling={maxCeiling}
        />

        {/* Tab 1: Danh sách tài khoản */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-xl shadow-2xs border border-stone-200 overflow-hidden space-y-4">
            <UserFilterBar
              searchQuery={searchQuery}
              onSearchChange={(query) => {
                setSearchQuery(query);
                setCurrentPage(0);
              }}
              roleFilter={roleFilter}
              onRoleChange={(role) => {
                setRoleFilter(role);
                setCurrentPage(0);
              }}
              statusFilter={activeStatusFilter}
              onStatusChange={(status) => {
                setActiveStatusFilter(status);
                setCurrentPage(0);
              }}
            />

            {apiError && (
              <div className="mx-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{apiError}</span>
                </div>
                <button
                  onClick={loadUsers}
                  className="font-bold underline text-rose-900 hover:text-rose-700 cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            <UserTable
              users={users}
              isLoading={isLoading}
              currentPage={currentPage}
              pageSize={pageSize}
              totalElements={totalElements}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(0);
              }}
              onPromoteClick={(u) => setPromoteUser(u)}
              onResetPinClick={(u) => setResetPinUser(u)}
              onToggleStatusClick={handleToggleUserStatus}
              onDeleteClick={(u) => setDeleteConfirmUser(u)}
            />
          </div>
        )}

        {/* Tab 2: Ma trận phân quyền RBAC */}
        {activeTab === 'matrix' && (
          <RbacMatrixTable matrix={matrix} />
        )}
      </div>

      {/* 4 Modals Tái Cấu Trúc */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(created) => {
          showToast(`Đã cấp tài khoản thành công cho ${created.fullName} (Mã: ${created.employeeCode})!`);
          setShowCreateModal(false);
          loadUsers();
        }}
      />

      <ResetPinModal
        user={resetPinUser}
        onClose={() => setResetPinUser(null)}
        onSuccess={loadUsers}
        showToast={showToast}
      />

      <PromoteUserModal
        user={promoteUser}
        onClose={() => setPromoteUser(null)}
        onSuccess={loadUsers}
        showToast={showToast}
      />

      <DeleteUserModal
        user={deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onSuccess={loadUsers}
        showToast={showToast}
      />
    </div>
  );
}
