import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  COMMON_STAFF_PERMISSIONS,
  ROLE_PERMISSIONS,
  canAccessRoute,
  getDiscountCeiling,
  hasPermission,
} from '../rbac';

describe('Frontend RBAC Permission Catalog & Route Guards', () => {
  it('tất cả 6 Role đều có nhóm quyền nền tảng COMMON_STAFF_PERMISSIONS', () => {
    const roles = Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[];
    expect(roles).toHaveLength(6);

    for (const role of roles) {
      for (const p of COMMON_STAFF_PERMISSIONS) {
        expect(hasPermission(role, p)).toBe(true);
      }
    }
  });

  it('chỉ OWNER có các quyền nhạy cảm (USER_ACCOUNT_DELETE, REPORT_FINANCE_PNL_BCG_VIEW, HR_PAYROLL_TIP_POOL_APPROVE)', () => {
    const ownerOnly = [
      PERMISSIONS.USER_ACCOUNT_DELETE,
      PERMISSIONS.REPORT_FINANCE_PNL_BCG_VIEW,
      PERMISSIONS.HR_PAYROLL_TIP_POOL_APPROVE,
      PERMISSIONS.SYS_STORE_PROFILE_LAN_UPDATE,
    ];

    for (const perm of ownerOnly) {
      expect(hasPermission('OWNER', perm)).toBe(true);
      expect(hasPermission('MANAGER', perm)).toBe(false);
      expect(hasPermission('CASHIER', perm)).toBe(false);
      expect(hasPermission('CHEF', perm)).toBe(false);
      expect(hasPermission('WAITER', perm)).toBe(false);
      expect(hasPermission('STAFF', perm)).toBe(false);
    }
  });

  it('kiểm tra trần chiết khấu theo từng Role', () => {
    expect(getDiscountCeiling('OWNER')).toBe(100);
    expect(getDiscountCeiling('MANAGER')).toBe(20);
    expect(getDiscountCeiling('CASHIER')).toBe(5);
    expect(getDiscountCeiling('CHEF')).toBe(0);
    expect(getDiscountCeiling('WAITER')).toBe(0);
    expect(getDiscountCeiling('STAFF')).toBe(0);
  });

  it('canAccessRoute bảo vệ đúng route Admin, POS, KDS, Waiter và mở Public Customer QR', () => {
    // Public routes
    expect(canAccessRoute('/qr/ban-01', null)).toBe(true);
    expect(canAccessRoute('/menu', null)).toBe(true);
    expect(canAccessRoute('/login', null)).toBe(true);

    // Owner-only routes & Menu-BOM access
    expect(canAccessRoute('/pnl', 'OWNER')).toBe(true);
    expect(canAccessRoute('/pnl', 'MANAGER')).toBe(false);
    expect(canAccessRoute('/payroll', 'MANAGER')).toBe(false);
    expect(canAccessRoute('/menu-bom', 'OWNER')).toBe(true);
    expect(canAccessRoute('/menu-bom', 'MANAGER')).toBe(true);
    expect(canAccessRoute('/menu-bom', 'WAITER')).toBe(false);
    expect(canAccessRoute('/menu-bom', null)).toBe(false);
    expect(canAccessRoute('/users', 'OWNER')).toBe(true);
    expect(canAccessRoute('/users', 'MANAGER')).toBe(true);
    expect(canAccessRoute('/users', 'CASHIER')).toBe(false);
    expect(canAccessRoute('/users', 'WAITER')).toBe(false);
    expect(canAccessRoute('/ai-hub', 'OWNER')).toBe(true);
    expect(canAccessRoute('/ai-hub', 'MANAGER')).toBe(false);

    // Manager routes
    expect(canAccessRoute('/dashboard', 'MANAGER')).toBe(true);
    expect(canAccessRoute('/dashboard', 'WAITER')).toBe(false);

    // POS routes
    expect(canAccessRoute('/pos/floor', 'CASHIER')).toBe(true);
    expect(canAccessRoute('/pos/floor', 'CHEF')).toBe(false);

    // KDS routes (CHEF hoặc KDS Tablet Session)
    expect(canAccessRoute('/kds', 'CHEF')).toBe(true);
    expect(canAccessRoute('/kds', null, true)).toBe(true);
    expect(canAccessRoute('/kds', 'WAITER', false)).toBe(false);

    // Waiter routes
    expect(canAccessRoute('/waiter', 'WAITER')).toBe(true);
    expect(canAccessRoute('/waiter', 'CHEF')).toBe(false);

    // Staff portal & Personal Profile
    expect(canAccessRoute('/staff/schedule', 'STAFF')).toBe(true);
    expect(canAccessRoute('/staff/schedule', null)).toBe(false);
    expect(canAccessRoute('/profile', 'OWNER')).toBe(true);
    expect(canAccessRoute('/profile', 'MANAGER')).toBe(true);
    expect(canAccessRoute('/profile', 'CASHIER')).toBe(true);
    expect(canAccessRoute('/profile', 'CHEF')).toBe(true);
    expect(canAccessRoute('/profile', 'WAITER')).toBe(true);
    expect(canAccessRoute('/profile', 'STAFF')).toBe(true);
    expect(canAccessRoute('/profile', null)).toBe(false);
  });

  it('xác thực nguyên tắc Zero-Trust: chỉ OWNER có quyền thêm/sửa/xóa catalog (MENU_CATALOG_CREATE_UPDATE)', () => {
    expect(hasPermission('OWNER', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(true);
    expect(hasPermission('MANAGER', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(false);
    expect(hasPermission('CASHIER', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(false);
    expect(hasPermission('CHEF', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(false);
    expect(hasPermission('WAITER', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(false);
    expect(hasPermission('STAFF', PERMISSIONS.MENU_CATALOG_CREATE_UPDATE)).toBe(false);
  });
});
