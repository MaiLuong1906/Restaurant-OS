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
} from 'lucide-react';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  pin: string;
  discountCeiling: number;
  ipBinding: string;
  status: 'ACTIVE' | 'PENDING' | 'LOCKED';
}

interface RbacRow {
  id: string;
  feature: string;
  owner: boolean;
  manager: boolean;
  chef: boolean;
  staff: boolean;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = React.useState<'list' | 'matrix'>('list');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [resetPinUser, setResetPinUser] = React.useState<UserAccount | null>(null);
  const [newPin, setNewPin] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');

  const [newUser, setNewUser] = React.useState({
    name: '',
    email: '',
    role: 'Thu Ngân (Cashier)',
    discountCeiling: '5',
    pin: '',
    ipBinding: '192.168.1.15',
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
        setShowCreateModal(false);
        setResetPinUser(null);
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

  const [users, setUsers] = React.useState<UserAccount[]>([
    {
      id: 'ACC-001',
      name: 'Lương Nguyễn (Owner)',
      email: 'luong.owner@bombaypalace.co.uk',
      role: 'Chủ Nhà Hàng (Owner)',
      pin: '•••• (8888)',
      discountCeiling: 100,
      ipBinding: '192.168.1.10 (Bàn Manager)',
      status: 'ACTIVE',
    },
    {
      id: 'ACC-002',
      name: 'Nguyễn Văn Tuấn',
      email: 'tuan.chef@bombaypalace.co.uk',
      role: 'Bếp Trưởng (Head Chef)',
      pin: '•••• (1234)',
      discountCeiling: 0,
      ipBinding: 'KDS-BOH-01 (Màn hình Bếp)',
      status: 'ACTIVE',
    },
    {
      id: 'ACC-003',
      name: 'Trần Thị Mai',
      email: 'mai.manager@bombaypalace.co.uk',
      role: 'Quản Lý Ca (Shift Manager)',
      pin: '•••• (5678)',
      discountCeiling: 20,
      ipBinding: '192.168.1.11 (POS Trưởng)',
      status: 'ACTIVE',
    },
    {
      id: 'ACC-004',
      name: 'Lê Thùy Linh',
      email: 'linh.cashier@bombaypalace.co.uk',
      role: 'Thu Ngân (Cashier)',
      pin: '•••• (9012)',
      discountCeiling: 5,
      ipBinding: 'POS-CASHIER-01',
      status: 'ACTIVE',
    },
    {
      id: 'ACC-005',
      name: 'Nguyễn Văn Nam',
      email: 'nam.waiter@bombaypalace.co.uk',
      role: 'Phục Vụ (FOH Runner)',
      pin: 'Chưa cấp',
      discountCeiling: 0,
      ipBinding: 'Tablet-FOH-03',
      status: 'ACTIVE',
    },
    {
      id: 'ACC-006',
      name: 'Đặng Quốc Huy',
      email: 'huy.intern@bombaypalace.co.uk',
      role: 'Thực Tập Sinh (FOH)',
      pin: 'Chưa cấp',
      discountCeiling: 0,
      ipBinding: 'Chưa gán',
      status: 'PENDING',
    },
  ]);

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
      showToast('Quyền hạn của Chủ Nhà Hàng là bất biến (toàn quyền)!');
      return;
    }
    setMatrix((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [roleKey]: !row[roleKey] } : row))
    );
    showToast('Đã cập nhật ma trận phân quyền bảo mật thành công!');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          showToast(
            nextStatus === 'ACTIVE'
              ? `Đã kích hoạt lại tài khoản ${u.name}`
              : `Đã tạm khóa tài khoản ${u.name}. Nhân sự không thể đăng nhập POS!`
          );
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name) {
      showToast('Vui lòng nhập họ và tên nhân viên');
      return;
    }
    const newEntry: UserAccount = {
      id: `ACC-00${users.length + 1}`,
      name: newUser.name,
      email: newUser.email || `${newUser.name.toLowerCase().replace(/\s+/g, '.')}@bombaypalace.co.uk`,
      role: newUser.role,
      pin: newUser.pin ? `•••• (${newUser.pin})` : 'Chưa cấp',
      discountCeiling: Number(newUser.discountCeiling) || 0,
      ipBinding: newUser.ipBinding || 'Chưa gán',
      status: 'ACTIVE',
    };
    setUsers([...users, newEntry]);
    setShowCreateModal(false);
    setNewUser({ name: '', email: '', role: 'Thu Ngân (Cashier)', discountCeiling: '5', pin: '', ipBinding: '192.168.1.15' });
    showToast(`Đã cấp tài khoản thành công cho ${newEntry.name}!`);
  };

  const handleResetPin = () => {
    if (!newPin || newPin.length < 4) {
      showToast('Mã PIN mới phải gồm ít nhất 4 chữ số');
      return;
    }
    if (resetPinUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === resetPinUser.id ? { ...u, pin: `•••• (${newPin})` } : u))
      );
      showToast(`Đã đổi mã PIN thành công cho ${resetPinUser.name}!`);
      setResetPinUser(null);
      setNewPin('');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'OWNER' && u.role.includes('Owner')) ||
      (roleFilter === 'MANAGER' && u.role.includes('Manager')) ||
      (roleFilter === 'CHEF' && u.role.includes('Chef')) ||
      (roleFilter === 'STAFF' && (u.role.includes('Cashier') || u.role.includes('FOH')));
    return matchSearch && matchRole;
  });

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
                Danh Sách ({users.length})
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
                    {users.filter((u) => u.status === 'ACTIVE').length} Hoạt Động
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-ops-brand">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Đang trong ca trực:</span>
              <span className="font-mono font-bold text-stone-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                04 Nhân sự
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Quản Lý Có Quyền PIN
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-ops-brand">03</span>
                  <span className="font-mono text-xs uppercase text-amber-700 font-bold">
                    Mã PIN Kích Hoạt
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <Hash className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Xác thực ngoại lệ:</span>
              <span className="font-mono font-bold text-stone-900">Duyệt Hủy / Chiết khấu</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Hạn Mức Chiết Khấu Trần
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-stone-900">20%</span>
                  <span className="font-mono text-xs uppercase text-stone-500 font-bold">Cấp Quản Lý Ca</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Chủ nhà hàng:</span>
              <span className="font-mono font-bold text-ops-brand">100% (Toàn quyền)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                  Cảnh Báo Bảo Mật PIN
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-ops text-3xl font-extrabold text-emerald-700">0</span>
                  <span className="font-mono text-xs uppercase text-emerald-700 font-bold">Vi phạm IP</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Định tuyến LAN POS:</span>
              <span className="font-mono font-bold text-emerald-800">100% Khóa Trạm Nội Bộ</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Danh sách tài khoản */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-xl shadow-2xs border border-stone-200 overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'ALL', label: 'Tất Cả' },
                    { id: 'OWNER', label: 'Chủ Quán' },
                    { id: 'MANAGER', label: 'Quản Lý' },
                    { id: 'CHEF', label: 'Bếp Trưởng' },
                    { id: 'STAFF', label: 'Nhân Viên' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                      roleFilter === tab.id
                        ? 'bg-ops-brand text-white shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, vai trò..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-56 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-mono text-xs uppercase">
                    <th className="py-3 px-4 font-bold">Nhân Sự &amp; Email</th>
                    <th className="py-3 px-3 font-bold">Vai Trò Hệ Thống</th>
                    <th className="py-3 px-3 font-bold text-center">Mã PIN Trạm</th>
                    <th className="py-3 px-3 text-right font-bold">Hạn Mức CK%</th>
                    <th className="py-3 px-3 font-bold">Ràng Buộc Trạm / IP LAN</th>
                    <th className="py-3 px-3 text-center font-bold">Trạng Thái</th>
                    <th className="py-3 px-4 text-center font-bold">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-ops-bg transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-ops-ink block">{u.name}</span>
                        <span className="text-[11px] text-ops-muted font-mono">{u.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-ops-ink">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-ops-ink">
                        {u.pin}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-primary-500">
                        {u.discountCeiling}%
                      </td>
                      <td className="py-3 px-3 font-mono text-ops-muted">
                        {u.ipBinding}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : u.status === 'LOCKED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : u.status === 'LOCKED' ? 'ĐÃ KHÓA' : 'CHỜ DUYỆT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setResetPinUser(u)}
                            className="px-2.5 py-1 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink rounded font-mono text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer"
                            title="Đổi mã PIN"
                          >
                            <KeyRound className="w-3 h-3 text-amber-700" />
                            <span>Đổi PIN</span>
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-2 py-1 border rounded font-mono text-[10px] uppercase font-semibold cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.status === 'ACTIVE' ? 'Khóa' : 'Kích Hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Ma Trận RBAC (Interactive checkboxes!) */}
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

      {/* Modal: Tạo Tài Khoản Mới */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cấp Tài Khoản Nhân Sự Mới"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Cấp Tài Khoản Nhân Sự Mới</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Họ và Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Trí"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-medium"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Vai Trò Vận Hành *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-medium"
                >
                  <option value="Quản Lý Ca (Shift Manager)">Quản Lý Ca (Shift Manager)</option>
                  <option value="Bếp Trưởng (Head Chef)">Bếp Trưởng (Head Chef)</option>
                  <option value="Thu Ngân (Cashier)">Thu Ngân (Cashier)</option>
                  <option value="Phục Vụ Lead (FOH Lead)">Phục Vụ Lead (FOH Lead)</option>
                  <option value="Phụ Bếp (Commis Chef)">Phụ Bếp (Commis Chef)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Hạn Mức CK Tối Đa (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newUser.discountCeiling}
                    onChange={(e) => setNewUser({ ...newUser, discountCeiling: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Mã PIN 4 Số (Nếu Cần)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="VD: 1234"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Ràng Buộc Địa Chỉ IP / Trạm LAN
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 192.168.1.15 hoặc POS-02"
                  value={newUser.ipBinding}
                  onChange={(e) => setNewUser({ ...newUser, ipBinding: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold shadow-xs cursor-pointer"
                >
                  Cấp Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi Mã PIN */}
      {resetPinUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Đổi Mã PIN Trạm"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <h3 className="font-sans text-sm font-bold text-ops-ink">Đổi Mã PIN Trạm</h3>
              </div>
              <button
                onClick={() => setResetPinUser(null)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ops-muted">
              Cấp lại mã PIN mới cho nhân sự <strong className="text-ops-ink">{resetPinUser.name}</strong> ({resetPinUser.role}):
            </p>

            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Mã PIN Mới (4 - 6 Chữ Số)
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Nhập PIN mới"
                className="w-full text-center text-xl font-mono font-bold tracking-widest py-2 bg-ops-bg border border-ops-border rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
              <button
                onClick={() => setResetPinUser(null)}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPin}
                className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold"
              >
                Lưu PIN Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
