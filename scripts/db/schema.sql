-- create database table scripts for MySQL from the modules in the src folder

-- profile microservice
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    sign_up_date DATETIME NOT NULL
);


CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    house_no VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    landmark VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    UNIQUE KEY userid_houseno_area_city (user_id, house_no, area, city)
);


-- App-user password reset: single-use, time-limited tokens.
-- Only the SHA-256 hash of the token is stored, so a DB leak does not expose
-- usable reset links.
CREATE TABLE password_reset_tokens (
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


-- admin microservice
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin') NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);


-- product microservice
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    cover_image VARCHAR(255)
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (space_id) REFERENCES spaces(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);


CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL
);