# 🏪 JAMALBRICO - Professional Inventory Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)

**A modern, bilingual inventory management system tailored for hardware stores and DIY shops in Morocco**

[🚀 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [⚡ Quick Start](#-quick-start) • [📱 Mobile App](#-mobile-app) • [🌐 Deployment](#-deployment)

</div>

---

## 🌟 Overview

**JAMALBRICO** is a comprehensive inventory management solution designed specifically for hardware stores (quincailleries) and DIY shops. Built with modern technologies and featuring full Arabic/French bilingual support, it provides an intuitive interface for managing products, tracking inventory, and generating reports.

### 🎯 Perfect For
- **Hardware Stores (Quincailleries)**
- **DIY & Construction Supply Shops**
- **Building Materials Retailers**
- **Tool & Equipment Vendors**
- **Small to Medium Retail Businesses**

---

## ✨ Features

### 🏪 **Core Inventory Management**
- ✅ **Product CRUD Operations** - Add, edit, delete, and view products
- ✅ **Real-time Search** - Instant product search with debounced input
- ✅ **Advanced Filtering** - Filter by categories, stock levels, and more
- ✅ **Bulk Operations** - Select and manage multiple products at once
- ✅ **Image Management** - Upload and manage product images
- ✅ **Stock Tracking** - Monitor inventory levels and stock alerts

### 📊 **Analytics & Reporting**
- ✅ **Dashboard Statistics** - Total products, categories, and stock overview
- ✅ **Excel Export** - Export filtered data to Excel spreadsheets
- ✅ **Inventory Reports** - Generate comprehensive inventory reports
- ✅ **Low Stock Alerts** - Automatic notifications for low inventory

### 🌍 **Internationalization**
- ✅ **Bilingual Support** - Full Arabic and French language support
- ✅ **RTL Layout** - Right-to-left layout for Arabic language
- ✅ **Localized Content** - All UI elements translated and culturally adapted
- ✅ **Smart Language Detection** - Automatic language detection and switching

### 🎨 **Modern UI/UX**
- ✅ **Responsive Design** - Perfect on desktop, tablet, and mobile
- ✅ **Dark/Light Theme** - Toggle between light and dark modes
- ✅ **shadcn/ui Components** - Modern, accessible component library
- ✅ **Loading States** - Smooth skeleton loading animations
- ✅ **Toast Notifications** - User-friendly feedback system

### 📱 **Mobile Experience**
- ✅ **Progressive Web App (PWA)** - Install as mobile app
- ✅ **Android APK Generation** - Build native Android apps with Capacitor
- ✅ **Offline Capability** - Work offline with local data caching
- ✅ **Touch-Optimized** - Mobile-first design approach

### 🔧 **Technical Features**
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **API Integration** - RESTful API with MySQL database
- ✅ **Performance Optimized** - Virtual scrolling for large datasets
- ✅ **Error Handling** - Comprehensive error handling and validation
- ✅ **Code Quality** - Biome linting and formatting

---

## 🛠️ Tech Stack

### **Frontend**
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.6.3",
  "bundler": "Vite 6.3.5",
  "styling": "Tailwind CSS 3.4.17",
  "components": "shadcn/ui + Radix UI",
  "state": "React Query + React Hook Form",
  "routing": "React Router 7.7.1",
  "i18n": "i18next + react-i18next",
  "icons": "Lucide React"
}
```

### **Backend**
```json
{
  "runtime": "Node.js + Express 4.21.2",
  "database": "MySQL 8.0",
  "storage": "File system + Multer",
  "validation": "Zod 4.0.5",
  "environment": "dotenv"
}
```

### **Mobile**
```json
{
  "framework": "Capacitor 7.4.2",
  "platform": "Android",
  "build": "Gradle + Android SDK"
}
```

### **Development Tools**
```json
{
  "package_manager": "Bun 1.2.17",
  "linting": "Biome 1.9.4",
  "formatting": "Prettier 3.6.2",
  "deployment": "Netlify + Static/Dynamic"
}
```

---

## ⚡ Quick Start

### **Prerequisites**
- 🟢 **Node.js** 18+ 
- 🟢 **Bun** package manager
- 🟢 **MySQL** 8.0+
- 🟢 **Git**

### **1. Clone Repository**
```bash
git clone https://github.com/ibrahimsohofi/JAMALBRICO_ProductsManager.git
cdJAMALBRICO_ProductsManager
```

### **2. Install Dependencies**
```bash
# Install frontend dependencies
bun install

# Install backend dependencies
cd backend && bun install && cd ..
```

### **3. Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE jamalbrico;

# Run setup script
bash setup-mysql.sh

# Or manually import
mysql -u root -p jamalbrico < backend/database.sql
```

### **4. Environment Configuration**
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit with your MySQL credentials
nano backend/.env
```

**Environment Variables:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jamalbrico
DB_PORT=3306
PORT=5000
```

### **5. Start Development Server**
```bash
# Starts both frontend and backend
bun run dev
```

🎉 **Application running at:**
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

---

## 📱 Mobile App Generation

### **Android APK Build**
```bash
# Build for production
bun run build

# Add Android platform
bunx cap add android

# Sync files
bunx cap sync

# Build APK
bunx cap build android
```

📖 **Detailed Guide:** See [APK-Generation-Guide.md](APK-Generation-Guide.md)

---

## 🌐 Deployment

### **Netlify Deployment (Recommended)**
```bash
# Build application
bun run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### **Static Deployment**
```bash
# Build static files
bun run build

# Deploy dist/ folder to any static hosting
```

### **Dynamic Deployment (with Backend)**
Configure `netlify.toml` for serverless functions or deploy backend separately.

📖 **Detailed Guide:** See [Frontend-Backend-Connection-Guide.md](Frontend-Backend-Connection-Guide.md)

---

## 📁 Project Structure

```
JAMALBRICO_ProductsManager/
├── 📁 src/                    # Frontend source code
│   ├── 📁 components/         # React components
│   │   ├── 📁 ui/            # shadcn/ui components
│   │   ├── Navbar.tsx        # Navigation component
│   │   ├── ProductTable.tsx  # Product listing
│   │   └── ProductForm.tsx   # Product form
│   ├── 📁 hooks/             # Custom React hooks
│   ├── 📁 i18n/              # Internationalization
│   │   └── 📁 locales/       # Translation files
│   ├── 📁 services/          # API services
│   ├── 📁 types/             # TypeScript definitions
│   └── App.tsx               # Main application
├── 📁 backend/               # Backend server
│   ├── server.js             # Express server
│   ├── database.sql          # Database schema
│   └── uploads/              # File uploads
├── 📁 netlify/               # Netlify functions
└── 📄 Documentation files
```

---

## 🎯 Usage Guide

### **Adding Products**
1. Click **"Ajouter Produit"** button
2. Fill in product details (name, price, category, etc.)
3. Upload product image (optional)
4. Click **"Enregistrer"** to save

### **Managing Inventory**
1. Use **search bar** to find specific products
2. **Filter by category** using dropdown
3. **Bulk select** products for batch operations
4. **Export data** to Excel for reporting

### **Language Switching**
1. Click **language selector** in navbar
2. Choose between **Français** and **العربية**
3. Interface automatically adapts to RTL for Arabic

### **Mobile Usage**
1. Access on mobile browser
2. Install as PWA using "Add to Home Screen"
3. Use touch gestures for navigation

---

## 🔧 Development Scripts

```bash
# Development
bun run dev          # Start development server
bun run dev:frontend # Frontend only
bun run dev:backend  # Backend only

# Building
bun run build        # Build for production
bun run preview      # Preview production build

# Code Quality
bun run lint         # Run linter
bun run format       # Format code
bun run type-check   # TypeScript checking

# Database
bash setup-mysql.sh # Setup MySQL database
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- ✅ Follow TypeScript best practices
- ✅ Use Biome for code formatting
- ✅ Add translations for new features
- ✅ Test on both languages
- ✅ Ensure responsive design

---

## 📚 Documentation

- 📖 [**Setup Guide**](SETUP.md) - Detailed setup instructions
- 📖 [**MySQL Setup**](MYSQL_SETUP.md) - Database configuration
- 📖 [**APK Generation**](APK-Generation-Guide.md) - Mobile app building
- 📖 [**Performance Guide**](PERFORMANCE_OPTIMIZATION_PLAN.md) - Optimization tips
- 📖 [**Connection Guide**](Frontend-Backend-Connection-Guide.md) - API integration

---

## 🐛 Troubleshooting

### **Common Issues**

**🔴 MySQL Connection Failed**
```bash
# Check MySQL service
sudo systemctl status mysql

# Verify credentials in .env file
cat backend/.env
```

**🔴 Port Already in Use**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or change port in vite.config.ts
```

**🔴 Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lock
bun install
```

---

## 📊 Performance

- ⚡ **Loading Time:** < 2 seconds
- ⚡ **Bundle Size:** ~800KB gzipped
- ⚡ **Lighthouse Score:** 95+ PWA ready
- ⚡ **Database:** Optimized queries with indexing
- ⚡ **Images:** Lazy loading and compression

---

## 🔒 Security

- 🔐 **Input Validation** - Zod schema validation
- 🔐 **SQL Injection Protection** - Parameterized queries
- 🔐 **File Upload Security** - Type and size restrictions
- 🔐 **Environment Variables** - Sensitive data protection
- 🔐 **CORS Configuration** - Proper origin handling

---

## 📈 Roadmap

### **Phase 1 - Current**
- ✅ Core inventory management
- ✅ Bilingual support (Arabic/French)
- ✅ Mobile responsiveness
- ✅ Excel export functionality

### **Phase 2 - Next Release**
- 🔄 **Barcode Scanning** - Camera-based barcode reading
- 🔄 **Supplier Management** - Track suppliers and orders
- 🔄 **Sales Tracking** - Point of sale integration
- 🔄 **Advanced Analytics** - Charts and dashboards

### **Phase 3 - Future**
- 🔄 **Multi-store Support** - Manage multiple locations
- 🔄 **User Roles** - Staff and admin permissions
- 🔄 **Backup/Restore** - Automated data backup
- 🔄 **Integration APIs** - Connect with accounting software

---

## 👨‍💻 Author

**Ibrahim Sohofi** - *Lead Developer*
- GitHub: [@ibrahimsohofi](https://github.com/ibrahimsohofi)
- Project: [manage_sells](https://github.com/ibrahimsohofi/JAMALBRICO_ProductsManager)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Accessible component primitives  
- **Lucide** - Beautiful icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool
- **React Query** - Data fetching library

---

<div align="center">

**⭐ If this project helped you, please give it a star! ⭐**

[🚀 Get Started](#-quick-start) • [📱 Download APK](#-mobile-app) • [🌐 Live Demo](#-deployment)

Made with ❤️ for the Moroccan business community

</div>
