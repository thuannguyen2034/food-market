ALTER TABLE products
    ADD COLUMN average_rating NUMERIC(2, 1) DEFAULT 0.0,
    ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE product_reviews
    ADD CONSTRAINT unique_review_per_purchase UNIQUE (user_id, product_id, order_id);