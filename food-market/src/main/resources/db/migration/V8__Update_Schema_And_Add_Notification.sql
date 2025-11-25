/*
 * V8: Update Schema for PostgreSQL
 * Target: products, orders, order_items, notification
 */

-- 1. Cập nhật bảng products
ALTER TABLE products
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN deleted_at TIMESTAMP;

-- 2. Cập nhật bảng order_items
-- (Giả định tên bảng là order_items, sửa lại nếu bạn đặt tên khác)
ALTER TABLE order_items
    ADD COLUMN product_id_snapshot BIGINT NOT NULL DEFAULT 0, -- Cần default tạm thời vì bảng cha rỗng nhưng cột not null strict
    ADD COLUMN product_name_snapshot VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN product_thumbnail_snapshot VARCHAR(255);

-- Xóa default tạm thời sau khi add xong (Best practice cho Postgres nếu có data, nhưng bảng rỗng thì không sao)
ALTER TABLE order_items
    ALTER COLUMN product_id_snapshot DROP DEFAULT,
ALTER COLUMN product_name_snapshot DROP DEFAULT;

-- 3. Cập nhật bảng orders
ALTER TABLE orders
    ADD COLUMN delivery_phone_snapshot VARCHAR(20) NOT NULL DEFAULT '',
    ADD COLUMN delivery_recipient_name_snapshot VARCHAR(255),
    ADD COLUMN note TEXT;

ALTER TABLE orders
    ALTER COLUMN delivery_phone_snapshot DROP DEFAULT;

-- 4. Tạo bảng notification
CREATE TABLE notification (
                              notification_id UUID NOT NULL,
                              user_id UUID NOT NULL,
                              message TEXT NOT NULL,
                              is_read BOOLEAN DEFAULT FALSE,
                              type VARCHAR(50),
                              link_to VARCHAR(500),
                              created_at TIMESTAMP WITH TIME ZONE, -- Mapping cho OffsetDateTime

                              PRIMARY KEY (notification_id),

                              CONSTRAINT fk_notification_user
                                  FOREIGN KEY (user_id) REFERENCES users (user_id)
);