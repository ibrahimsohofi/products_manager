import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database
const db = new Database(join(__dirname, 'test.db'));

// Create sales table
db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number VARCHAR(100),
    date DATE NOT NULL,
    customer_id INTEGER,
    product_id INTEGER,
    productName VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    totalPrice DECIMAL(12,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert sample sales data
const insertSale = db.prepare(`
  INSERT INTO sales (date, product_id, productName, price, quantity, category, totalPrice, sale_number)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const salesData = [
  ['2024-01-15', 1, 'Marteau 500g', 45.00, 3, 'Outillage', 135.00, 'SALE-1'],
  ['2024-01-16', 1, 'Marteau 500g', 45.00, 2, 'Outillage', 90.00, 'SALE-2'],
  ['2024-01-17', 2, 'Tournevis Phillips', 18.50, 5, 'Outillage', 92.50, 'SALE-3'],
  ['2024-01-18', 3, 'Clous 50mm', 15.00, 10, 'Quincaillerie', 150.00, 'SALE-4'],
  ['2024-01-19', 4, 'Vis à bois 4x40mm', 12.00, 8, 'Quincaillerie', 96.00, 'SALE-5'],
  ['2024-01-20', 5, 'Perceuse électrique', 450.00, 1, 'Électricité', 450.00, 'SALE-6'],
  ['2024-01-21', 6, 'Peinture blanche 2.5L', 85.00, 4, 'Peinture', 340.00, 'SALE-7'],
  ['2024-01-22', 1, 'Marteau 500g', 45.00, 1, 'Outillage', 45.00, 'SALE-8'],
  ['2024-01-23', 3, 'Clous 50mm', 15.00, 15, 'Quincaillerie', 225.00, 'SALE-9'],
  ['2024-01-24', 2, 'Tournevis Phillips', 18.50, 3, 'Outillage', 55.50, 'SALE-10'],
];

// Clear existing data
db.exec('DELETE FROM sales');

// Insert all sales
const insertMany = db.transaction((sales) => {
  for (const sale of sales) {
    insertSale.run(...sale);
  }
});

insertMany(salesData);

console.log('✅ SQLite test database created with sample sales data');

// Query aggregated data
const aggregated = db.prepare(`
  SELECT
    MIN(product_id) as product_id,
    productName as product_name,
    category,
    SUM(quantity) as total_product_sold,
    AVG(price) as price,
    SUM(totalPrice) as total_prices
  FROM sales
  GROUP BY productName, category
  ORDER BY total_prices DESC
`).all();

console.log('\n📊 Aggregated Sales Data:');
console.table(aggregated);

db.close();
