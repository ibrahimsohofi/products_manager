// Inventory Integration Service
// Connects the sales system with the inventory management system

const INVENTORY_API_BASE = 'http://localhost:5000/api/integration';

class InventoryIntegrationService {

  // Get product information from inventory system
  async getProduct(identifier) {
    try {
      const response = await fetch(`${INVENTORY_API_BASE}/products/${identifier}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Product not found');
      }

      return data.product;
    } catch (error) {
      console.error('Error fetching product from inventory:', error);
      throw error;
    }
  }

  // Check product availability (using product endpoint data)
  async checkAvailability(productId) {
    try {
      const product = await this.getProduct(productId);

      return {
        is_available: product.remaining_stock > 0,
        is_active: true, // Products from API are already filtered as active
        current_stock: product.remaining_stock,
        is_low_stock: product.remaining_stock <= 5, // You can adjust this threshold
        product_name: product.name,
        unit: product.unit
      };
    } catch (error) {
      console.error('Error checking product availability:', error);
      throw error;
    }
  }

  // Search products in inventory
  async searchProducts(query, limit = 10) {
    try {
      const response = await fetch(`${INVENTORY_API_BASE}/products/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.products;
    } catch (error) {
      console.error('Error searching products in inventory:', error);
      throw error;
    }
  }

  // Update inventory when a sale is made
  async recordSale(saleData) {
    try {
      // Update stock for the sold product
      const response = await fetch(`${INVENTORY_API_BASE}/products/${saleData.product_id}/update-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: saleData.quantity,
          operation: 'subtract'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update inventory');
      }

      return data;
    } catch (error) {
      console.error('Error recording sale in inventory:', error);
      throw error;
    }
  }

  // Get low stock products
  async getLowStockProducts() {
    try {
      const response = await fetch(`${INVENTORY_API_BASE}/low-stock`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unable to fetch low stock products');
      }

      return data.low_stock_products;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }

  // Get enriched product data for sales
  async getEnrichedProduct(productId) {
    try {
      const [product, availability] = await Promise.all([
        this.getProduct(productId),
        this.checkAvailability(productId)
      ]);

      return {
        ...product,
        availability: availability,
        canSell: availability.is_available && availability.is_active
      };
    } catch (error) {
      console.error('Error getting enriched product data:', error);
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
        warnings: []
      };

      // Check if product is active
      if (!availability.is_active) {
        validation.isValid = false;
        validation.errors.push('Product is not active');
      }

      // Check if product is available
      if (!availability.is_available) {
        validation.isValid = false;
        validation.errors.push('Product is out of stock');
      }

      // Check if enough quantity is available
      if (availability.current_stock < quantity) {
        validation.isValid = false;
        validation.errors.push(`Insufficient stock. Available: ${availability.current_stock}, Requested: ${quantity}`);
      }

      // Check for low stock warning
      if (availability.is_low_stock) {
        validation.warnings.push(`Low stock warning: Only ${availability.current_stock} units remaining`);
      }

      return validation;
    } catch (error) {
      console.error('Error validating sale:', error);
      return {
        isValid: false,
        errors: [`Unable to validate sale: ${error.message}`],
        warnings: []
      };
    }
  }

  // Health check for inventory system
  async healthCheck() {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Inventory system health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new InventoryIntegrationService();
