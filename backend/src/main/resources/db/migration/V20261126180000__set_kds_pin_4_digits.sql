-- ====================================================================
-- V20261126180000__set_kds_pin_4_digits.sql
-- Đồng bộ PIN KDS seed từ 6 số ('123456') sang 4 số ('1234')
-- khớp với bàn phím 4 số trên màn hình đăng nhập KDS (/kds/login).
-- ====================================================================

UPDATE users
SET pin_code_hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    updated_at = CURRENT_TIMESTAMP
WHERE pin_code_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
