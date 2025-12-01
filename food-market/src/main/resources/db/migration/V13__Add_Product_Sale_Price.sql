ALTER TABLE products
    ADD COLUMN sale_price DECIMAL(10, 2),
    ADD COLUMN is_on_sale BOOLEAN DEFAULT FALSE;

ALTER TABLE cart_items
    ADD COLUMN price DECIMAL(10, 2) NOT NULL;

DROP TABLE IF EXISTS dynamic_pricing_rules;