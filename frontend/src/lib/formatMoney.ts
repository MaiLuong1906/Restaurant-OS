/**
 * Helper định dạng tiền tệ VND số nguyên chuẩn Việt Nam.
 * Ví dụ: 4250000 -> "4.250.000đ"
 */
export function formatVnd(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0đ';
  }
  return `${amount.toLocaleString('vi-VN')}đ`;
}
