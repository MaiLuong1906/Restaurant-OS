#!/usr/bin/env node

/**
 * ====================================================================
 * Restaurant OS — Script Reset Schema Database PostgreSQL Local
 * Sử dụng: pnpm db:reset (hoặc npm run db:reset)
 * Chức năng: Xóa sạch schema public và tạo mới để Flyway migrate lại từ đầu.
 * ====================================================================
 */

import { execSync } from 'node:child_process';

const CONTAINER_NAME = process.env.POSTGRES_CONTAINER || 'restaurant-os-postgres';
const DB_NAME = process.env.DB_NAME || 'restaurant_os';
const DB_USER = process.env.DB_USER || 'postgres';

console.log('\x1b[36m%s\x1b[0m', '🔄 Đang tiến hành reset Database Local...');
console.log(`📦 Container : \x1b[33m${CONTAINER_NAME}\x1b[0m`);
console.log(`🗄️  Database  : \x1b[33m${DB_NAME}\x1b[0m`);

const resetSql = 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;';
const cmd = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "${resetSql}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n\x1b[32m%s\x1b[0m', '✅ Reset Database thành công!');
  console.log('\x1b[36m%s\x1b[0m', '👉 Bạn có thể khởi động lại backend:');
  console.log('\x1b[33m%s\x1b[0m\n', '   pnpm dev:backend');
} catch (error) {
  console.error('\n\x1b[31m%s\x1b[0m', '❌ Không thể reset database tự động qua Docker container.');
  console.log('\x1b[33m%s\x1b[0m', '💡 Hãy kiểm tra xem Docker container đã được khởi chạy chưa bằng lệnh:');
  console.log('\x1b[36m%s\x1b[0m', '   pnpm docker:up');
  console.log('\n\x1b[33m%s\x1b[0m', 'Hoặc bạn có thể chạy câu SQL sau trực tiếp trong tool quản trị DB (DBeaver/pgAdmin):');
  console.log('\x1b[37m%s\x1b[0m\n', '   DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  process.exit(1);
}
