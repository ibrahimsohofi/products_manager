import { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryIntegration.js';

const SalesForm = ({ onSaleAdded, editingSale, onEditComplete }) => {
  const [formData, setFormData] = useState({
    date: editingSale?.date || new Date().toISOString().split('T')[0],
    productName: editingSale?.productName || '',
    price: editingSale?.price || '',
    quantity: editingSale?.quantity || '',
    category: editingSale?.category || '',
    product_id: editingSale?.product_id || null,
  });

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isInventoryConnected, setIsInventoryConnected] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Check inventory system connection on mount
  useEffect(() => {
    checkInventoryConnection();
  }, []);

  // Validate stock when product or quantity changes
  useEffect(() => {
    if (selectedProduct && formData.quantity && isInventoryConnected) {
      validateStock();
    }
  }, [selectedProduct, formData.quantity, isInventoryConnected]);

  const checkInventoryConnection = async () => {
    try {
      const isConnected = await inventoryService.healthCheck();
      setIsInventoryConnected(isConnected);

      if (!isConnected) {
        console.warn('Inventory system not available - operating in manual mode');
      }
    } catch (error) {
      console.error('Error checking inventory connection:', error);
      setIsInventoryConnected(false);
    }
  };

  const validateStock = async () => {
    if (!selectedProduct || !formData.quantity) return;

    setIsValidating(true);
    try {
      const validation = await inventoryService.validateSale(
        selectedProduct.id,
        Number.parseInt(formData.quantity)
      );

      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          quantity: validation.errors.join(', ')
        }));
      } else {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }

      if (validation.warnings.length > 0) {
        setWarnings(prev => ({
          ...prev,
          stock: validation.warnings.join(', ')
        }));
      } else {
        setWarnings(prev => ({ ...prev, stock: '' }));
      }
    } catch (error) {
      console.error('Error validating stock:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const searchProducts = async (query) => {
    if (!isInventoryConnected || query.length < 2) {
      setProductSuggestions([]);
      return;
    }

    try {
      const products = await inventoryService.searchProducts(query, 5);
      setProductSuggestions(products);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSuggestions([]);
    }
  };

  const selectProduct = async (product) => {
    try {
      // Get detailed product info including stock
      const enrichedProduct = await inventoryService.getEnrichedProduct(product.id);

      setSelectedProduct(enrichedProduct);
      setStockInfo(enrichedProduct.availability);

      setFormData(prev => ({
        ...prev,
        productName: product.name,
        price: product.price.toString(),
        category: product.category,
        product_id: product.id
      }));

      setShowSuggestions(false);
      setProductSuggestions([]);
    } catch (error) {
      console.error('Error selecting product:', error);
    }
  };

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, productName: value }));

    // Clear selected product if user types manually
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null);
      setStockInfo(null);
      setFormData(prev => ({ ...prev, product_id: null }));
    }

    // Search for products in inventory
    if (isInventoryConnected) {
      searchProducts(value);
    }

    // Clear errors
    if (errors.productName) {
      setErrors(prev => ({ ...prev, productName: '' }));
    }
  };

  const categories = [
    'Droguerie',
    'Sanitaire',
    'Peinture',
    'Quincaillerie',
    'Outillage',
    'Électricité',
    'Outils manuels',
    'Outils électriques',
    'Plomberie',
    'Jardinage',
    'Ménage & Entretien',
    'Sécurité',
    'Autre'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.category) newErrors.category = 'Category is required';

    // Additional validation for inventory integration
    if (isInventoryConnected && selectedProduct) {
      if (!stockInfo?.is_available) {
        newErrors.quantity = 'Product is out of stock';
      } else if (stockInfo.current_stock < Number.parseInt(formData.quantity)) {
        newErrors.quantity = `Insufficient stock. Available: ${stockInfo.current_stock}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Safe parsing to prevent NaN issues
    const safePrice = Number.parseFloat(formData.price) || 0;
    const safeQuantity = Number.parseInt(formData.quantity) || 0;
    const totalPrice = safePrice * safeQuantity;

    const saleData = {
      ...formData,
      price: safePrice,
      quantity: safeQuantity,
      totalPrice
    };

    try {
      if (editingSale) {
        // Update existing sale
        const response = await fetch(`http://localhost:3001/api/sales/${editingSale.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        });

        if (response.ok) {
          if (onEditComplete) onEditComplete();
          resetForm();
        } else {
          throw new Error('Failed to update sale');
        }
      } else {
        // Prepare sale data with integration support
        const integrationSaleData = {
          ...saleData,
          use_inventory_integration: isInventoryConnected && selectedProduct && formData.product_id
        };

        // Add new sale with automatic inventory integration
        const response = await fetch('http://localhost:3001/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(integrationSaleData)
        });

        if (response.ok) {
          const result = await response.json();

          // Check if inventory integration was successful
          if (result.inventory_integration) {
            console.log('✅ Sale created and inventory updated:', result.inventory_integration);
          } else if (result.integration_warning) {
            console.warn('⚠️ Sale created but inventory integration failed:', result.integration_warning);
          } else {
            console.log('✅ Sale created successfully');
          }

          if (onSaleAdded) onSaleAdded(saleData);
          resetForm();
        } else {
          throw new Error('Failed to create sale');
        }
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      productName: '',
      price: '',
      quantity: '',
      category: '',
      product_id: null,
    });
    setErrors({});
    setWarnings({});
    setSelectedProduct(null);
    setStockInfo(null);
    setShowSuggestions(false);
    setProductSuggestions([]);
  };

  // Safe total price calculation to prevent NaN
  const totalPrice = formData.price && formData.quantity
    ? ((Number.parseFloat(formData.price) || 0) * (Number.parseInt(formData.quantity) || 0)).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {editingSale ? 'Edit Sale' : 'Add New Sale'}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isInventoryConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isInventoryConnected ? 'Inventory Connected' : 'Manual Mode'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name
              {selectedProduct && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  ✓ From Inventory
                </span>
              )}
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleProductNameChange}
              placeholder="Search or enter product name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}

            {/* Product Suggestions Dropdown */}
            {showSuggestions && productSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {productSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.category} • Stock: {product.stock_quantity} • ${product.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock Information */}
            {stockInfo && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                  <span className={`font-medium ${stockInfo.is_low_stock ? 'text-orange-600' : 'text-green-600'}`}>
                    {stockInfo.current_stock} {selectedProduct?.unit || 'units'}
                  </span>
                </div>
                {stockInfo.is_low_stock && (
                  <p className="text-sm text-orange-600 mt-1">⚠️ Low stock warning</p>
                )}
              </div>
            )}

            {warnings.stock && (
              <p className="text-orange-500 text-sm mt-1">⚠️ {warnings.stock}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prix (MAD)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00 MAD"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantité
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catégorie
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prix Total
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-semibold">
              {totalPrice} MAD
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {editingSale ? 'Modifier la vente' : 'Ajouter une vente'}
          </button>

          {editingSale && (
            <button
              type="button"
              onClick={onEditComplete}
              className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-md transition-colors duration-200"
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 rounded-md transition-colors duration-200"
          >
            Effacer
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;
