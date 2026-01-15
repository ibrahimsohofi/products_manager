# Integration Setup - SOHOFIBRICO & Products Manager

## Overview

This project integrates two systems:

1. **SOHOFIBRICO Sales System** (Port 3001) - Customer and sales management
2. **Products Manager API** (Port 5000) - Product inventory management

The sales system fetches product data from the Products Manager API when creating sales, wishlists, and viewing inventory.

## Architecture

```
┌─────────────────────┐
│   Frontend (5173)   │
│   React + Vite      │
└──────────┬──────────┘
           │
           ├──────────────────────────────┐
           │                              │
           ▼                              ▼
┌──────────────────────┐    ┌───────────────────────┐
│  Sales API (3001)    │    │ Products API (5000)   │
│  Customer & Sales    │◄───┤ Product Inventory     │
│  Management          │    │ Stock Management      │
└──────────────────────┘    └───────────────────────┘
           │                              │
           ▼                              ▼
    MySQL: bricojamal        MySQL: products_manager
```

## API Endpoints Used

### Products Manager API (Port 5000)

#### Integration Endpoints:

1. **Search Products** - `/api/integration/search?q=query&limit=10`
   - Used in customer wishlist when typing product names
   - Returns matching products with stock information

2. **Get Product Details** - `/api/integration/product/:identifier`
   - Fetch product by ID, name, SKU, or barcode
   - Returns full product information with pricing

3. **Check Availability** - `/api/integration/availability/:productId`
   - Check current stock levels
   - Returns availability status and low stock warnings

4. **Low Stock Products** - `/api/integration/low-stock`
   - Get all products below minimum stock level
   - Used in dashboard alerts

5. **Record Sale** - `/api/integration/sale` (POST)
   - Records sale and updates inventory automatically
   - Handles stock deduction and movement tracking

## Configuration

### Products Manager API (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=products_manager
PORT=5000
```

### Sales System (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bricojamal
PORT=3001
```

### Frontend Integration Service

Location: `src/services/inventoryIntegration.js`

The inventory integration service automatically:
- Connects to Products Manager API on port 5000
- Falls back to mock data if API is unavailable
- Handles multi-language product names (French/Arabic)
- Normalizes product data between systems

## Running the System

### Start All Services:
```bash
bun run dev
```

This starts:
- **Frontend** → http://localhost:5173
- **Sales API** → http://localhost:3001
- **Products API** → http://localhost:5000

### Start Individual Services:
```bash
bun run dev:frontend   # Frontend only
bun run dev:backend    # Sales API only
bun run dev:products   # Products API only
```

## Customer Wishlist Integration

When you navigate to `/customers/:id/wishlist`:

1. Type product name in search field
2. Frontend calls: `GET /api/integration/search?q={query}`
3. Products API returns matching products with:
   - Product name (French/Arabic)
   - Current stock level
   - Selling price
   - SKU/Barcode
   - Category

4. Select a product to add to wishlist
5. Product details auto-fill from API

## Database Setup

### Products Manager Database:

```sql
CREATE DATABASE products_manager;
USE products_manager;
-- Tables will be created automatically on first run
```

The API will create these tables:
- `categories` - Product categories with multi-language support
- `products` - Product inventory with stock tracking
- `suppliers` - Supplier information
- `customers` - Customer data
- `sales` - Sales records
- `stock_movements` - Inventory movement history

### Default Categories Created:
- Droguerie (مواد كيميائية)
- Sanitaire (صحي)
- Peinture (دهان)
- Quincaillerie (أدوات معدنية)
- Outillage (أدوات)
- Électricité (كهرباء)

## Testing the Integration

### 1. Health Check:
```bash
curl http://localhost:5000/api/health
```

### 2. Search Products:
```bash
curl "http://localhost:5000/api/integration/search?q=peinture&limit=5"
```

### 3. Get Product:
```bash
curl http://localhost:5000/api/integration/product/1
```

### 4. Check Availability:
```bash
curl http://localhost:5000/api/integration/availability/1
```

## Troubleshooting

### Products Not Appearing in Wishlist Search:

1. **Check Products API is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check database has products:**
   ```sql
   USE products_manager;
   SELECT COUNT(*) FROM products;
   ```

3. **Check browser console:**
   - Open DevTools → Network tab
   - Search for products
   - Look for requests to `localhost:5000/api/integration/search`

4. **Add sample products:**
   You can use the Products Manager UI or insert directly:
   ```sql
   INSERT INTO products (name, name_fr, name_ar, category_id, selling_price, remaining_stock, unit)
   VALUES ('Peinture Blanche', 'Peinture Blanche', 'دهان أبيض', 3, 250.00, 50, 'L');
   ```

### CORS Errors:

The Products Manager API has CORS enabled by default. If you still see errors:
- Check that both APIs are running
- Verify ports are correct (3001 for sales, 5000 for products)
- Check browser console for specific error messages

## Adding Products

You can add products through:

1. **Direct SQL** (fastest for testing)
2. **Products Manager API** (via POST /api/products)
3. **Future Products Manager UI** (to be built)

## Multi-Language Support

Products support French and Arabic:
- `name` - Default name
- `name_fr` - French name
- `name_ar` - Arabic name

The frontend automatically displays the correct language based on user preference.

## Next Steps

- [ ] Add product management UI
- [ ] Implement barcode scanning
- [ ] Add product image uploads
- [ ] Create stock adjustment interface
- [ ] Add supplier management UI
