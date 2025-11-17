-- Flyway Migration Script
-- Version: V2
-- Description: Tạo bảng Refresh Tokens để quản lý phiên đăng nhập dài hạn

CREATE TABLE refresh_tokens
(
    id          BIGSERIAL PRIMARY KEY,
    -- Chuỗi token ngẫu nhiên (UUID)
    token       VARCHAR(255) NOT NULL UNIQUE,

    -- Thời điểm hết hạn
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Khóa ngoại trỏ đến user
    user_id     UUID NOT NULL,

    CONSTRAINT fk_refresh_tokens_users
        FOREIGN KEY (user_id)
            REFERENCES users (user_id)
            ON DELETE CASCADE -- Quan trọng: Nếu User bị xóa, Refresh Token của họ cũng bị xóa
);

-- Thêm Index để tìm kiếm theo token nhanh hơn
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);