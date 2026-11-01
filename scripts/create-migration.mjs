#!/usr/bin/env node

/**
 * ====================================================================
 * Restaurant OS — Script Sinh File Migration Flyway Tự Động Chống Trùng
 * Sử dụng: pnpm db:migration:create <tên_mô_tả>
 * ====================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const rawName = args.join('_').trim();

if (!rawName) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Lỗi: Thiếu tên mô tả cho file migration!');
  console.log('\x1b[33m%s\x1b[0m', '👉 Cú pháp chuẩn: pnpm db:migration:create <tên_mô_tả>');
  console.log('\x1b[36m%s\x1b[0m', '👉 Ví dụ:        pnpm db:migration:create add_pos_shift_table');
  process.exit(1);
}

// Chuẩn hóa tên thành snake_case hợp lệ
const sanitizedName = rawName
  .toLowerCase()
  .replace(/[\s-]+/g, '_')
  .replace(/[^a-z0-9_]/g, '')
  .replace(/^_+|_+$/g, '');

if (!sanitizedName) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Lỗi: Tên migration không hợp lệ sau khi chuẩn hóa!');
  process.exit(1);
}

// Sinh timestamp định dạng YYYYMMDDHHmmss (chống trùng 100% giữa các lập trình viên)
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const fileName = `V${timestamp}__${sanitizedName}.sql`;
const targetDir = path.resolve(process.cwd(), 'backend/src/main/resources/db/migration');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = path.join(targetDir, fileName);

const template = `-- ====================================================================
-- Migration: ${fileName}
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Thời gian tạo: ${now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Khối lượng kho dùng NUMERIC(12, 3)
--   3. Thuộc tính tùy biến dùng JSONB (kèm GIN index nếu cần truy vấn)
--   4. Mọi bảng chính phải có created_at và updated_at TIMESTAMPTZ
--   5. Khóa chính ưu tiên UUID (gen_random_uuid())
-- ====================================================================

-- Viết các câu lệnh DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX) bên dưới:

`;

fs.writeFileSync(targetPath, template, 'utf8');

console.log('\x1b[32m%s\x1b[0m', '✅ Đã tạo thành công file migration Flyway mới chống trùng!');
console.log(`📁 Đường dẫn: ${targetPath}`);
console.log(`🔖 Tên file:  \x1b[36m${fileName}\x1b[0m\n`);

