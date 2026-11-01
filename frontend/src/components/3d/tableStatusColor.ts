export interface TableColorSpec {
  base: string;
  emissive: string;
  blinking: boolean;
  name: string;
}

export const TABLE_STATUS_COLORS: Record<string, TableColorSpec> = {
  IDLE: {
    base: '#22c55e', // Xanh: Bàn trống
    emissive: '#15803d',
    blinking: false,
    name: 'Bàn trống',
  },
  OCCUPIED: {
    base: '#eab308', // Vàng: Đang dùng
    emissive: '#a16207',
    blinking: false,
    name: 'Đang dùng bữa',
  },
  BILLING: {
    base: '#ef4444', // Đỏ nhấp nháy: Chờ thanh toán / Trễ SLA
    emissive: '#b91c1c',
    blinking: true,
    name: 'Chờ thanh toán / Trễ SLA',
  },
  SLA: {
    base: '#ef4444', // Đỏ nhấp nháy: Trễ SLA
    emissive: '#b91c1c',
    blinking: true,
    name: 'Trễ SLA',
  },
  CLEANING: {
    base: '#6b7280', // Xám: Cần dọn
    emissive: '#374151',
    blinking: false,
    name: 'Cần dọn dẹp',
  },
};

/**
 * Pure function mapping a table's status to its 3D/2D visual color specification.
 * Zero dependency on React or Three.js to guarantee fast and deterministic unit testing.
 */
export function getTableStatusColor(status: string): TableColorSpec {
  const normalized = status ? status.trim().toUpperCase() : '';
  const match = TABLE_STATUS_COLORS[normalized];
  if (match) {
    return { ...match };
  }
  return {
    base: '#9ca3af',
    emissive: '#4b5563',
    blinking: false,
    name: 'Không xác định',
  };
}
