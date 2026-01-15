# SOHOFIBRICO - Hardware & Drugstore Management System

Professional inventory and sales management system for hardware and DIY stores in Morocco.

## 🌍 Languages

This application supports:
- **🇫🇷 Français (French)** - Default language
- **🇲🇦 العربية (Arabic)** - Full RTL support

**Note**: English support has been removed. Only French and Arabic are available.

## 💰 Currency

All prices are displayed in **MAD (Moroccan Dirham)**:
- French: `1 234,56 MAD`
- Arabic: `1 234,56 درهم`

## 🚀 Quick Start

### Prerequisites
- Bun (package manager)
- Node.js 18+
- MySQL database

### Installation

```bash
# Install dependencies
bun install

# Install backend dependencies
cd server && bun install && cd ..

# Start the application (frontend + backend)
bun run dev
```

The application will run on:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Project Structure

```
sohofibrico/
├── src/
│   ├── components/       # React components
│   ├── i18n/            # Internationalization
│   │   ├── locales/
│   │   │   ├── fr.json  # French translations
│   │   │   └── ar.json  # Arabic translations
│   │   └── index.js     # i18n configuration
│   ├── services/        # API services
│   └── App.jsx          # Main app component
├── server/              # Backend API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
└── database/            # SQL schemas
```

## ✨ Features

- 📊 **Dashboard** - Real-time sales and inventory statistics
- 💼 **Sales Management** - Create and track sales
- 📦 **Inventory Management** - Product stock control
- 👥 **Customer Management** - Customer database with credit tracking
- 🏢 **Supplier Management** - Supplier information and products
- 📈 **Reports** - Sales and inventory reports
- 🌙 **Dark Mode** - Full dark mode support
- 🌐 **Bilingual** - French and Arabic with RTL support

## 🔧 Available Scripts

```bash
bun run dev              # Start fullstack (frontend + backend)
bun run dev:frontend     # Start frontend only
bun run dev:backend      # Start backend only
bun run build           # Build for production
bun run lint            # Run Biome linter
bun run format          # Format code with Biome
```

## 🗄️ Database Setup

See `MYSQL_SETUP.md` for detailed database setup instructions.

## 📝 Language Configuration

The application uses i18next for internationalization. To change the language:
1. Click the language switcher in the top navigation
2. Select between Français or العربية

Language preference is saved in localStorage and persists across sessions.

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **RTL Support** - Full right-to-left layout for Arabic

## 📄 License

MIT
