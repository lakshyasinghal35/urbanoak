-- Migration: app-user password reset via email links.
-- Adds a table to hold single-use, time-limited reset tokens (hashed at rest).
-- Admins reset via an authenticated old+new password change and need no table.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_token_hash (token_hash),
    INDEX idx_prt_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
