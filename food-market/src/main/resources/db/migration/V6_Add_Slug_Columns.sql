-- Flyway Migration Script
-- Version: V2
-- Description: Add slugs and enforce unique names

------------------------------------------------------------
-- 1. Make name unique (ensure no duplicate before running)
------------------------------------------------------------

ALTER TABLE categories
    ADD CONSTRAINT uq_categories_name UNIQUE (name);

ALTER TABLE products
    ADD CONSTRAINT uq_products_name UNIQUE (name);

-- Rename tag_name -> name for consistency
ALTER TABLE tags
    RENAME COLUMN tag_name TO name;

------------------------------------------------------------
-- 2. Add slug column (ALLOW NULL first, NO UNIQUE yet)
--    This prevents UNIQUE conflicts if DB already has data
------------------------------------------------------------

ALTER TABLE categories ADD COLUMN slug VARCHAR(255);
ALTER TABLE products   ADD COLUMN slug VARCHAR(255);
ALTER TABLE tags       ADD COLUMN slug VARCHAR(255);

------------------------------------------------------------
-- 3. Migrate slug for existing data (safe even if DB is empty)
--    Replace slugify with simple SQL-friendly slug generator
------------------------------------------------------------

UPDATE categories
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '/', '-'))
WHERE slug IS NULL;

UPDATE products
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '/', '-'))
WHERE slug IS NULL;

UPDATE tags
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '/', '-'))
WHERE slug IS NULL;

------------------------------------------------------------
-- 4. Now enforce NOT NULL on slug
------------------------------------------------------------

ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products   ALTER COLUMN slug SET NOT NULL;
ALTER TABLE tags       ALTER COLUMN slug SET NOT NULL;

------------------------------------------------------------
-- 5. Add UNIQUE constraint AFTER slugs exist
------------------------------------------------------------

ALTER TABLE categories ADD CONSTRAINT uq_categories_slug UNIQUE (slug);
ALTER TABLE products   ADD CONSTRAINT uq_products_slug UNIQUE (slug);
ALTER TABLE tags       ADD CONSTRAINT uq_tags_slug UNIQUE (slug);

------------------------------------------------------------
-- 6. Create index for faster slug lookup
------------------------------------------------------------

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_products_slug   ON products(slug);
CREATE INDEX idx_tags_slug       ON tags(slug);
