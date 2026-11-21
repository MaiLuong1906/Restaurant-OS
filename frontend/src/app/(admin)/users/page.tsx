'use client';

import * as React from 'react';
import {
  Shield,
  CreditCard,
  Hash,
  UserPlus,
  CheckCircle2,
  XCircle,
  X,
  Search,
  KeyRound,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { userService } from '@/services/userService';
import { UserResponseDto, UserRoleCode } from '@/types/user';
import { ApiError } from '@/lib/api-client';

interface RbacRow {
  id: string;
  feature: string;
  owner: boolean;
  manager: boolean;
  chef: boolean;
  staff: boolean;
}

const ROLE_OPTIONS: { code: UserRoleCode; label: string; defaultCeiling: number }[] = [
  { code: 'OWNER', label: 'Chủ Quán (Owner)', defaultCeiling: 100 },
  { code: 'MANAGER', label: 'Quản Lý Ca (Shift Manager)', defaultCeiling: 20 },
  { code: 'CASHIER', label: 'Thu Ngân (Cashier)', defaultCeiling: 5 },
  { code: 'CHEF', label: 'Bếp Trưởng / Pha Chế (Chef)', defaultCeiling: 0 },
  { code: 'WAITER', label: 'Phục Vụ (Waiter)', defaultCeiling: 0 },
  { code: 'STAFF', label: 'Nhân Viên Khác (Staff)', defaultCeiling: 0 },
];

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

  // Modals state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [resetPinUser, setResetPinUser] = React.useState<UserResponseDto | null>(null);
  const [promoteUser, setPromoteUser] = React.useState<UserResponseDto | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = React.useState<UserResponseDto | null>(null);

  // Form states
  const [newPin, setNewPin] = React.useState('');
  const [selectedPromoteRole, setSelectedPromoteRole] = React.useState<UserRoleCode>('MANAGER');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Validation & Modal Error States
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [pinModalError, setPinModalError] = React.useState<string | null>(null);
  const [promoteModalError, setPromoteModalError] = React.useState<string | null>(null);

  // Password & PIN visibility toggles
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPinCode, setShowPinCode] = React.useState(false);
  const [showResetPin, setShowResetPin] = React.useState(false);

  const [newUser, setNewUser] = React.useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    roleCode: 'CASHIER' as UserRoleCode,
    pinCode: '',
  });

  // Helper render thông báo lỗi field tinh gọn, chuẩn UI/UX F&B
  const renderFieldError = (errorMsg?: string) => {
    if (!errorMsg) return null;
    return (
      <div className="mt-1 px-2 py-1 rounded bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 font-medium leading-snug flex items-start gap-1.5 animate-in fade-in">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
        <span className="flex-1">{errorMsg}</span>
      </div>
    );
  };

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
        setFormErrors({});
        setModalError(null);
        setPinModalError(null);
        setPromoteModalError(null);
        setShowPassword(false);
        setShowPinCode(false);
        setShowResetPin(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ text, type });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Tải danh sách nhân sự từ Backend
  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const isActiveParam =
        activeStatusFilter === 'ACTIVE' ? true : activeStatusFilter === 'LOCKED' ? false : undefined;

      const data = await userService.getAllUsers({
        role: roleFilter,
        search: searchQuery,
        isActive: isActiveParam,
      });
      setUsers(data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể kết nối máy chủ Backend';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery, activeStatusFilter]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 2. Cấp tài khoản mới
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    // Client-side quick check (Phương án A: Chuẩn hóa bắt buộc)
    const errors: Record<string, string> = {};
    if (!newUser.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên nhân viên';
    }
    if (newUser.username.trim() && !/^[a-zA-Z0-9._-]+$/.test(newUser.username.trim())) {
      errors.username = 'Chỉ dùng chữ, số, dấu . _ - (không dùng @ hoặc khoảng trắng)';
    }
    if (!newUser.password.trim()) {
      errors.password = 'Vui lòng nhập mật khẩu khởi tạo';
    } else if (newUser.password.trim().length < 6) {
      errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    if (!newUser.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else if (!/^0\d{9}$/.test(newUser.phone.trim())) {
      errors.phone = 'SĐT phải gồm đúng 10 chữ số (bắt đầu bằng 0)';
    }
    if (!newUser.pinCode.trim()) {
      errors.pinCode = 'Vui lòng cài đặt mã PIN trạm (4-6 số)';
    } else if (!/^\d{4,6}$/.test(newUser.pinCode.trim())) {
      errors.pinCode = 'Mã PIN gồm đúng 4 đến 6 chữ số';
    }
    if (newUser.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim())) {
      errors.email = 'Email không hợp lệ (Ví dụ: nhanvien@restaurant.vn)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await userService.createUser({
        fullName: newUser.fullName.trim(),
        username: newUser.username.trim() || undefined,
        password: newUser.password.trim(),
        email: newUser.email.trim() || undefined,
        phone: newUser.phone.trim(),
        roleCode: newUser.roleCode,
        pinCode: newUser.pinCode.trim(),
      });

      showToast(`Đã cấp tài khoản thành công cho ${created.fullName} (Mã: ${created.employeeCode})!`);
      setShowCreateModal(false);
      setFormErrors({});
      setModalError(null);
      setShowPassword(false);
      setShowPinCode(false);
      setNewUser({
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        roleCode: 'CASHIER',
        pinCode: '',
      });
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details && typeof err.details === 'object' && Object.keys(err.details).length > 0) {
          setFormErrors(err.details as Record<string, string>);
        } else {
          // Thông minh: Ánh xạ lỗi 409 Conflict hoặc lỗi field cụ thể trực tiếp vào ô input thay vì banner
          const lowerMsg = (err.message || '').toLowerCase();
          if (lowerMsg.includes('tên đăng nhập') || lowerMsg.includes('username')) {
            setFormErrors({ username: err.message || 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác' });
          } else if (lowerMsg.includes('email')) {
            setFormErrors({ email: err.message || 'Email này đã được sử dụng, vui lòng chọn email khác' });
          } else if (lowerMsg.includes('số điện thoại') || lowerMsg.includes('phone')) {
            setFormErrors({ phone: err.message || 'Số điện thoại này đã được sử dụng' });
          } else {
            setModalError(err.message || 'Dữ liệu không hợp lệ hoặc đã tồn tại');
          }
        }
      } else {
        setModalError(err instanceof Error ? err.message : 'Tạo tài khoản thất bại');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Đổi mã PIN trạm
  const handleResetPin = async () => {
    setPinModalError(null);
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      setPinModalError('Mã PIN mới phải gồm đúng 4 đến 6 chữ số');
      return;
    }
    if (!resetPinUser) return;

    setIsSubmitting(true);
    try {
      await userService.updatePin(resetPinUser.employeeCode || resetPinUser.id, {
        pinCode: newPin,
      });
      showToast(`Đã đổi mã PIN trạm thành công cho ${resetPinUser.fullName}!`);
      setResetPinUser(null);
      setNewPin('');
      setPinModalError(null);
      setShowResetPin(false);
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Đổi mã PIN thất bại';
      setPinModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Thăng chức / Đổi vai trò (Full Cách 1: Tự đổi tiền tố mã nhân viên & nâng trần chiết khấu)
  const handlePromoteRole = async () => {
    if (!promoteUser) return;
    setPromoteModalError(null);

    setIsSubmitting(true);
    try {
      const updated = await userService.updateUser(promoteUser.employeeCode || promoteUser.id, {
        roleCode: selectedPromoteRole,
      });
      showToast(
        `Thăng chức thành công! Mã mới: ${updated.employeeCode}, Vai trò: ${updated.roleName}, Trần CK: ${updated.discountCeiling}%`
      );
      setPromoteUser(null);
      setPromoteModalError(null);
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Thăng chức thất bại';
      setPromoteModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Khóa / Mở khóa tài khoản (toggle-status)
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

  // 6. Xóa mềm tài khoản
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setIsSubmitting(true);
    try {
      await userService.deleteUser(deleteConfirmUser.employeeCode || deleteConfirmUser.id);
      showToast(`Đã xóa tài khoản nhân sự ${deleteConfirmUser.fullName} thành công!`);
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Xóa tài khoản thất bại';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // RBAC Matrix Mock
  const [matrix, setMatrix] = React.useState<RbacRow[]>([
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

  const handleTogglePermission = (rowId: string, roleKey: 'owner' | 'manager' | 'chef' | 'staff') => {
    if (roleKey === 'owner') {
      showToast('Quyền hạn của Chủ Nhà Hàng là bất biến (toàn quyền)!', 'error');
      return;
    }
    setMatrix((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [roleKey]: !row[roleKey] } : row))
    );
    showToast('Đã cập nhật ma trận phân quyền thành công!');
  };

  // Tính toán KPI động từ danh sách thật
  const activeCount = users.filter((u) => u.isActive).length;
  const lockedCount = users.filter((u) => !u.isActive).length;
  const pinCount = users.filter((u) => u.hasPin).length;
  const maxCeiling = users.reduce((max, u) => Math.max(max, u.discountCeiling || 0), 0);

  return (
    <div className="w-full">
      {/* Toast Alert: Luôn nổi trên tất cả modal và backdrop với z-[9999], vị trí top-6 right-6 */}
      {toastMsg && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-md max-w-md ${toastMsg.type === 'error'
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

      {/* Top Header */}
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
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${activeTab === 'list'
                  ? 'bg-ops-brand text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                Danh Sách ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${activeTab === 'matrix'
                  ? 'bg-ops-brand text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
                  }`}
              >
                Ma Trận Quyền Hạn
              </button>
            </div>

            <button
              onClick={() => {
                setFormErrors({});
                setModalError(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cấp Tài Khoản Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Core RBAC KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Tổng Tài Khoản Đã Cấp
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-stone-900">{users.length}</span>
                  <span className="font-mono text-xs uppercase text-emerald-700 font-bold">
                    {activeCount} Hoạt Động
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-ops-brand">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Đang bị tạm khóa:</span>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {lockedCount < 10 ? `0${lockedCount}` : lockedCount} Tài khoản
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Nhân Sự Có Mã PIN
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-ops-brand">
                    {pinCount < 10 ? `0${pinCount}` : pinCount}
                  </span>
                  <span className="font-mono text-xs uppercase text-amber-700 font-bold">
                    Đã Kích Hoạt
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <Hash className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Xác thực ngoại lệ:</span>
              <span className="font-mono font-bold text-stone-900">Duyệt Hủy / Chiết Khấu POS</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Hạn Mức Chiết Khấu Cao Nhất
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-stone-900">{maxCeiling}%</span>
                  <span className="font-mono text-xs uppercase text-stone-500 font-bold">Cấp Toàn Quyền</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Trần Quản lý ca:</span>
              <span className="font-mono font-bold text-ops-brand">20% (Tự động áp dụng)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Định Danh &amp; Bảo Mật
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-emerald-700">100%</span>
                  <span className="font-mono text-xs uppercase text-emerald-700 font-bold">Dual-Lookup</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Định danh nhân sự:</span>
              <span className="font-mono font-bold text-emerald-800">Mã vai trò (CH, QL, TN, BP...)</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Danh sách tài khoản */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-xl shadow-2xs border border-stone-200 overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'ALL', label: 'Tất Cả' },
                    { id: 'OWNER', label: 'Chủ Quán' },
                    { id: 'MANAGER', label: 'Quản Lý' },
                    { id: 'CASHIER', label: 'Thu Ngân' },
                    { id: 'CHEF', label: 'Bếp / Pha Chế' },
                    { id: 'WAITER', label: 'Phục Vụ' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer ${roleFilter === tab.id
                      ? 'bg-ops-brand text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status filter & Search bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={activeStatusFilter}
                  onChange={(e) => setActiveStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'LOCKED')}
                  aria-label="Lọc theo trạng thái hoạt động"
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 font-bold focus:outline-none focus:border-ops-brand cursor-pointer"
                >
                  <option value="ALL">Mọi Trạng Thái</option>
                  <option value="ACTIVE">Chỉ Đang Hoạt Động</option>
                  <option value="LOCKED">Chỉ Đang Bị Khóa</option>
                </select>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo Mã (TN001), Tên, Username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-64"
                  />
                </div>
              </div>
            </div>

            {/* Error banner if any */}
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-mono text-xs uppercase">
                    <th className="py-3 px-4 font-bold">Mã &amp; Nhân Sự</th>
                    <th className="py-3 px-3 font-bold">Username / Email</th>
                    <th className="py-3 px-3 font-bold">Vai Trò Hệ Thống</th>
                    <th className="py-3 px-3 font-bold text-center">Mã PIN Trạm</th>
                    <th className="py-3 px-3 text-right font-bold">Trần CK%</th>
                    <th className="py-3 px-3 text-center font-bold">Trạng Thái</th>
                    <th className="py-3 px-4 text-center font-bold">Thao Tác Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-ops-brand mb-2" />
                        <span>Đang đồng bộ dữ liệu nhân sự từ máy chủ...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-500">
                        <span>Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.</span>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-ops-bg transition-colors">
                        {/* Cột 1: Mã nhân viên & Họ tên */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-stone-900 text-white shadow-2xs">
                              {u.employeeCode}
                            </span>
                            <div>
                              <span className="font-bold text-ops-ink block">{u.fullName}</span>
                              <span className="text-[10px] text-stone-400 font-mono">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Username & Email & Phone */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-stone-800 block">@{u.username}</span>
                          <span className="text-[11px] text-ops-muted block">{u.email || '—'}</span>
                          {u.phone && <span className="text-[10px] text-stone-500 font-mono">{u.phone}</span>}
                        </td>

                        {/* Cột 3: Vai trò */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${u.roleCode === 'OWNER'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.roleCode === 'MANAGER'
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : u.roleCode === 'CASHIER'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : u.roleCode === 'CHEF'
                                    ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                    : 'bg-stone-100 text-stone-800 border border-stone-200'
                              }`}
                          >
                            {u.roleName}
                          </span>
                        </td>

                        {/* Cột 4: PIN trạm */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-ops-ink">
                          {u.pinMasked || (u.hasPin ? '•••• (Đã kích hoạt)' : 'Chưa cài đặt')}
                        </td>

                        {/* Cột 5: Trần chiết khấu */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-primary-500">
                          {u.discountCeiling}%
                        </td>

                        {/* Cột 6: Trạng thái isActive */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold inline-flex items-center gap-1 ${u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>HOẠT ĐỘNG</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>TẠM KHÓA</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Cột 7: Thao tác quản trị */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Nút Thăng chức (Full Cách 1) */}
                            <button
                              onClick={() => {
                                setPromoteUser(u);
                                setSelectedPromoteRole(u.roleCode === 'MANAGER' ? 'OWNER' : 'MANAGER');
                              }}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-0.5 cursor-pointer border border-stone-300 transition-colors"
                              title="Thăng chức / Đổi vai trò (Tự đổi mã & trần chiết khấu)"
                            >
                              <ArrowUpRight className="w-3 h-3 text-indigo-700" />
                              <span>Đổi Role</span>
                            </button>

                            {/* Nút Đổi PIN */}
                            <button
                              onClick={() => {
                                setResetPinUser(u);
                                setNewPin('');
                              }}
                              className="px-2 py-1 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink rounded font-mono text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Cập nhật mã PIN xác thực trạm POS/KDS"
                            >
                              <KeyRound className="w-3 h-3 text-amber-700" />
                              <span>PIN</span>
                            </button>

                            {/* Nút Khóa / Mở Khóa */}
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2 py-1 border rounded font-mono text-[10px] uppercase font-semibold cursor-pointer flex items-center gap-1 transition-colors ${u.isActive
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              title={u.isActive ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {u.isActive ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Khóa</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Mở</span>
                                </>
                              )}
                            </button>

                            {/* Nút Xóa Mềm */}
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              className="p-1 hover:bg-rose-100 text-stone-400 hover:text-rose-700 rounded cursor-pointer transition-colors"
                              title="Xóa tài khoản nhân sự"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Ma Trận RBAC */}
        {activeTab === 'matrix' && (
          <div className="bg-white rounded-xl shadow-xs border border-ops-border overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-ops-border flex items-center justify-between">
              <div>
                <h2 className="font-ops text-base font-bold text-ops-ink">Ma Trận Quyền Hạn Chi Tiết (RBAC Matrix)</h2>
                <p className="text-xs text-ops-muted">Click vào biểu tượng để bật/tắt thẩm quyền cho từng vai trò vận hành</p>
              </div>
              <button
                onClick={() => showToast('Đã lưu cấu hình ma trận phân quyền vào hệ thống!')}
                className="px-3.5 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase font-bold rounded cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-ops-bg border-b border-ops-border text-ops-muted font-mono text-[10px] uppercase">
                    <th className="py-3 px-4 font-bold w-1/2">Quyền Hạn / Nghiệp Vụ Vận Hành</th>
                    <th className="py-3 px-3 font-bold text-center">Chủ Nhà Hàng</th>
                    <th className="py-3 px-3 font-bold text-center">Quản Lý Ca</th>
                    <th className="py-3 px-3 font-bold text-center">Bếp Trưởng</th>
                    <th className="py-3 px-3 font-bold text-center">Nhân Viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-border">
                  {matrix.map((row) => (
                    <tr key={row.id} className="hover:bg-ops-bg transition-colors">
                      <td className="py-3 px-4 font-medium text-ops-ink">{row.feature}</td>

                      {/* Owner */}
                      <td
                        onClick={() => handleTogglePermission(row.id, 'owner')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50"
                      >
                        {row.owner ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                        )}
                      </td>

                      {/* Manager */}
                      <td
                        onClick={() => handleTogglePermission(row.id, 'manager')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50"
                      >
                        {row.manager ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                        )}
                      </td>

                      {/* Chef */}
                      <td
                        onClick={() => handleTogglePermission(row.id, 'chef')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50"
                      >
                        {row.chef ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                        )}
                      </td>

                      {/* Staff */}
                      <td
                        onClick={() => handleTogglePermission(row.id, 'staff')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50"
                      >
                        {row.staff ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Cấp Tài Khoản Mới */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cấp Tài Khoản Nhân Sự Mới"
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Cấp Tài Khoản Nhân Sự Mới</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormErrors({});
                  setModalError(null);
                  setShowPassword(false);
                  setShowPinCode(false);
                }}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner nếu có lỗi chung / 409 Conflict */}
            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{modalError}</div>
                <button
                  type="button"
                  onClick={() => setModalError(null)}
                  className="text-rose-400 hover:text-rose-700 transition-colors"
                  aria-label="Đóng cảnh báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Họ và Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lê Thùy Linh"
                  value={newUser.fullName}
                  onChange={(e) => {
                    setNewUser({ ...newUser, fullName: e.target.value });
                    if (formErrors.fullName) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.fullName;
                        return next;
                      });
                    }
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-medium transition-colors ${formErrors.fullName
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-ops-border focus:border-primary-500'
                    }`}
                />
                {renderFieldError(formErrors.fullName)}
              </div>

              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Username Đăng Nhập (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: linh.cashier (để trống lấy theo SĐT)"
                    value={newUser.username}
                    onChange={(e) => {
                      setNewUser({ ...newUser, username: e.target.value });
                      if (formErrors.username) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.username;
                          return next;
                        });
                      }
                      if (modalError) setModalError(null);
                    }}
                    className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono font-bold transition-colors ${formErrors.username
                      ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600 text-rose-900'
                      : 'border-ops-border focus:border-primary-500'
                      }`}
                  />
                  {renderFieldError(formErrors.username)}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Mật Khẩu Khởi Tạo *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={newUser.password}
                      onChange={(e) => {
                        setNewUser({ ...newUser, password: e.target.value });
                        if (formErrors.password) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.password;
                            return next;
                          });
                        }
                        if (modalError) setModalError(null);
                      }}
                      className={`w-full pl-3 pr-9 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono transition-colors ${formErrors.password
                        ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                        : 'border-ops-border focus:border-primary-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {renderFieldError(formErrors.password)}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Vai Trò Vận Hành (Hệ thống tự động sinh Mã Nhân Sự) *
                </label>
                <select
                  value={newUser.roleCode}
                  onChange={(e) => setNewUser({ ...newUser, roleCode: e.target.value as UserRoleCode })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-bold"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label} — Trần CK: {opt.defaultCeiling}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Số Điện Thoại (10 số VN) *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678"
                    value={newUser.phone}
                    onChange={(e) => {
                      setNewUser({ ...newUser, phone: e.target.value });
                      if (formErrors.phone) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.phone;
                          return next;
                        });
                      }
                      if (modalError) setModalError(null);
                    }}
                    className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono transition-colors ${formErrors.phone
                      ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                      : 'border-ops-border focus:border-primary-500'
                      }`}
                  />
                  {renderFieldError(formErrors.phone)}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Mã PIN Trạm (4-6 Số) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPinCode ? 'text' : 'password'}
                      maxLength={6}
                      placeholder="VD: 1234"
                      value={newUser.pinCode}
                      onChange={(e) => {
                        setNewUser({ ...newUser, pinCode: e.target.value });
                        if (formErrors.pinCode) {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.pinCode;
                            return next;
                          });
                        }
                        if (modalError) setModalError(null);
                      }}
                      className={`w-full pl-3 pr-9 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono text-center tracking-widest font-bold transition-colors ${formErrors.pinCode
                        ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                        : 'border-ops-border focus:border-primary-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinCode(!showPinCode)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
                      title={showPinCode ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                      tabIndex={-1}
                    >
                      {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {renderFieldError(formErrors.pinCode)}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Địa Chỉ Email (Tùy chọn)
                </label>
                <input
                  type="email"
                  placeholder="VD: linh@restaurant.vn"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none transition-colors ${formErrors.email
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-ops-border focus:border-primary-500'
                    }`}
                />
                {renderFieldError(formErrors.email)}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormErrors({});
                    setModalError(null);
                    setShowPassword(false);
                    setShowPinCode(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Đang Tạo...' : 'Cấp Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Đổi Mã PIN Trạm */}
      {resetPinUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Đổi Mã PIN Trạm"
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <h3 className="font-sans text-sm font-bold text-ops-ink">Đổi Mã PIN Trạm</h3>
              </div>
              <button
                onClick={() => {
                  setResetPinUser(null);
                  setPinModalError(null);
                  setShowResetPin(false);
                }}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ops-muted">
              Cấp lại mã PIN mới cho nhân sự <strong className="text-ops-ink">{resetPinUser.fullName}</strong> (Mã:{' '}
              <span className="font-mono font-bold text-stone-900">{resetPinUser.employeeCode}</span>):
            </p>

            {/* Error Banner nếu có lỗi */}
            {pinModalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{pinModalError}</span>
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Mã PIN Mới (4 - 6 Chữ Số)
              </label>
              <div className="relative">
                <input
                  type={showResetPin ? 'text' : 'password'}
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value);
                    if (pinModalError) setPinModalError(null);
                  }}
                  placeholder="Nhập 4-6 số"
                  className={`w-full pl-3 pr-10 text-center text-xl font-mono font-bold tracking-widest py-2 bg-ops-bg border rounded-lg focus:outline-none transition-colors ${pinModalError
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-ops-border focus:border-primary-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPin(!showResetPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
                  title={showResetPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                  tabIndex={-1}
                >
                  {showResetPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
              <button
                onClick={() => {
                  setResetPinUser(null);
                  setPinModalError(null);
                  setShowResetPin(false);
                }}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPin}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang Lưu...' : 'Lưu PIN Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Thăng Chức / Đổi Vai Trò (Full Cách 1) */}
      {promoteUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thăng Chức Nhân Sự"
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-700" />
                <h3 className="font-sans text-sm font-bold text-ops-ink">Thăng Chức / Đổi Vai Trò</h3>
              </div>
              <button
                onClick={() => {
                  setPromoteUser(null);
                  setPromoteModalError(null);
                }}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner nếu có lỗi */}
            {promoteModalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{promoteModalError}</span>
              </div>
            )}

            <div className="text-xs space-y-2 text-stone-600">
              <p>
                Đổi vai trò cho: <strong className="text-stone-900">{promoteUser.fullName}</strong>
              </p>
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200 text-[11px] space-y-1">
                <div>Mã hiện tại: <span className="font-mono font-bold text-stone-900">{promoteUser.employeeCode}</span></div>
                <div>Vai trò hiện tại: <span className="font-bold text-stone-900">{promoteUser.roleName}</span></div>
                <div>Trần chiết khấu hiện tại: <span className="font-mono font-bold text-stone-900">{promoteUser.discountCeiling}%</span></div>
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Chọn Vai Trò Mới
              </label>
              <select
                value={selectedPromoteRole}
                onChange={(e) => setSelectedPromoteRole(e.target.value as UserRoleCode)}
                className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-bold text-xs cursor-pointer"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} — Trần CK {opt.defaultCeiling}%
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-amber-700 mt-1.5 italic">
                * Hệ thống sẽ tự động cấp lại Mã Nhân Sự mới theo tiền tố vai trò và tự động cập nhật hạn mức chiết khấu!
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
              <button
                onClick={() => {
                  setPromoteUser(null);
                  setPromoteModalError(null);
                }}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                onClick={handlePromoteRole}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Xác nhận xóa mềm tài khoản */}
      {deleteConfirmUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa tài khoản"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700 pb-2 border-b border-stone-200">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-sans text-sm font-bold">Xác Nhận Xóa Tài Khoản</h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản của{' '}
              <strong className="text-stone-900">{deleteConfirmUser.fullName}</strong> (Mã:{' '}
              <span className="font-mono font-bold">{deleteConfirmUser.employeeCode}</span>)?
              <br />
              <span className="text-[11px] text-rose-600 block mt-1">
                * Thao tác này sẽ xóa mềm tài khoản. Nhân sự sẽ không thể đăng nhập và không còn xuất hiện trong danh sách làm việc.
              </span>
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
