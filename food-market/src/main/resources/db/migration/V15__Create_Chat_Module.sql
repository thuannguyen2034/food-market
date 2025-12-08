-- 1. Tạo bảng chat_sessions
CREATE TABLE conversations
(
    id              UUID PRIMARY KEY,
    customer_id     UUID        NOT NULL UNIQUE, -- Đảm bảo 1 khách 1 session
    staff_id        UUID,
    status          VARCHAR(20) NOT NULL,        -- WAITING, ACTIVE, IDLE
    title           VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_customer
        FOREIGN KEY (customer_id)
            REFERENCES users (user_id)           -- Giả sử bảng user của bạn tên là 'users' và PK là 'user_id'
            ON DELETE CASCADE
);

-- Tạo index để Admin load danh sách Waiting nhanh
CREATE INDEX idx_chat_sessions_status ON conversations (status);
CREATE INDEX idx_chat_sessions_last_message ON conversations (last_message_at DESC);
CREATE INDEX idx_chat_sessions_customer ON conversations (customer_id);

-- 2. Tạo bảng chat_messages
CREATE TABLE chat_messages
(
    id              BIGSERIAL PRIMARY KEY,
    conversation_id UUID        NOT NULL,
    sender_id       UUID        NOT NULL,
    sender_type     VARCHAR(20) NOT NULL,
    content         TEXT        NOT NULL,
    is_read         BOOLEAN                  DEFAULT FALSE,
    sent_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversation
        FOREIGN KEY (conversation_id)
            REFERENCES conversations (id)
            ON DELETE CASCADE
);

-- Tạo index để load lịch sử chat nhanh
CREATE INDEX idx_chat_messages_session ON chat_messages (conversation_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages (sent_at);