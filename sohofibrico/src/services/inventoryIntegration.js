// Inventory Integration Service
// Connects the sales system with the inventory management system

import { API_BASE_URL } from "../config/api.js";

// Products Manager API Base URL (runs on port 5000)
const INVENTORY_API_BASE =
  import.meta.env?.VITE_INVENTORY_API_BASE || "http://localhost:5000/api";

const HEALTH_ENDPOINT =
  import.meta.env?.VITE_INVENTORY_HEALTH_ENDPOINT ||
  "http://localhost:5000/api/health";

const MOCK_PRODUCTS = [
  {
    id: 101,
    sku: "PN-001",
    name: "Peinture Intérieure Premium",
    category: "Peinture",
    selling_price: 249.9,
    stock_quantity: 42,
    min_stock_level: 10,
    unit: "L",
    image_url: "/mock/peinture.jpg",
  },
  {
    id: 102,
    sku: "PR-002",
    name: "Primaire d’accrochage Pro",
    category: "Peinture",
    selling_price: 189.5,
    stock_quantity: 65,
    min_stock_level: 15,
    unit: "L",
    image_url: "/mock/primaire.jpg",
  },
  {
    id: 103,
    sku: "BR-003",
    name: "Lot de pinceaux Premium (5)",
    category: "Outillage",
    selling_price: 129.0,
    stock_quantity: 120,
    min_stock_level: 25,
    unit: "Lot",
    image_url: "/mock/pinceaux.jpg",
  },
  {
    id: 104,
    sku: "MR-004",
    name: "Mortier Colle Haute Adhérence",
    category: "Construction",
    selling_price: 89.9,
    stock_quantity: 80,
    min_stock_level: 20,
    unit: "Sac",
    image_url: "/mock/mortier.jpg",
  },
  {
    id: 105,
    sku: "EL-005",
    name: "Projecteur LED 50W IP65",
    category: "Électricité",
    selling_price: 349.0,
    stock_quantity: 34,
    min_stock_level: 8,
    unit: "Pièce",
    image_url: "/mock/projecteur.jpg",
  },
];

const normalizeProduct = (service, product) => ({
  ...product,
  displayName: service.getLocalizedField(product, "name") || product.name,
  displayCategory:
    service.getLocalizedField(product, "category") || product.category,
  price: product.selling_price ?? product.price ?? 0,
  remaining_stock: product.stock_quantity ?? product.remaining_stock ?? 0,
  stock_quantity: product.stock_quantity ?? product.remaining_stock ?? 0,
});

class InventoryIntegrationService {
  // Get current language from localStorage or default to 'fr'
  getCurrentLanguage() {
    return localStorage.getItem("i18nextLng") || "fr";
  }

  // Get localized field based on current language
  getLocalizedField(product, fieldName) {
    const lang = this.getCurrentLanguage();
    if (lang === "ar" && product[`${fieldName}_ar`]) {
      return product[`${fieldName}_ar`];
    }
    if (lang === "fr" && product[`${fieldName}_fr`]) {
      return product[`${fieldName}_fr`];
    }
    // Fallback to the base field
    return product[fieldName];
  }

  // Get product information from inventory system
  async getProduct(identifier) {
    try {
      const response = await fetch(
        `${INVENTORY_API_BASE}/integration/product/${identifier}`,
      );
      const data = await response.json();

      // Handle different response formats
      let product;
      if (data.success && data.product) {
        product = data.product;
      } else if (data.id) {
        product = data;
      } else {
        throw new Error("Product not found");
      }

      return normalizeProduct(this, product);
    } catch (error) {
      console.error("Error fetching product from inventory:", error);
      const fallback =
        MOCK_PRODUCTS.find(
          (p) =>
            String(p.id) === String(identifier) ||
            p.sku?.toLowerCase() === String(identifier).toLowerCase(),
        ) || null;
      if (fallback) {
        return normalizeProduct(this, fallback);
      }
      throw error;
    }
  }

  // Check product availability (using product endpoint data)
  async checkAvailability(productId) {
    try {
      // Try the dedicated availability endpoint first
      try {
        const response = await fetch(
          `${INVENTORY_API_BASE}/integration/availability/${productId}`,
        );
        const data = await response.json();

        if (data.success && data.availability) {
          const avail = data.availability;
          return {
            is_available: avail.is_available,
            is_active: avail.is_active,
            current_stock: avail.current_stock,
            is_low_stock: avail.is_low_stock,
            product_name: avail.product_name || avail.name,
            unit: avail.unit || "unités",
            img_path: avail.image_url,
            selling_price: avail.selling_price,
          };
        }
      } catch (availError) {
        console.log("Availability endpoint not available, using product data");
      }

      // Fallback to product endpoint
      const product = await this.getProduct(productId);
      const currentStock =
        product.stock_quantity || product.remaining_stock || 0;
      const minStock = product.min_stock_level || 5;

      return {
        is_available: currentStock > 0,
        is_active: true, // Products from API are already filtered as active
        current_stock: currentStock,
        is_low_stock: currentStock <= minStock,
        product_name: product.displayName || product.name,
        unit: product.unit || "unités",
        img_path: product.image_url,
        selling_price: product.price || product.selling_price,
      };
    } catch (error) {
      console.error("Error checking product availability:", error);
      throw error;
    }
  }

