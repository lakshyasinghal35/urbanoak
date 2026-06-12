-- Migration: align cart_items with order microservice queries.
-- Adds user_id (denormalized from carts) and stores MongoDB product ids as strings.

ALTER TABLE cart_items
  ADD COLUMN user_id INT NULL AFTER cart_id;

UPDATE cart_items ci
  JOIN carts c ON ci.cart_id = c.id
  SET ci.user_id = c.user_id;

ALTER TABLE cart_items
  MODIFY COLUMN user_id INT NOT NULL,
  MODIFY COLUMN product_id VARCHAR(24) NOT NULL,
  ADD UNIQUE KEY uq_cart_items_user_product (user_id, product_id);
