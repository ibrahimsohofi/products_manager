// Simplified JAMALBRICO Sales Server (No Database Required)
import http from 'http';
import url from 'url';

const PORT = 3001;

// In-memory sales storage for demo
let sales = [
  {
    id: 1,
    sale_number: 'VENTE-2024-0001',
    date: '2024-12-28',
    product_id: 1,
    productName: 'Perceuse Visseuse Sans Fil 18V',
    price: 899.00,
    quantity: 1,
    category: 'Outillage Électrique',
    totalPrice: 899.00,
    payment_method: 'cash',
    created_at: new Date().toISOString()
  }
];

let customers = [
  { id: 1, name: 'Mohammed Alami', email: 'mohammed@example.com', phone: '+212-6-78-45-12-89' },
  { id: 2, name: 'Fatima Benali', email: 'fatima@example.com', phone: '+212-6-23-45-67-89' }
];

// Helper functions
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function generateSaleNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const count = sales.length + 1;
  return `VENTE-${year}-${count.toString().padStart(4, '0')}`;
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  try {
    console.log(`${new Date().toISOString()} - ${method} ${path}`);

    // Health check
    if (path === '/api/health' && method === 'GET') {
      sendJSON(res, {
        success: true,
        message: "JAMALBRICO Sales System is healthy",
        database: "In-Memory",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get all sales
    if (path === '/api/sales' && method === 'GET') {
      sendJSON(res, { success: true, sales: sales.reverse() });
      return;
    }

    // Add new sale
    if (path === '/api/sales' && method === 'POST') {
      const body = await parseBody(req);
      const { date, product_id, productName, price, quantity, category, customer_id, payment_method, notes } = body;

      // Validate required fields
      if (!productName || !price || !quantity || !category) {
        sendJSON(res, {
          success: false,
          error: 'Missing required fields: productName, price, quantity, category'
        }, 400);
        return;
      }

      const newSale = {
        id: sales.length + 1,
        sale_number: generateSaleNumber(),
        date: date || new Date().toISOString().split('T')[0],
        product_id: product_id || null,
        productName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category,
        totalPrice: parseFloat(price) * parseInt(quantity),
        customer_id: customer_id || null,
        payment_method: payment_method || 'cash',
        notes: notes || '',
        created_at: new Date().toISOString()
      };

      sales.push(newSale);

      console.log(`💰 New sale recorded: ${productName} x${quantity} = ${newSale.totalPrice} MAD`);

      sendJSON(res, {
        success: true,
        message: 'Sale recorded successfully',
        sale: newSale
      }, 201);
      return;
    }

    // Update sale
    if (path === '/api/sales' && method === 'PUT') {
      const body = await parseBody(req);
      const { id, date, product_id, productName, price, quantity, category, customer_id, payment_method, notes } = body;

      const saleIndex = sales.findIndex(s => s.id === parseInt(id));
      if (saleIndex === -1) {
        sendJSON(res, { success: false, error: 'Sale not found' }, 404);
        return;
      }

      // Update sale
      sales[saleIndex] = {
        ...sales[saleIndex],
        date: date || sales[saleIndex].date,
        product_id: product_id !== undefined ? product_id : sales[saleIndex].product_id,
        productName: productName || sales[saleIndex].productName,
        price: price !== undefined ? parseFloat(price) : sales[saleIndex].price,
        quantity: quantity !== undefined ? parseInt(quantity) : sales[saleIndex].quantity,
        category: category || sales[saleIndex].category,
        totalPrice: (price !== undefined ? parseFloat(price) : sales[saleIndex].price) *
                   (quantity !== undefined ? parseInt(quantity) : sales[saleIndex].quantity),
        customer_id: customer_id !== undefined ? customer_id : sales[saleIndex].customer_id,
        payment_method: payment_method || sales[saleIndex].payment_method,
        notes: notes !== undefined ? notes : sales[saleIndex].notes,
        updated_at: new Date().toISOString()
      };

      console.log(`📝 Sale updated: ID ${id}`);

      sendJSON(res, {
        success: true,
        message: 'Sale updated successfully',
        sale: sales[saleIndex]
      });
      return;
    }

    // Delete sale
    if (path === '/api/sales' && method === 'DELETE') {
      const saleId = parseInt(query.id);
      const saleIndex = sales.findIndex(s => s.id === saleId);

      if (saleIndex === -1) {
        sendJSON(res, { success: false, error: 'Sale not found' }, 404);
        return;
      }

      const deletedSale = sales.splice(saleIndex, 1)[0];
      console.log(`🗑️ Sale deleted: ${deletedSale.productName}`);

      sendJSON(res, {
        success: true,
        message: 'Sale deleted successfully'
      });
      return;
    }

    // Get customers
    if (path === '/api/customers' && method === 'GET') {
      sendJSON(res, { success: true, customers });
      return;
    }

    // Sales dashboard stats
    if (path === '/api/dashboard' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.date === today);
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalPrice, 0);

      const stats = {
        total_sales: sales.length,
        today_sales: todaySales.length,
        total_revenue: totalRevenue,
        today_revenue: todayRevenue,
        average_sale: sales.length > 0 ? totalRevenue / sales.length : 0
      };

      sendJSON(res, { success: true, stats });
      return;
    }

    // 404 - Route not found
    sendJSON(res, { success: false, error: "Route not found" }, 404);

  } catch (error) {
    console.error("API Error:", error);
    sendJSON(res, { success: false, error: error.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 JAMALBRICO Sales Server running on port ${PORT}`);
  console.log(`💾 In-memory database with ${sales.length} demo sales`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
});
