# 🗄️ MySQL Setup Guide for JAMALBRICO

This guide helps you set up MySQL database for the JAMALBRICO inventory management system.

## 🚫 No SQLite or Mock Data

**Important**: This application **ONLY** supports MySQL. SQLite and mock data have been removed as requested.

## 📋 Prerequisites

- **MySQL 8.0+** (required)
- **Node.js 18+** and **Bun** package manager

## 🎯 Quick Setup Options

### Option 1: Docker Compose (Recommended)

The easiest way to get MySQL running:

```bash
# Start MySQL with Docker
docker-compose up -d mysql

# Check if it's running
docker-compose ps

# View logs
docker-compose logs mysql
```

**Database Details:**
- **Host**: `localhost:3306`
- **Database**: `jamalbrico`
- **Root Password**: `jamalbrico123`
- **User**: `jamalbrico_user`
- **Password**: `jamalbrico_pass`

### Option 2: Local MySQL Installation

#### Ubuntu/Debian:
```bash
# Run our setup script
chmod +x setup_mysql.sh
./setup_mysql.sh

# Or manually:
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### macOS:
```bash
# With Homebrew
brew install mysql
brew services start mysql

# Or run our setup script
chmod +x setup_mysql.sh
./setup_mysql.sh
```

#### Windows:
1. Download MySQL from https://dev.mysql.com/downloads/mysql/
2. Install MySQL Server
3. Start MySQL service
4. Use MySQL Workbench or command line

### Option 3: Manual Database Setup

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE jamalbrico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'jamalbrico_user'@'localhost' IDENTIFIED BY 'jamalbrico_pass';
GRANT ALL PRIVILEGES ON jamalbrico.* TO 'jamalbrico_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE jamalbrico;
```

## ⚙️ Environment Configuration

Update your `.env` files with the correct MySQL credentials:

### For jamalbrico/server/.env:
```env
# Database Configuration - MySQL REQUIRED
DB_HOST=localhost
DB_USER=root                    # or jamalbrico_user
DB_PASSWORD=                    # or jamalbrico123 (Docker) / jamalbrico_pass (local user)
DB_NAME=jamalbrico
DB_PORT=3306
```

### For Docker usage:
```env
DB_HOST=localhost
DB_USER=jamalbrico_user
DB_PASSWORD=jamalbrico_pass
DB_NAME=jamalbrico
DB_PORT=3306
```

## 🗃️ Database Schema

The application will automatically create all necessary tables:

- **suppliers** - Supplier information
- **customers** - Customer data
- **products** - Product inventory
- **sales** - Sales transactions
- **purchase_orders** - Purchase order management
- **purchase_order_items** - Purchase order line items
- **stock_movements** - Inventory movement tracking
- **users** - User management

## 📊 Sample Data

The system includes sample data for testing:

- **Suppliers**: Quincaillerie Centrale, Matériaux du Sud
- **Customers**: Mohammed Tazi, Entreprise ABC, Client Particulier
- **Products**: Marteau, Tournevis, Clous, Vis, Perceuse, Peinture
- **Categories**: Outils, Fixations, Outillage électrique, Peinture

## 🚀 Starting the Application

1. **Start MySQL** (if not using Docker):
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mysql

   # macOS
   brew services start mysql
   ```

2. **Start Backend**:
   ```bash
   cd jamalbrico/server
   bun install
   bun start
   ```

3. **Start Frontend**:
   ```bash
   cd jamalbrico
   bun install
   bun run dev
   ```

## 🔍 Verification

### Check Database Connection:
```bash
# Test connection with your credentials
mysql -h localhost -u jamalbrico_user -p jamalbrico

# Check tables
SHOW TABLES;

# Check sample data
SELECT COUNT(*) FROM products;
SELECT * FROM products LIMIT 5;
```

### Check Application Logs:
The backend will show connection status:
```
✅ Connected to MySQL server
✅ Database 'jamalbrico' ensured to exist
✅ MySQL database connected successfully
✅ Database tables created successfully
✅ Sample data inserted successfully
```

## 🐛 Troubleshooting

### Connection Refused:
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Start MySQL if not running
sudo systemctl start mysql  # Linux
brew services start mysql  # macOS
```

### Access Denied:
```bash
# Reset root password
sudo mysql_secure_installation

# Or set password for root
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Cannot Create Database:
```bash
# Connect as root and manually create
mysql -u root -p
CREATE DATABASE jamalbrico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Port Already in Use:
```bash
# Check what's using port 3306
sudo lsof -i :3306

# Or change port in .env file
DB_PORT=3307
```

## 🔧 Advanced Configuration

### Production Setup:
1. Create dedicated MySQL user
2. Set strong passwords
3. Configure SSL connections
4. Set up database backups
5. Monitor performance

### Multiple Environments:
```bash
# Development
cp .env .env.development

# Production
cp .env .env.production
# Update with production database credentials
```

## 🎯 Integration with Products Manager

The jamalbrico sales system integrates with JAMALBRICO_ProductsManager:

1. Both systems use the same `jamalbrico` database
2. Real-time inventory updates
3. Product selection from inventory
4. Stock validation

Make sure both systems are configured with the same database credentials.

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

## ✅ Success Checklist

- [ ] MySQL server is running
- [ ] Database `jamalbrico` exists
- [ ] User credentials are configured
- [ ] Backend connects successfully
- [ ] Tables are created automatically
- [ ] Sample data is loaded
- [ ] Frontend loads without errors
- [ ] Sales can be created and saved

---

**Need Help?** Check the application logs for detailed error messages or contact support.
