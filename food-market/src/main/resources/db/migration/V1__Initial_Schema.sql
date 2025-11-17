-- Flyway Migration Script
-- Version: V1
-- Description: Initial Schema (Hybrid Strategy: App-Generated UUIDs, DB-Generated BIGSERIALs)

-- Kích hoạt extension pgcrypto (vẫn hữu ích nếu sau này cần)
CREATE
EXTENSION IF NOT EXISTS "pgcrypto";

-- --- 1. Cụm Quản lý Người dùng & Giỏ hàng ---

CREATE TABLE users
(
    user_id       UUID PRIMARY KEY, -- ĐÃ XÓA DEFAULT, Java sẽ tạo
    full_name     VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20) UNIQUE  NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(50)         NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP WITH TIME ZONE     DEFAULT NOW()
);

CREATE TABLE user_addresses
(
    address_id   BIGSERIAL PRIMARY KEY,
    user_id      UUID         NOT NULL,
    full_address VARCHAR(500) NOT NULL,
    is_default   BOOLEAN DEFAULT false,
    CONSTRAINT fk_user_addresses_users FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE carts
(
    cart_id      UUID PRIMARY KEY, -- ĐÃ XÓA DEFAULT, Java sẽ tạo
    user_id      UUID UNIQUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_carts_users FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE cart_items
(
    cart_item_id BIGSERIAL PRIMARY KEY,
    cart_id      UUID   NOT NULL,
    product_id   BIGINT NOT NULL,
    quantity     INT    NOT NULL DEFAULT 1,
    CONSTRAINT fk_cart_items_carts FOREIGN KEY (cart_id) REFERENCES carts (cart_id) ON DELETE CASCADE
);


-- --- 2. Cụm Quản lý Sản phẩm & Danh mục ---

CREATE TABLE categories
(
    category_id BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    parent_id   BIGINT,
    image_url   VARCHAR(1000),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (category_id) ON DELETE SET NULL
);

CREATE TABLE products
(
    product_id  BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    description TEXT,
    image_url   VARCHAR(1000),
    base_price  DECIMAL(10, 2) NOT NULL,
    unit        VARCHAR(50)    NOT NULL,
    category_id BIGINT         NOT NULL,
    CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

CREATE TABLE tags
(
    tag_id   BIGSERIAL PRIMARY KEY,
    tag_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE product_tags
(
    product_id BIGINT NOT NULL,
    tag_id     BIGINT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_product_tags_products FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_product_tags_tags FOREIGN KEY (tag_id) REFERENCES tags (tag_id) ON DELETE CASCADE
);


-- --- 3. Cụm Quản lý HSD & Tồn kho ---

CREATE TABLE inventory_batches
(
    batch_id          BIGSERIAL PRIMARY KEY,
    product_id        BIGINT NOT NULL,
    batch_code        VARCHAR(255),
    received_date     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiration_date   DATE   NOT NULL,
    quantity_received INT    NOT NULL,
    current_quantity  INT    NOT NULL,
    CONSTRAINT fk_inventory_batches_products FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
);

CREATE TABLE inventory_adjustments
(
    adjustment_id       BIGSERIAL PRIMARY KEY,
    batch_id            BIGINT       NOT NULL,
    adjusted_by_user_id UUID         NOT NULL,
    adjustment_quantity INT          NOT NULL,
    reason              VARCHAR(255) NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_inventory_adjustments_batches FOREIGN KEY (batch_id) REFERENCES inventory_batches (batch_id),
    CONSTRAINT fk_inventory_adjustments_users FOREIGN KEY (adjusted_by_user_id) REFERENCES users (user_id)
);

CREATE TABLE dynamic_pricing_rules
(
    rule_id                BIGSERIAL PRIMARY KEY,
    days_remaining_trigger INT           NOT NULL,
    discount_percentage    DECIMAL(5, 2) NOT NULL,
    priority               INT DEFAULT 0
);


-- --- 4. Cụm Hệ thống Gợi ý (Công thức & Hành vi) ---

CREATE TABLE recipes
(
    recipe_id               BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    instructions            TEXT,
    image_url               VARCHAR(1000),
    source_text_ingredients TEXT
);

CREATE TABLE ingredients
(
    ingredient_id BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE recipe_mappings
(
    recipe_id     BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id),
    CONSTRAINT fk_recipe_mappings_recipes FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_mappings_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients (ingredient_id) ON DELETE CASCADE
);

CREATE TABLE product_mappings
(
    product_id    BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    PRIMARY KEY (product_id, ingredient_id),
    CONSTRAINT fk_product_mappings_products FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_product_mappings_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients (ingredient_id) ON DELETE CASCADE
);

CREATE TABLE view_history
(
    view_id    BIGSERIAL PRIMARY KEY,
    user_id    UUID,
    product_id BIGINT NOT NULL,
    viewed_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_view_history_users FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT fk_view_history_products FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
);


-- --- 5. Cụm E-commerce Cốt lõi (Đơn hàng & Thanh toán) ---

CREATE TABLE orders
(
    order_id                  UUID PRIMARY KEY, -- ĐÃ XÓA DEFAULT, Java sẽ tạo
    user_id                   UUID           NOT NULL,
    total_amount              DECIMAL(10, 2) NOT NULL,
    status                    VARCHAR(50)    NOT NULL,
    delivery_address_snapshot TEXT           NOT NULL,
    delivery_timeslot         VARCHAR(100),
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE order_items
(
    order_item_id      BIGSERIAL PRIMARY KEY,
    order_id           UUID           NOT NULL,
    product_id         BIGINT         NOT NULL,
    inventory_batch_id BIGINT         NOT NULL,
    quantity           INT            NOT NULL,
    price_at_purchase  DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_order_items_batches FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches (batch_id)
);

CREATE TABLE product_reviews
(
    review_id  BIGSERIAL PRIMARY KEY,
    user_id    UUID   NOT NULL,
    product_id BIGINT NOT NULL,
    order_id   UUID   NOT NULL,
    rating     INT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_product_reviews_users FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_product_reviews_products FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_product_reviews_orders FOREIGN KEY (order_id) REFERENCES orders (order_id)
);

CREATE TABLE payments
(
    payment_id       UUID PRIMARY KEY, -- ĐÃ XÓA DEFAULT, Java sẽ tạo
    order_id         UUID           NOT NULL UNIQUE,
    method           VARCHAR(50)    NOT NULL,
    amount           DECIMAL(10, 2) NOT NULL,
    status           VARCHAR(50)    NOT NULL,
    transaction_code VARCHAR(255),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders (order_id)
);


-- --- 6. Cụm Vận hành & Giao hàng ---

CREATE TABLE shippers
(
    shipper_id BIGSERIAL PRIMARY KEY,
    user_id    UUID UNIQUE NOT NULL,
    status     VARCHAR(50) DEFAULT 'offline',
    CONSTRAINT fk_shippers_users FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE delivery_trips
(
    trip_id    BIGSERIAL PRIMARY KEY,
    shipper_id BIGINT      NOT NULL,
    status     VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_delivery_trips_shippers FOREIGN KEY (shipper_id) REFERENCES shippers (shipper_id)
);

CREATE TABLE trip_orders
(
    trip_id  BIGINT NOT NULL,
    order_id UUID   NOT NULL UNIQUE,
    PRIMARY KEY (trip_id, order_id),
    CONSTRAINT fk_trip_orders_trips FOREIGN KEY (trip_id) REFERENCES delivery_trips (trip_id),
    CONSTRAINT fk_trip_orders_orders FOREIGN KEY (order_id) REFERENCES orders (order_id)
);


-- --- Bổ sung các FK còn thiếu ---
ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_products FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE;