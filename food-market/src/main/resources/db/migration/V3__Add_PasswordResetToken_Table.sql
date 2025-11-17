-- Flyway Migration Script
-- Version: V3
-- Description: Tạo bảng Password Reset Tokens

CREATE TABLE password_reset_token
(
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id     UUID NOT NULL UNIQUE, -- Thường 1 user chỉ có 1 token reset tại 1 thời điểm
    CONSTRAINT fk_password_reset_token_users
        FOREIGN KEY (user_id)
            REFERENCES users (user_id)
            ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token_token ON password_reset_token (token);