const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const {v4: uuidv4} = require("uuid");
const path = require("path");
const fs = require("fs").promises;
const mysql = require("mysql2/promise");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MySQL setup
let pool;
let useDatabase = false;

// Initialize MySQL connection pool
try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'products_manager',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('MySQL connection pool created');
    useDatabase = true;
} catch (error) {
    console.error("Failed to create MySQL connection pool, will use sample data:", error);
    useDatabase = false;
}

// Sample data for testing without database
const sampleCategories = [
    {
        id: 1,
        name: "Plomberie",
        name_ar: "السباكة",
        name_fr: "Plomberie"
    },
    {
        id: 2,
        name: "Électricité",
        name_ar: "الكهرباء",
        name_fr: "Électricité"
    },
    {
        id: 3,
        name: "Peinture",
        name_ar: "الطلاء",
        name_fr: "Peinture"
    },
    {
        id: 4,
        name: "Quincaillerie",
        name_ar: "الأدوات المعدنية",
        name_fr: "Quincaillerie"
    }, {
        id: 5,
        name: "Jardinage",
        name_ar: "البستنة",
        name_fr: "Jardinage"
    }
];


// Initialize database tables
const initializeDatabase = async () => {
    try { // Create suppliers table (from sales system)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        payment_terms VARCHAR(100) DEFAULT 'Net 30',
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_suppliers_name (name)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Create customers table (from sales system)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        customer_type ENUM('retail', 'wholesale', 'commercial') DEFAULT 'retail',
        credit_limit DECIMAL(12,2) DEFAULT 0,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customers_name (name),
        INDEX idx_customers_email (email)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Create categories table (enhanced for multi-language)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        name_ar VARCHAR(255),
        name_fr VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        description_fr TEXT,
        icon VARCHAR(50),
        color VARCHAR(7) DEFAULT '#0f766e',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_name (name)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Create unified products table (combines both systems)
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        name_fr VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        description_fr TEXT,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100) UNIQUE,
        category VARCHAR(100) NOT NULL,
        category_id INT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        stock_quantity INT DEFAULT 0,
        remaining_stock INT DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        max_stock_level INT DEFAULT 1000,
        unit VARCHAR(50) DEFAULT 'unité',
        brand VARCHAR(100),
        supplier_id INT,
        location VARCHAR(255),
        weight DECIMAL(8,2),
        dimensions VARCHAR(100),
        image_url VARCHAR(500),
        warranty_months INT DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        is_featured BOOLEAN DEFAULT 0,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        INDEX idx_product_name (name),
        INDEX idx_product_category (category),
        INDEX idx_product_category_id (category_id),
        INDEX idx_product_sku (sku),
        INDEX idx_product_barcode (barcode),
        INDEX idx_stock_level (remaining_stock, min_stock_level),
        INDEX idx_stock_quantity (stock_quantity),
        FULLTEXT KEY idx_search_fulltext (name, description)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // NOTE: Sales table is managed by products_manager system
        // ProductsManager only manages products, categories, and inventory
        // Sales are recorded by procuvs_manager and inventory is updated via API calls

        // Create enhanced stock_movements table
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        movement_type ENUM('in', 'out', 'adjustment', 'IN', 'OUT', 'ADJUSTMENT') NOT NULL,
        quantity INT NOT NULL,
        reason VARCHAR(255),
        reference_type VARCHAR(50),
        reference_id INT,
        reference_number VARCHAR(100),
        notes TEXT,
        created_by VARCHAR(100) DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_movement (product_id),
        INDEX idx_movement_type (movement_type),
        INDEX idx_movement_date (created_at)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Create users table for authentication
        await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_username (username),
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Insert default categories if they don't exist
        const defaultCategories = [
            {
                name: 'Droguerie',
                name_ar: 'مواد كيميائية',
                name_fr: 'Droguerie',
                description: 'Hardware chemicals, adhesives, sealants, and specialized compounds',
                icon: '🧪',
                color: '#0f766e'
            },
            {
                name: 'Sanitaire',
                name_ar: 'صحي',
                name_fr: 'Sanitaire',
                description: 'Plumbing fixtures, pipes, faucets, water heaters, bathroom accessories',
                icon: '🚿',
                color: '#3b82f6'
            },
            {
                name: 'Peinture',
                name_ar: 'دهان',
                name_fr: 'Peinture',
                description: 'Paints, primers, brushes, rollers, painting accessories and tools',
                icon: '🎨',
                color: '#ea580c'
            },
            {
                name: 'Quincaillerie',
                name_ar: 'أدوات معدنية',
                name_fr: 'Quincaillerie',
                description: 'Hardware fasteners, screws, bolts, nuts, hinges, locks, and metal components',
                icon: '🔩',
                color: '#f59e0b'
            }, {
                name: 'Outillage',
                name_ar: 'أدوات',
                name_fr: 'Outillage',
                description: 'Hand tools, power tools, measuring equipment, safety gear, and workshop tools',
                icon: '🔨',
                color: '#dc2626'
            }, {
                name: 'Électricité',
                name_ar: 'كهرباء',
                name_fr: 'Électricité',
                description: 'Electrical components, wiring, switches, outlets, lighting fixtures, and electrical tools',
                icon: '⚡',
                color: '#eab308'
            }
        ];

        for (const category of defaultCategories) {
            await pool.execute(`
        INSERT IGNORE INTO categories (name, name_ar, name_fr, description, icon, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
                category.name,
                category.name_ar,
                category.name_fr,
                category.description,
                category.icon,
                category.color
            ]);
        }

        // Database is ready for production use - no sample data will be inserted

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Database operations helper
const dbQuery = {
    async execute(query, params = []) {
        try {
            const [rows, fields] = await pool.execute(query, params);

            // For INSERT queries, return insertId and affectedRows
            if (query.trim().toUpperCase().startsWith('INSERT')) {
                return {insertId: rows.insertId, changes: rows.affectedRows};
            }

            // For UPDATE/DELETE queries, return changes/affectedRows
            if (query.trim().toUpperCase().startsWith('UPDATE') || query.trim().toUpperCase().startsWith('DELETE')) {
                return {changes: rows.affectedRows};
            }

            // For SELECT queries, return the rows
            return rows;
        } catch (error) {
            console.error("Database query error:", error);
            throw error;
        }
    }
};

// Ensure uploads directory exists
async function ensureUploadsDir() {
    try {
        await fs.access("uploads");
    } catch {
        await fs.mkdir("uploads", {recursive: true});
    }}

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `../public/uploads/`);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000, // 5MB default
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    }
});

// API Routes

// Get all categories
app.get("/api/categories", async (req, res) => {
    try {
        const rows = await dbQuery.execute("SELECT * FROM categories ORDER BY name");
        res.json({success: true, categories: rows});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({success: false, error: "Invalid product ID"});
        }

        const rows = await dbQuery.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

        if (rows.length === 0) {
            return res.status(404).json({success: false, error: "Product not found"});
        }

        res.json({success: true, product: rows[0]});
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Get all products with optional filtering and pagination
app.get("/api/products", async (req, res) => {
    try {
        const {
            search = "",
            category = "all",
            page = "1",
            limit = "50",
            sortBy = "created_at",
            sortOrder = "DESC"
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
        const offset = (pageNum - 1) * limitNum;
        // Build the base query
        let baseQuery = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

        // Build count query for pagination
        let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

        const params = [];
        const countParams = [];

        // Add search filters with improved partial matching
        if (search) { // Split search terms and search for each word
            const searchTerms = search.toLowerCase().trim().split(/\s+/);
            const searchConditions = [];

            searchTerms.forEach(() => {
                searchConditions.push(`(
          LOWER(p.name) LIKE ? OR
          LOWER(p.description) LIKE ? OR
          LOWER(p.sku) LIKE ? OR
          LOWER(p.barcode) LIKE ? OR
          LOWER(p.brand) LIKE ? OR
          LOWER(c.name) LIKE ?
        )`);
            });

            const searchCondition = " AND (" + searchConditions.join(" AND ") + ")";
            baseQuery += searchCondition;
            countQuery += searchCondition;

            // Add parameters for each search term across all fields
            searchTerms.forEach(term => {
                const searchParam = `%${term}%`;
                // Add 6 parameters for each term (name, description, sku, barcode, brand, category)
                params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
                countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
            });
        }

        // Add category filter
        if (category !== "all") {
            const categoryCondition = " AND p.category_id = ?";
            baseQuery += categoryCondition;
            countQuery += categoryCondition;
            params.push(category);
            countParams.push(category);
        }

        // Add sorting and pagination
        const validSortColumns = [
            'name',
            'created_at',
            'updated_at',
            'remaining_stock',
            'selling_price'
        ];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        baseQuery += ` ORDER BY p.${sortColumn} ${order} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        // Execute both queries
        const [products, countResult] = await Promise.all([
            dbQuery.execute(baseQuery, params),
            dbQuery.execute(countQuery, countParams)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Add new product
app.post("/api/products", async (req, res) => {
    try {
        const {
            name,
            description,
            category_id,
            purchase_price,
            selling_price,
            remaining_stock,
            min_stock_level,
            image_url
        } = req.body;

        const result = await dbQuery.execute(`
      INSERT INTO products (name, description, category_id, purchase_price, selling_price, remaining_stock, min_stock_level, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            name,
            description,
            category_id,
            purchase_price,
            selling_price,
            remaining_stock,
            min_stock_level || 10,
            image_url || null,
        ]);

        const insertId = result.insertId;
        res.json({success: true, id: insertId});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

// Update product
app.put("/api/products", async (req, res) => {
    try {
        const {
            id,
            name,
            description,
            category_id,
            purchase_price,
            selling_price,
            remaining_stock,
            min_stock_level,
            image_url
        } = req.body;

        const updateQuery = `UPDATE products SET name = ?, description = ?, category_id = ?, purchase_price = ?, selling_price = ?, remaining_stock = ?, min_stock_level = ?, image_url = ? WHERE id = ?`;

        await dbQuery.execute(updateQuery, [
            name,
            description,
            category_id,
            purchase_price,
            selling_price,
            remaining_stock,
            min_stock_level,
            image_url,
            id,
        ]);

        res.json({success: true});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

// Delete product
app.delete("/api/products", async (req, res) => {
    try {
        const {id} = req.query;

        // Get the product to check if it has an image
        const products = await dbQuery.execute("SELECT image_url FROM products WHERE id = ?", [id]);

        if (products.length > 0 && products[0].image_url) {
            try {
                const imagePath = path.join(__dirname, products[0].image_url);
                await fs.unlink(imagePath);
            } catch (unlinkError) {
                console.error("Error deleting image file:", unlinkError);
            }
        }

        await dbQuery.execute("DELETE FROM products WHERE id = ?", [id]);
        res.json({success: true});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

// Get comprehensive stats for all products
app.get("/api/stats", async (req, res) => {
    try { // Get total products count
        const [totalProductsResult] = await dbQuery.execute("SELECT COUNT(*) as total FROM products");

        // Get total stock value for all products
        const [totalValueResult] = await dbQuery.execute("SELECT SUM(selling_price * remaining_stock) as total_value FROM products WHERE selling_price IS NOT NULL AND remaining_stock IS NOT NULL");

        // Get low stock products count
        const [lowStockResult] = await dbQuery.execute("SELECT COUNT(*) as low_stock_count FROM products WHERE remaining_stock <= 10");

        const stats = {
            totalProducts: totalProductsResult.total || 0,
            totalStockValue: totalValueResult.total_value || 0,
            lowStockCount: lowStockResult.low_stock_count || 0
        };

        res.json({success: true, stats});
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// File upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({success: false, error: "No file uploaded"});
    }

    imageUrl = `/uploads/${
        req.file.filename
    }`
    console.log(imageUrl)
    res.json({success: true, imageUrl});
});

// Delete uploaded image
app.delete("/api/upload", async (req, res) => {
    try {
        const {imageUrl} = req.body;

        if (imageUrl) {
            const imagePath = path.join(__dirname, imageUrl);
            await fs.unlink(imagePath);
        }

        res.json({success: true});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});

// ===============================================
// INTEGRATION ENDPOINTS FOR SALES SYSTEM
// ===============================================

// Get product by ID or name for sales system
app.get("/api/integration/product/:identifier", async (req, res) => {
    try {
        const {identifier} = req.params;

        // Check if identifier is numeric (ID) or string (name)
        const isNumeric = !isNaN(parseInt(identifier));

        let query,
            params;
        if (isNumeric) {
            query = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.is_active = TRUE
      `;
            params = [parseInt(identifier)];
        } else {
            query = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ? AND p.is_active = TRUE
        LIMIT 1
      `;
            params = [`%${identifier}%`];
        }

        const rows = await dbQuery.execute(query, params);

        if (rows.length === 0) {
            return res.status(404).json({success: false, error: "Product not found", identifier});
        }

        const product = rows[0];

        // Ensure compatibility with sales system schema
        const salesCompatibleProduct = {
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category || product.category_name,
            price: product.selling_price || product.price,
            cost: product.purchase_price || product.cost,
            stock_quantity: product.remaining_stock || product.stock_quantity,
            min_stock_level: product.min_stock_level,
            unit: product.unit,
            supplier_id: product.supplier_id,
            image_url: product.image_url,
            is_active: product.is_active
        };

        res.json({success: true, product: salesCompatibleProduct});
    } catch (error) {
        console.error("Error fetching product for sales integration:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Check product availability
app.get("/api/integration/availability/:product_id", async (req, res) => {
    try {
        const {product_id} = req.params;

        const rows = await dbQuery.execute("SELECT id, name, remaining_stock, stock_quantity, min_stock_level, is_active FROM products WHERE id = ?", [product_id]);

        if (rows.length === 0) {
            return res.status(404).json({success: false, error: "Product not found"});
        }

        const product = rows[0];
        const currentStock = product.remaining_stock || product.stock_quantity;

        res.json({
            success: true,
            availability: {
                product_id: product.id,
                name: product.name,
                current_stock: currentStock,
                min_stock_level: product.min_stock_level,
                is_available: currentStock > 0,
                is_low_stock: currentStock <= product.min_stock_level,
                is_active: product.is_active
            }
        });
    } catch (error) {
        console.error("Error checking product availability:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Search products for sales system
app.get("/api/integration/search", async (req, res) => {
    try {
        const {
            q,
            limit = 10
        } = req.query;

        if (!q || q.length < 2) {
            return res.json({success: true, products: []});
        }

        const query = `
      SELECT p.id, p.name, p.sku, p.barcode, p.category,
             p.selling_price as price, p.remaining_stock as stock_quantity,
             p.unit, p.image_url, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
        AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
      ORDER BY p.name
      LIMIT ?
    `;

        const searchTerm = `%${q}%`;
        const products = await dbQuery.execute(query, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);

        res.json({success: true, products});
    } catch (error) {
        console.error("Error searching products for sales:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Get low stock products
app.get("/api/integration/low-stock", async (req, res) => {
    try {
        const query = `
      SELECT p.id, p.name, p.category, p.remaining_stock as current_stock,
             p.min_stock_level, p.selling_price as price,
             (p.min_stock_level - p.remaining_stock) as shortage_quantity
      FROM products p
      WHERE p.remaining_stock <= p.min_stock_level
        AND p.is_active = TRUE
      ORDER BY shortage_quantity DESC
    `;

        const products = await dbQuery.execute(query);

        res.json({success: true, low_stock_products: products, count: products.length});
    } catch (error) {
        console.error("Error fetching low stock products:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// =============================================================================
// INTEGRATION API ENDPOINTS FOR JAMALBRICO SALES SYSTEM
// =============================================================================

// Get product by ID or identifier (for sales system integration)
app.get("/api/integration/product/:identifier", async (req, res) => {
    try {
        const {identifier} = req.params;

        // Try to parse as integer for ID, otherwise search by name or SKU
        let query,
            params;

        if (!isNaN(identifier)) { // Search by ID
            query = `
        SELECT p.*, c.name as category_name, c.name_fr as category_name_fr, c.name_ar as category_name_ar
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `;
            params = [parseInt(identifier)];
        } else { // Search by name or SKU
            query = `
        SELECT p.*, c.name as category_name, c.name_fr as category_name_fr, c.name_ar as category_name_ar
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ? OR p.sku = ? OR p.barcode = ?
        LIMIT 1
      `;
            params = [`%${identifier}%`, identifier, identifier];
        }

        const rows = await dbQuery.execute(query, params);

        if (rows.length === 0) {
            return res.status(404).json({success: false, error: "Product not found", identifier: identifier});
        }

        const product = rows[0];

        // Format product data for sales system
        const formattedProduct = {
            id: product.id,
            name: product.name,
            name_fr: product.name_fr || product.name,
            name_ar: product.name_ar || product.name,
            description: product.description,
            category: product.category_name || product.category,
            category_id: product.category_id,
            price: product.selling_price,
            selling_price: product.selling_price,
            purchase_price: product.purchase_price || product.cost,
            stock_quantity: product.remaining_stock || product.stock_quantity,
            remaining_stock: product.remaining_stock || product.stock_quantity,
            min_stock_level: product.min_stock_level,
            unit: product.unit || 'piece',
            brand: product.brand,
            sku: product.sku,
            barcode: product.barcode,
            image_url: product.image_url,
            is_active: true,
            created_at: product.created_at,
            updated_at: product.updated_at
        };

        res.json({success: true, product: formattedProduct});
    } catch (error) {
        console.error("Error fetching product for integration:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Check product availability (for sales system integration)
app.get("/api/integration/availability/:productId", async (req, res) => {
    try {
        const {productId} = req.params;
        const id = parseInt(productId);

        if (isNaN(id)) {
            return res.status(400).json({success: false, error: "Invalid product ID"});
        }

        const rows = await dbQuery.execute(`
      SELECT
        id,
        name,
        remaining_stock,
        min_stock_level,
        selling_price,
        CASE
          WHEN remaining_stock > 0 THEN true
          ELSE false
        END as is_available,
        CASE
          WHEN remaining_stock <= min_stock_level THEN true
          ELSE false
        END as is_low_stock,
        true as is_active
      FROM products
      WHERE id = ?
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({success: false, error: "Product not found"});
        }

        const product = rows[0];

        const availability = {
            product_id: product.id,
            product_name: product.name,
            current_stock: product.remaining_stock,
            min_stock_level: product.min_stock_level,
            selling_price: product.selling_price,
            is_available: product.is_available,
            is_low_stock: product.is_low_stock,
            is_active: product.is_active,
            stock_status: product.remaining_stock > product.min_stock_level ? 'good' : product.remaining_stock > 0 ? 'low' : 'out_of_stock'
        };

        res.json({success: true, availability: availability});
    } catch (error) {
        console.error("Error checking product availability:", error);
        res.status(500).json({success: false, error: error.message});
    }
});

// Search products (for sales system integration)
app.get("/api/integration/search", async (req, res) => {
    try {
        const {
                q: query = "",
                limit = "10"
            } = req.query;
            const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

            if (!query.trim()) {
                return res.json({success: true, products: []});
            }

            const searchQuery = `
      SELECT
        p.id,
        p.name,
        p.name_fr,
        p.name_ar,
        p.description,
        p.selling_price,
        p.remaining_stock,
        p.min_stock_level,
        p.unit,
        p.brand,
        p.sku,
        p.barcode,
        p.image_url,
        c.name as category_name,
        c.name_fr as category_name_fr,
        c.name_ar as category_name_ar,
        CASE
          WHEN p.remaining_stock > 0 THEN true
          ELSE false
        END as is_available
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE
        p.name LIKE ? OR
        p.name_fr LIKE ? OR
        p.name_ar LIKE ? OR
        p.description LIKE ? OR
        p.sku LIKE ? OR
        p.barcode LIKE ?
      ORDER BY
        CASE
          WHEN p.name LIKE ? THEN 1
          WHEN p.name LIKE ? THEN 2
          ELSE 3
        END,
        p.name
      LIMIT ?
    `;

            const searchTerm = `%${query}%`;
            const exactTerm = `${query}%`;

            const params = [
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                exactTerm,
                searchTerm,
                limitNum
            ];

            const rows = await dbQuery.execute(searchQuery, params);

            const products = rows.map(product => ({
                    id: product.id,
                    name: product.name,
                    name_fr: product.name_fr || product.name,
                    name_ar: product.name_ar || product.name,
                    description: product.description,
                    category: product.category_name || 'General',
                    category_fr: product.category_name_fr || product.category_name || 'General',
                    category_ar: product.category_name_ar || product.category_name || 'عام',
                    price: product.selling_price,
                    selling_price: product.selling_price,
                    stock_quantity: product.remaining_stock,
                    remaining_stock: product.remaining_stock,
                    min_stock_level: product.min_stock_level,
                    unit: product.unit || 'piece',
                    brand: product.brand,
                    sku: product.sku,
                    barcode: product.barcode,
                    image_url: product.image_url,
                    is_available: product.is_available,
                    is_low_stock: product.remaining_stock<= product.min_stock_level
    }));

    res.json({
      success: true, products: products, query: query, count: products.length
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false, error: error.message
    });
  }
});

// Record sale and update inventory (for sales system integration)
app.post("/api/integration/sale", async (req, res) => {
                        const connection = await pool.getConnection();

                        try {
                            await connection.beginTransaction();

                            const {
                                product_id,
                                quantity,
                                price,
                                date,
                                customer_id = null,
                                payment_method = 'cash',
                                notes = '',
                                discount = 0,
                                tax_amount = 0
                            } = req.body;

                            // Validate required fields
                            if (!product_id || !quantity || !price) {
                                await connection.rollback();
                                return res.status(400).json({success: false, error: "Missing required fields: product_id, quantity, price"});
                            }

                            // Get product details
                            const [productRows] = await connection.execute(`
      SELECT
        id, name, remaining_stock, selling_price, category_id,
        (SELECT name FROM categories WHERE id = category_id) as category_name
      FROM products
      WHERE id = ?
    `, [product_id]);

                            if (productRows.length === 0) {
                                await connection.rollback();
                                return res.status(404).json({success: false, error: "Product not found"});
                            }

                            const product = productRows[0];

                            // Check stock availability
                            if (product.remaining_stock<quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false, error: `Insufficient stock. Available: ${product.remaining_stock}, Requested: ${quantity}`
      });
    }

    // Generate sale number
    const saleNumber = `SALE-${Date.now()}-${product_id}`;
    const saleDate = date || new Date().toISOString().split('T')[0];
    const totalPrice = (price * quantity) - discount + tax_amount;

    // Insert sale record
    await connection.execute(`
      INSERT INTO sales (
        sale_number, date, customer_id, product_id, productName, price, quantity, category, totalPrice, discount, tax_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      saleNumber, saleDate, customer_id, product_id, product.name, price, quantity, product.category_name || 'General', totalPrice, discount, tax_amount, payment_method, notes
    ]);

    // Update product stock
    await connection.execute(`
      UPDATE products
      SET remaining_stock = remaining_stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [quantity, product_id]);

    // Record stock movement
    await connection.execute(`
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, reason, reference_type, reference_number, notes
      ) VALUES (?, 'out', ?, 'Sale', 'sale', ?, ?)
    `, [product_id, quantity, saleNumber, `Sale of ${quantity} units`]);

    await connection.commit();

    // Get updated product info
    const [updatedRows] = await connection.execute(`
      SELECT remaining_stock, CASE WHEN remaining_stock <= min_stock_level THEN true ELSE false END as is_low_stock
      FROM products WHERE id = ?
    `, [product_id]);

    const updatedProduct = updatedRows[0];

    res.json({
      success: true, message: "Sale recorded successfully", sale: {
        sale_number: saleNumber, product_id: product_id, product_name: product.name, quantity: quantity, price: price, total_price: totalPrice, date: saleDate
      }, inventory_update: {
        previous_stock: product.remaining_stock, new_stock: updatedProduct.remaining_stock, is_low_stock: updatedProduct.is_low_stock
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error recording sale:", error);
    res.status(500).json({
      success: false, error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get low stock products (for sales system integration)
app.get("/api/integration/low-stock", async (req, res) => {
  try {
    const rows = await dbQuery.execute(`
      SELECT
        p.id, p.name, p.name_fr, p.name_ar, p.remaining_stock, p.min_stock_level, p.selling_price, p.unit, c.name as category_name, c.name_fr as category_name_fr, c.name_ar as category_name_ar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.remaining_stock <= p.min_stock_level
      ORDER BY
        CASE
          WHEN p.remaining_stock = 0 THEN 1
          WHEN p.remaining_stock <= p.min_stock_level / 2 THEN 2
          ELSE 3
        END, p.remaining_stock ASC, p.name
    `);

    const lowStockProducts = rows.map(product => ({
      id: product.id, name: product.name, name_fr: product.name_fr || product.name, name_ar: product.name_ar || product.name, category: product.category_name || 'General', current_stock: product.remaining_stock, min_stock_level: product.min_stock_level, selling_price: product.selling_price, unit: product.unit || 'piece', status: product.remaining_stock === 0 ? 'out_of_stock' :
              product.remaining_stock <= product.min_stock_level / 2 ? 'critical' : 'low', stock_deficit: Math.max(0, product.min_stock_level - product.remaining_stock)
    }));

    res.json({
      success: true, low_stock_products: lowStockProducts, count: lowStockProducts.length, summary: {
        out_of_stock: lowStockProducts.filter(p => p.status === 'out_of_stock').length, critical: lowStockProducts.filter(p => p.status === 'critical').length, low: lowStockProducts.filter(p => p.status === 'low') .length
                            
                        }
                    }
                );
            } catch(error) {
                console.error("Error fetching low stock products:", error);
                res.status(500).json({success: false, error: error.message});
            }
        }
    );

    // =============================================================================

    // Health check endpoint
    app.get("/api/health", async (req, res) => {
        try {
            const connection = await pool.getConnection();
            connection.release();
            res.json({
                success: true,
                message: "MySQL database connected successfully",
                database: "MySQL",
                config: {
                    host: process.env.DB_HOST || "localhost",
                    database: process.env.DB_NAME || "products_manager",
                    port: process.env.DB_PORT || 3306
                }
            });
        } catch (error) {
            res.status(500).json({success: false, error: "Database connection failed", details: error.message});
        }
    });

    // Test MySQL connection
    async function testConnection() {
        try {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            console.log('✅ MySQL connection successful');
            return true;
        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.error('\n📋 MySQL Setup Required:');
            console.error('1. Install MySQL server');
            console.error('2. Start MySQL service');
            console.error('3. Create database: CREATE DATABASE products_manager;');
            console.error('4. Update .env file with correct MySQL credentials');
            console.error('5. Restart the application\n');
            return false;
        }
    }

    // Start server
    async function startServer() {
        try {
            await ensureUploadsDir();

            // Test MySQL connection first
            const isConnected = await testConnection();
            if (! isConnected) {
                console.log('⚠️  MySQL connection failed - Running with sample data for demo');
                useDatabase = false;
            }

            if (useDatabase) {
                await initializeDatabase();
            }

            // Health check endpoint
            app.get("/api/health", async (req, res) => {
                try {
                    if (useDatabase) { // Test database connection
                        await dbQuery.execute("SELECT 1");
                    }
                    res.json({
                        success: true,
                        message: "JAMALBRICO Products Manager is healthy",
                        database: useDatabase ? "Connected" : "Demo Mode (Sample Data)",
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        message: useDatabase ? "Database connection failed" : "Running with sample data",
                        error: useDatabase ? error.message : "No database configured"
                    });
                }
            });

            // =================================================================
            // INTEGRATION API ENDPOINTS FOR JAMALBRICO SALES SYSTEM
            // =================================================================

            // Search products for sales integration (simplified response)
            app.get("/api/integration/products/search", async (req, res) => {
                try {
                    const {
                        query = "",
                        limit = "20"
                    } = req.query;
                    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

                    if (!query || query.trim().length < 2) {
                        return res.json({success: true, products: []});
                    }

                    const searchQuery = `
          SELECT
            p.id,
            p.name,
            p.name_ar,
            p.name_fr,
            p.description,
            p.selling_price as price,
            p.remaining_stock,
            p.unit,
            p.sku,
            p.barcode,
            c.name as category,
            c.name_ar as category_ar,
            c.name_fr as category_fr
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = TRUE
            AND p.remaining_stock > 0
            AND (
              p.name LIKE ? OR
              p.name_ar LIKE ? OR
              p.name_fr LIKE ? OR
              p.description LIKE ? OR
              p.sku LIKE ? OR
              p.barcode LIKE ?
            )
          ORDER BY
            CASE
              WHEN p.name LIKE ? THEN 1
              WHEN p.sku = ? THEN 2
              WHEN p.barcode = ? THEN 3
              ELSE 4
            END,
            p.name ASC
          LIMIT ?
        `;

                    const searchTerm = `%${
                        query.trim()
                    }%`;
                    const exactQuery = query.trim();

                    const products = await dbQuery.execute(searchQuery, [
                        searchTerm,
                        searchTerm,
                        searchTerm,
                        searchTerm,
                        searchTerm,
                        searchTerm,
                        searchTerm,
                        exactQuery,
                        exactQuery,
                        limitNum
                    ]);

                    res.json({success: true, products});
                } catch (error) {
                    console.error("Error searching products for sales:", error);
                    res.status(500).json({success: false, error: error.message});
                }
            });

            // Get product by ID for sales integration
            app.get("/api/integration/products/:id", async (req, res) => {
                try {
                    const {id} = req.params;
                    const productId = parseInt(id);

                    if (isNaN(productId)) {
                        return res.status(400).json({success: false, error: "Invalid product ID"});
                    }

                    const productQuery = `
          SELECT
            p.id,
            p.name,
            p.name_ar,
            p.name_fr,
            p.description,
            p.selling_price as price,
            p.remaining_stock,
            p.unit,
            p.sku,
            p.barcode,
            c.name as category,
            c.name_ar as category_ar,
            c.name_fr as category_fr,
            p.image_url
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ? AND p.is_active = TRUE
        `;

                    const products = await dbQuery.execute(productQuery, [productId]);

                    if (products.length === 0) {
                        return res.status(404).json({success: false, error: "Product not found or inactive"});
                    }

                    res.json({success: true, product: products[0]});
                } catch (error) {
                    console.error("Error fetching product for sales:", error);
                    res.status(500).json({success: false, error: error.message});
                }
            });

            // Update product stock after sale (called by sales system)
            app.post("/api/integration/products/:id/update-stock", async (req, res) => {
                try {
                    const {id} = req.params;
                    const {
                        quantity,
                        operation = 'subtract'
                    } = req.body;
                    const productId = parseInt(id);
                    const qty = parseInt(quantity);

                    if (isNaN(productId) || isNaN(qty) || qty <= 0) {
                        return res.status(400).json({success: false, error: "Invalid product ID or quantity"});
                    }

                    // Get current stock
                    const currentProduct = await dbQuery.execute("SELECT remaining_stock, name FROM products WHERE id = ? AND is_active = TRUE", [productId]);

                    if (currentProduct.length === 0) {
                        return res.status(404).json({success: false, error: "Product not found"});
                    }

                    const currentStock = currentProduct[0].remaining_stock;
                    let newStock;

                    if (operation === 'subtract') {
                        if (currentStock < qty) {
                            return res.status(400).json({success: false, error: `Insufficient stock. Available: ${currentStock}, Requested: ${qty}`});
                        }
                        newStock = currentStock - qty;
                    } else if (operation === 'add') {
                        newStock = currentStock + qty;
                    } else {
                        return res.status(400).json({success: false, error: "Invalid operation. Use 'add' or 'subtract'"});
                    }

                    // Update stock
                    await dbQuery.execute("UPDATE products SET remaining_stock = ?, updated_at = NOW() WHERE id = ?", [newStock, productId]);

                    // Log stock movement
                    await dbQuery.execute(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reason, notes, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [
                        productId,
                        operation === 'subtract' ? 'OUT' : 'IN',
                        qty,
                        operation === 'subtract' ? 'Sale transaction' : 'Stock adjustment',
                        `Stock ${
                            operation === 'subtract' ? 'reduced' : 'increased'
                        } via sales system integration`
                    ]);
                    res.json({
                        success: true,
                        previous_stock: currentStock,
                        new_stock: newStock,
                        quantity_changed: qty,
                        operation
                    });
                } catch (error) {
                    console.error("Error updating product stock:", error);
                    res.status(500).json({success: false, error: error.message});
                }
            });
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`🗄️  Database mode: MySQL`);
                console.log(`📊 MySQL Database: ${
                    process.env.DB_NAME || "products_manager"
                }`);
                console.log(`🌐 MySQL Host: ${
                    process.env.DB_HOST || "localhost"
                }:${
                    process.env.DB_PORT || 3306
                }`);
                console.log(`\n🔗 API Health Check: http://localhost:${PORT}/api/health`);
            });
        } catch (error) {
            console.error("Failed to start server:", error);
            process.exit(1);
        }
    }
    startServer();