  // Search products in inventory
  async searchProducts(query, limit = 10) {
    try {
      const response = await fetch(
        `${INVENTORY_API_BASE}/integration/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
      const data = await response.json();

      // Handle different response formats
      let products = [];
      if (data.success && data.products) {
        products = data.products;
      } else if (Array.isArray(data)) {
        products = data;
      } else if (data.products && Array.isArray(data.products)) {
        products = data.products;
      }

      products = products.map((product) => normalizeProduct(this, product));

      // Fallback to mock data when API returns nothing
      if (!products.length) {
        const searchLower = query.toLowerCase();
        products = MOCK_PRODUCTS.filter((product) => {
          const name = (product.name || "").toLowerCase();
          const category = (product.category || "").toLowerCase();
          const sku = (product.sku || "").toLowerCase();
          return (
            name.includes(searchLower) ||
            category.includes(searchLower) ||
            sku.includes(searchLower)
          );
        }).map((product) => normalizeProduct(this, product));
      }

      // Limit results
      return products.slice(0, limit);
    } catch (error) {
      console.error("Error searching products in inventory:", error);
      return MOCK_PRODUCTS.map((product) => normalizeProduct(this, product))
        .filter((product) =>
          product.displayName.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, limit);
    }
  }

  // Update inventory when a sale is made
  async recordSale(saleData) {
    try {
      // Try to update stock for the sold product
      const response = await fetch(
        `${INVENTORY_API_BASE}/products/${saleData.product_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stock_quantity_change: -saleData.quantity, // Negative to subtract
          }),
        },
      );

      const data = await response.json();

      // Handle different response formats
      if (data.success !== false) {
        return { success: true, data };
      }

      throw new Error(data.error || "Failed to update inventory");
    } catch (error) {
      console.error("Error recording sale in inventory:", error);
      // Don't throw - allow sale to proceed even if inventory update fails
      return { success: false, error: error.message };
    }
  }

  // Get low stock products
  async getLowStockProducts() {
    try {
      const response = await fetch(
        `${INVENTORY_API_BASE}/integration/low-stock`,
      );
      const data = await response.json();

      // Handle different response formats
      let products = [];
      if (data.success && data.low_stock_products) {
        products = data.low_stock_products;
      } else if (data.success && data.products) {
        products = data.products;
      } else if (Array.isArray(data)) {
        products = data;
      } else if (data.products && Array.isArray(data.products)) {
        products = data.products;
      }

      // Normalize and return
      const normalized = products.map((product) =>
        normalizeProduct(this, product),
      );

      return normalized;
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      return MOCK_PRODUCTS.filter(
        (product) => product.stock_quantity <= product.min_stock_level,
      ).map((product) => normalizeProduct(this, product));
    }
  }

  // Get enriched product data for sales
  async getEnrichedProduct(productId) {
    try {
      const [product, availability] = await Promise.all([
        this.getProduct(productId),
        this.checkAvailability(productId),
      ]);

      return {
        ...product,
        availability: availability,
        canSell: availability.is_available && availability.is_active,
      };
    } catch (error) {
      console.error("Error getting enriched product data:", error);
      throw error;
    }
  }

  // Validate sale against inventory
  async validateSale(productId, quantity) {
    try {
      const availability = await this.checkAvailability(productId);

      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      // Check if product is active
      if (!availability.is_active) {
        validation.isValid = false;
        validation.errors.push("Product is not active");
      }

      // Check if product is available
      if (!availability.is_available) {
        validation.isValid = false;
        validation.errors.push("Product is out of stock");
      }

      // Check if enough quantity is available
      if (availability.current_stock < quantity) {
        validation.isValid = false;
        validation.errors.push(
          `Insufficient stock. Available: ${availability.current_stock}, Requested: ${quantity}`,
        );
      }

      // Check for low stock warning
      if (availability.is_low_stock) {
        validation.warnings.push(
          `Low stock warning: Only ${availability.current_stock} units remaining`,
        );
      }

      return validation;
    } catch (error) {
      console.error("Error validating sale:", error);
      return {
        isValid: false,
        errors: [`Unable to validate sale: ${error.message}`],
        warnings: [],
      };
    }
  }

  // Health check for inventory system
  async healthCheck() {
    try {
      const response = await fetch(HEALTH_ENDPOINT);
      const data = await response.json();

      if (typeof data.success === "boolean") {
        return data.success;
      }

      if (typeof data.status === "string") {
        return ["ok", "healthy", "success"].includes(data.status.toLowerCase());
      }

      return response.ok;
    } catch (error) {
      console.error("Inventory system health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export default new InventoryIntegrationService();
