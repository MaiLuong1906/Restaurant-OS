import { UserRoleCode } from '@/types/user';

export interface RbacRow {
  id: string;
  feature: string;
  owner: boolean;
  manager: boolean;
  chef: boolean;
  staff: boolean;
}

export const ROLE_OPTIONS: { code: UserRoleCode; label: string; defaultCeiling: number }[] = [
  { code: 'OWNER', label: 'Chủ Quán (Owner)', defaultCeiling: 100 },
  { code: 'MANAGER', label: 'Quản Lý Ca (Shift Manager)', defaultCeiling: 20 },
  { code: 'CASHIER', label: 'Thu Ngân (Cashier)', defaultCeiling: 5 },
  { code: 'CHEF', label: 'Bếp Trưởng / Pha Chế (Chef)', defaultCeiling: 0 },
  { code: 'WAITER', label: 'Phục Vụ (Waiter)', defaultCeiling: 0 },
  { code: 'STAFF', label: 'Nhân Viên Khác (Staff)', defaultCeiling: 0 },
];
