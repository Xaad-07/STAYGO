-- ============================================================
-- STAYGO DATABASE SCHEMA
-- Database: staygo_db
-- BCA Minor Project
-- ============================================================

CREATE DATABASE IF NOT EXISTS staygo_db;
USE staygo_db;

-- ============================================================
-- 1. USERS TABLE
-- Stores customers, hosts and admins in a single table with a role column.
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(10) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'host', 'admin') NOT NULL DEFAULT 'customer',
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
);

-- ============================================================
-- 2. AMENITIES TABLE
-- Master list of amenities (WiFi, Parking, AC, etc.)
-- ============================================================
CREATE TABLE amenities (
    amenity_id INT AUTO_INCREMENT PRIMARY KEY,
    amenity_name VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================
-- 3. PROPERTIES TABLE
-- Each property belongs to one host (user with role = host).
-- ============================================================
CREATE TABLE properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    property_type ENUM('Apartment','Villa','Hotel','Resort','Homestay','Cottage','Other') NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    guests INT NOT NULL,
    bedrooms INT NOT NULL,
    bathrooms INT NOT NULL,
    pickup_available TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'active',
    rating DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_properties_city (city),
    INDEX idx_properties_type (property_type)
);

-- ============================================================
-- 4. PROPERTY_AMENITIES TABLE (junction table)
-- Many-to-many relationship between properties and amenities.
-- ============================================================
CREATE TABLE property_amenities (
    property_id INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (property_id, amenity_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. PROPERTY_IMAGES TABLE
-- Each property can have multiple images.
-- ============================================================
CREATE TABLE property_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. BOOKINGS TABLE
-- A booking links a customer to a property with dates and pickup info.
-- ============================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    property_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    nights INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    pickup_required TINYINT(1) NOT NULL DEFAULT 0,
    pickup_location VARCHAR(255) DEFAULT NULL,
    pickup_date DATE DEFAULT NULL,
    pickup_time VARCHAR(20) DEFAULT NULL,
    pickup_instructions TEXT DEFAULT NULL,
    pickup_charge DECIMAL(10,2) DEFAULT 0,
    driver_name VARCHAR(100) DEFAULT NULL,
    driver_phone VARCHAR(15) DEFAULT NULL,
    vehicle_number VARCHAR(20) DEFAULT NULL,
    final_pickup_time VARCHAR(20) DEFAULT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('UPI','Card','Wallet','Cash') NOT NULL,
    transaction_number VARCHAR(30) NOT NULL,
    status ENUM('confirmed','completed','cancelled') NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    INDEX idx_bookings_dates (property_id, check_in, check_out)
);

-- ============================================================
-- 7. REVIEWS TABLE
-- A customer can review a property only after a completed booking.
-- ============================================================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    property_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

-- ============================================================
-- 8. WISHLISTS TABLE
-- Many-to-many relationship between customers and properties they liked.
-- ============================================================
CREATE TABLE wishlists (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    property_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_property (customer_id, property_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- ============================================================
-- 9. ACTIVITY_LOGS TABLE
-- Tracks important user actions across the platform.
-- ============================================================
CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================
-- 10. CONTACT_MESSAGES TABLE
-- Stores messages submitted through the Contact page.
-- ============================================================
CREATE TABLE contact_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread','read') NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA: AMENITIES
-- ============================================================
INSERT INTO amenities (amenity_name) VALUES
('WiFi'), ('Air Conditioning'), ('Parking'), ('Kitchen'),
('TV'), ('Washing Machine'), ('Pool'), ('Geyser');

-- ============================================================
-- SEED DATA: ADMIN ACCOUNT
-- Login email: admin@staygo.com
-- Login password: Admin@123
-- (hashed below with PHP's password_hash() using bcrypt)
-- ============================================================
INSERT INTO users (full_name, email, phone, password, role) VALUES
('Admin User', 'admin@staygo.com', '9999999999', '$2y$10$Qa/xcpgTGz1iP55.tHUTfuaIFEvIrNzOgrqIdp2C.xNeADeLgIE4a', 'admin');
