-- =================================================================
-- JAMALBRICO UNIFIED DATABASE SCHEMA
-- Combines inventory management + sales system
-- =================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS jamalbrico
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE jamalbrico;

-- =================================================================
-- CATEGORIES TABLE (for product organization)
-- =================================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_name (name)
) ENGINE=InnoDB;

-- =================================================================
-- PRODUCTS TABLE (main inventory)
-- =================================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  purchase_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  remaining_stock INT DEFAULT 0,
  min_stock_level INT DEFAULT 10,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_product_name (name),
  INDEX idx_product_category (category_id),
  INDEX idx_stock_level (remaining_stock, min_stock_level),
  FULLTEXT KEY idx_search_fulltext (name, description)
) ENGINE=InnoDB;

-- =================================================================
-- CUSTOMERS TABLE (for sales tracking)
-- =================================================================
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_name (name),
  INDEX idx_customer_phone (phone)
) ENGINE=InnoDB;

-- =================================================================
-- SALES TABLE (integrated with products)
-- =================================================================
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    product_id INT NULL,  -- Reference to products table
    productName VARCHAR(255) NOT NULL,  -- Fallback for manual entry
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    totalPrice DECIMAL(10, 2) NOT NULL,

    -- Additional sales tracking fields
    discount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method ENUM('cash', 'credit', 'check', 'bank_transfer') DEFAULT 'cash',
    customer_id INT NULL,
    notes TEXT,
    sale_number VARCHAR(100) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key to products
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,

    -- Indexes for performance
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_product_name (productName),
    INDEX idx_product_id (product_id),
    INDEX idx_sale_number (sale_number),
    INDEX idx_customer_id (customer_id),

    -- Constraints
    CONSTRAINT chk_price CHECK (price > 0),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_total_price CHECK (totalPrice > 0)
) ENGINE=InnoDB;

-- =================================================================
-- STOCK MOVEMENTS TABLE (track inventory changes)
-- =================================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  sale_id INT NULL,  -- Link to sales if movement is from sale
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  INDEX idx_product_movement (product_id, movement_type),
  INDEX idx_movement_date (created_at)
) ENGINE=InnoDB;

-- =================================================================
-- SAMPLE DATA
-- =================================================================

-- Insert default categories for Moroccan hardware store
INSERT IGNORE INTO categories (name, description) VALUES
('Droguerie', 'Produits chimiques et droguerie'),
('Sanitaire', 'Équipements sanitaires et plomberie'),
('Peinture', 'Peintures et accessoires de peinture'),
('Quincaillerie', 'Articles de quincaillerie générale'),
('Outillage', 'Outils de bricolage et construction'),
('Électricité', 'Matériel électrique et éclairage');

-- Insert sample products
INSERT IGNORE INTO products (name, description, category_id, purchase_price, selling_price, remaining_stock, min_stock_level) VALUES
('Marteau 500g', 'Marteau à panne fendue 500g avec manche bois', 5, 25.00, 35.00, 15, 5),
('Tournevis cruciforme PH2', 'Tournevis cruciforme PH2 6x100mm', 5, 8.00, 12.00, 25, 10),
('Ampoule LED 9W', 'Ampoule LED E27 9W blanc chaud 3000K', 6, 12.00, 18.50, 50, 20),
('Peinture acrylique blanc 1L', 'Peinture acrylique murale blanc mat 1L', 3, 35.00, 50.00, 30, 10),
('Robinet mitigeur cuisine', 'Robinet mitigeur cuisine chromé bec haut', 2, 120.00, 180.00, 8, 3),
('Scie égoïne 450mm', 'Scie égoïne denture universelle 450mm', 5, 28.00, 42.00, 12, 5),
('Câble électrique 2.5mm', 'Câble électrique rigide 2.5mm² H07VU (mètre)', 6, 2.50, 4.00, 500, 100),
('Enduit de rebouchage 1kg', 'Enduit de rebouchage poudre 1kg', 3, 8.00, 12.50, 25, 8);

-- Insert sample customer
INSERT IGNORE INTO customers (name, phone, email) VALUES
('Client Régulier', '+212 661234567', 'client@example.com');

-- =================================================================
-- VIEWS FOR REPORTING
-- =================================================================

-- View for low stock alerts
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    p.id,
    p.name,
    p.remaining_stock,
    p.min_stock_level,
    c.name as category_name,
    p.selling_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.remaining_stock <= p.min_stock_level;

-- View for sales with product details
CREATE OR REPLACE VIEW sales_with_products AS
SELECT
    s.*,
    p.name as actual_product_name,
    p.selling_price as current_price,
    c.name as category_name,
    cust.name as customer_name
FROM sales s
LEFT JOIN products p ON s.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN customers cust ON s.customer_id = cust.id;

-- =================================================================
-- TRIGGERS FOR AUTOMATIC STOCK MANAGEMENT
-- =================================================================

-- Trigger to update stock when sale is created
DELIMITER //
CREATE TRIGGER after_sale_insert
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    -- Update product stock if product_id is provided
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET remaining_stock = remaining_stock - NEW.quantity
        WHERE id = NEW.product_id;

        -- Log stock movement
        INSERT INTO stock_movements (product_id, movement_type, quantity, reason, sale_id)
        VALUES (NEW.product_id, 'out', NEW.quantity, 'Sale', NEW.id);
    END IF;
END//
DELIMITER ;

-- Trigger to revert stock when sale is deleted
DELIMITER //
CREATE TRIGGER after_sale_delete
AFTER DELETE ON sales
FOR EACH ROW
BEGIN
    -- Revert product stock if product_id was provided
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET remaining_stock = remaining_stock + OLD.quantity
        WHERE id = OLD.product_id;

        -- Log stock movement
        INSERT INTO stock_movements (product_id, movement_type, quantity, reason)
        VALUES (OLD.product_id, 'in', OLD.quantity, 'Sale deleted');
    END IF;
END//
DELIMITER ;

-- =================================================================
-- SHOW SETUP COMPLETION
-- =================================================================
SELECT 'JAMALBRICO Database setup completed successfully!' as Status;
SELECT COUNT(*) as Categories_Count FROM categories;
SELECT COUNT(*) as Products_Count FROM products;
SELECT COUNT(*) as Customers_Count FROM customers;
