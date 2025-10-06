import { getDatabase } from '../config/database.js';

class Customer {
  // Get all customers with optional filters
  static async getAll(filters = {}) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    let query = `
      SELECT *
      FROM customers
      WHERE is_active = 1
    `;
    const params = [];

    // Apply filters
    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.customer_type) {
      query += ' AND customer_type = ?';
      params.push(filters.customer_type);
    }

    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }

    // Order by name
    query += ' ORDER BY name ASC';

    // Apply pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const rows = await db.all(query, params);
    return rows;
  }

  // Get customer by ID
  static async getById(id) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM customers WHERE id = ?';
    const row = await db.get(query, [id]);
    return row;
  }

  // Get customer by email
  static async getByEmail(email) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM customers WHERE email = ? AND is_active = 1';
    const row = await db.get(query, [email]);
    return row;
  }

  // Create new customer
  static async create(customerData) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const {
      name, email, phone, address, city, postal_code,
      customer_type, credit_limit, notes
    } = customerData;

    const query = `
      INSERT INTO customers (
        name, email, phone, address, city, postal_code,
        customer_type, credit_limit, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(query, [
      name, email, phone, address, city, postal_code,
      customer_type || 'retail', credit_limit || 0, notes
    ]);

    return { id: result.lastID, ...customerData };
  }

  // Update customer
  static async update(id, customerData) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const {
      name, email, phone, address, city, postal_code,
      customer_type, credit_limit, notes, is_active
    } = customerData;

    const query = `
      UPDATE customers
      SET name = ?, email = ?, phone = ?, address = ?, city = ?,
          postal_code = ?, customer_type = ?, credit_limit = ?,
          notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.run(query, [
      name, email, phone, address, city, postal_code,
      customer_type, credit_limit, notes,
      is_active !== undefined ? is_active : 1, id
    ]);

    return { id, ...customerData };
  }

  // Delete customer (soft delete)
  static async delete(id) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = 'UPDATE customers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await db.run(query, [id]);
    return result.changes > 0;
  }

  // Get customer statistics
  static async getCustomerStats(customerId) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const totalSales = await db.get(
      'SELECT COUNT(*) as count FROM sales WHERE customer_id = ?',
      [customerId]
    );

    const totalRevenue = await db.get(
      'SELECT SUM(totalPrice) as total FROM sales WHERE customer_id = ?',
      [customerId]
    );

    const lastSale = await db.get(
      'SELECT date, totalPrice FROM sales WHERE customer_id = ? ORDER BY date DESC LIMIT 1',
      [customerId]
    );

    const avgSale = await db.get(
      'SELECT AVG(totalPrice) as average FROM sales WHERE customer_id = ?',
      [customerId]
    );

    return {
      totalSales: totalSales?.count || 0,
      totalRevenue: parseFloat(totalRevenue?.total || 0),
      averageSale: parseFloat(avgSale?.average || 0),
      lastSaleDate: lastSale?.date,
      lastSaleAmount: parseFloat(lastSale?.totalPrice || 0)
    };
  }

  // Get customer purchase history
  static async getPurchaseHistory(customerId, limit = 10) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = `
      SELECT s.*, p.name as product_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.customer_id = ?
      ORDER BY s.date DESC, s.created_at DESC
      LIMIT ?
    `;

    const rows = await db.all(query, [customerId, limit]);
    return rows;
  }

  // Search customers
  static async search(term) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = `
      SELECT *
      FROM customers
      WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
      AND is_active = 1
      ORDER BY name ASC
      LIMIT 20
    `;

    const searchTerm = `%${term}%`;
    const rows = await db.all(query, [searchTerm, searchTerm, searchTerm]);
    return rows;
  }

  // Get customer types
  static async getCustomerTypes() {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = `
      SELECT customer_type, COUNT(*) as count
      FROM customers
      WHERE is_active = 1
      GROUP BY customer_type
      ORDER BY customer_type
    `;

    const rows = await db.all(query);
    return rows;
  }

  // Get top customers by revenue
  static async getTopCustomers(limit = 10) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = `
      SELECT c.*,
             COUNT(s.id) as total_orders,
             SUM(s.totalPrice) as total_revenue,
             AVG(s.totalPrice) as avg_order_value,
             MAX(s.date) as last_order_date
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE c.is_active = 1
      GROUP BY c.id
      HAVING total_revenue > 0
      ORDER BY total_revenue DESC
      LIMIT ?
    `;

    const rows = await db.all(query, [limit]);
    return rows.map(row => ({
      ...row,
      total_revenue: parseFloat(row.total_revenue || 0),
      avg_order_value: parseFloat(row.avg_order_value || 0)
    }));
  }

  // Get customers with no recent purchases
  static async getInactiveCustomers(daysInactive = 90) {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const query = `
      SELECT c.*, MAX(s.date) as last_purchase_date
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      WHERE c.is_active = 1
      GROUP BY c.id
      HAVING last_purchase_date IS NULL
             OR last_purchase_date < DATE('now', '-${daysInactive} days')
      ORDER BY last_purchase_date ASC
    `;

    const rows = await db.all(query);
    return rows;
  }
}

export default Customer;
