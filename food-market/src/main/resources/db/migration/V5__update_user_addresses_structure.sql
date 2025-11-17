-- 1) Xóa cột cũ
ALTER TABLE user_addresses
DROP COLUMN IF EXISTS full_address;

-- 2) Thêm các cột mới theo entity mới

ALTER TABLE user_addresses
    ADD COLUMN recipient_name VARCHAR(255) NOT NULL;

ALTER TABLE user_addresses
    ADD COLUMN recipient_phone VARCHAR(20) NOT NULL;

ALTER TABLE user_addresses
    ADD COLUMN province VARCHAR(100) NOT NULL;

ALTER TABLE user_addresses
    ADD COLUMN district VARCHAR(100) NOT NULL;

ALTER TABLE user_addresses
    ADD COLUMN ward VARCHAR(100) NOT NULL;

ALTER TABLE user_addresses
    ADD COLUMN street_address VARCHAR(255) NOT NULL;

-- 3) Thêm cột enum address_type (HOME, OFFICE)
ALTER TABLE user_addresses
    ADD COLUMN address_type VARCHAR(20);

-- 4) Sửa lại cột is_default cho đúng (nếu cần)
ALTER TABLE user_addresses
    ALTER COLUMN is_default SET NOT NULL;
