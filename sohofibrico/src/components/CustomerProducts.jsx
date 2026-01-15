import {
  ArrowLeft,
  Edit,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const CustomerProducts = () => {
  const { t } = useTranslation();
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Check for add parameter in URL
  useEffect(() => {
    const shouldAdd = searchParams.get("add");
    if (shouldAdd === "true") {
      setShowAddForm(true);
      setSearchParams({}); // Clear the add parameter
    }
  }, [searchParams, setSearchParams]);

  const formatCurrency = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      Number.isNaN(Number(amount))
    ) {
      return `0,00 ${t("currency")}`;
    }
    const locale = t("currency") === "د.م." ? "ar-MA" : "fr-MA";
    return `${new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))} ${t("currency")}`;
  };

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/customers/${customerId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  }, [customerId]);

  const fetchCustomerProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/customers/${customerId}/products`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        // If endpoint doesn't exist, use empty array
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching customer products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data);
      }
    } catch (error) {
      console.error("Error fetching available products:", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomer();
    fetchCustomerProducts();
    fetchAvailableProducts();
  }, [fetchCustomer, fetchCustomerProducts, fetchAvailableProducts]);

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/customers/${customerId}/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        setShowAddForm(false);
        fetchCustomerProducts();
      } else {
        alert(t("customerProducts.errorAdd"));
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert(t("customerProducts.errorAdd"));
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/customers/${customerId}/purchased-products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        setEditingProduct(null);
        fetchCustomerProducts();
      } else {
        alert(t("customerProducts.errorUpdate"));
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert(t("customerProducts.errorUpdate"));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(t("customerProducts.confirmDelete"))) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/customers/${customerId}/purchased-products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchCustomerProducts();
      } else {
        alert(t("customerProducts.errorDelete"));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(t("customerProducts.errorDelete"));
    }
  };

  const totalValue = products.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unit_price) || 0),
    0
  );

  const filteredProducts = products.filter((p) =>
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Product Form Component
  const ProductForm = ({ product, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      product_id: product?.product_id || "",
      product_name: product?.product_name || "",
      quantity: product?.quantity || 1,
      unit_price: product?.unit_price || 0,
      purchase_date: product?.purchase_date
        ? new Date(product.purchase_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: product?.notes || "",
      status: product?.status || "pending",
    });
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const searchTimerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Debounced product search
    useEffect(() => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (!productSearch || productSearch.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      searchTimerRef.current = setTimeout(() => {
        const filtered = availableProducts.filter(
          (p) =>
            p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(productSearch.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);

      return () => {
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current);
        }
      };
    }, [productSearch, availableProducts]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowProductDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProductSelect = (selectedProduct) => {
      setFormData({
        ...formData,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        unit_price: selectedProduct.selling_price || selectedProduct.price || 0,
      });
      setProductSearch(selectedProduct.name);
      setShowProductDropdown(false);
      setSelectedIndex(-1);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (!showProductDropdown || searchResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.slice(0, 10).length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.slice(0, 10).length) {
            handleProductSelect(searchResults[selectedIndex]);
          }
          break;
        case "Escape":
          setShowProductDropdown(false);
          setSelectedIndex(-1);
          break;
        default:
          break;
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel();
          }
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 overflow-auto rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 dark:from-emerald-700 dark:via-emerald-700 dark:to-emerald-800 p-5 rounded-t-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <ShoppingCart className="w-6 h-6 mr-2" />
                {product
                  ? t("customerProducts.editProduct")
                  : t("customerProducts.addProduct")}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors z-10 relative"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Search */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("customerProducts.productName")} *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={productSearch || formData.product_name}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                    setSelectedIndex(-1);
                    if (!e.target.value) {
                      setFormData({
                        ...formData,
                        product_id: "",
                        product_name: "",
                        unit_price: 0,
                      });
                    }
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("customerProducts.searchProduct") || "Search by name, SKU, or barcode..."}
                  className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white transition-all ${
                    formData.product_id
                      ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                  </div>
                ) : formData.product_id && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        product_id: "",
                        product_name: "",
                        unit_price: 0,
                      });
                      setProductSearch("");
                      setShowProductDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Enhanced Product Suggestions Dropdown */}
              {showProductDropdown && productSearch && productSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("common.searching") || "Searching products..."}
                      </p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {searchResults.length} {t("customerProducts.productsFound") || "products found"}
                        </p>
                      </div>
                      {searchResults.slice(0, 10).map((p, index) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProductSelect(p)}
                          className={`w-full px-4 py-3 text-left transition-all border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            index === selectedIndex
                              ? "bg-emerald-100 dark:bg-emerald-900/50"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Product Image */}
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-900 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            )}

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {p.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {p.sku && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                        SKU: {p.sku}
                                      </span>
                                    )}
                                    {p.category_name && (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                        {p.category_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {p.remaining_stock !== undefined && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        p.remaining_stock > 10
                                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                          : p.remaining_stock > 0
                                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                          : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                      }`}>
                                        {t("customerProducts.stock") || "Stock"}: {p.remaining_stock}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(p.selling_price || p.price)}
                                  </p>
                                  {p.purchase_price && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                      {formatCurrency(p.purchase_price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {p.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {searchResults.length > 10 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("customerProducts.showingFirst10") || `Showing first 10 of ${searchResults.length} results`}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                        <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("customerProducts.noProductsFound") || "No products found"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("customerProducts.tryDifferentSearch") || "Try a different search term"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("customerProducts.quantity")} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number.parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("customerProducts.unitPrice")} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_price: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("customerProducts.purchaseDate")}
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("customerProducts.status")}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">
                  {t("customerProducts.statusPending")}
                </option>
                <option value="delivered">
                  {t("customerProducts.statusDelivered")}
                </option>
                <option value="paid">{t("customerProducts.statusPaid")}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("customerProducts.notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder={t("customerProducts.notesPlaceholder")}
              />
            </div>

            {/* Total Display */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("customerProducts.total")}
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(formData.quantity * formData.unit_price)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-300 font-semibold"
              >
                {product ? t("common.update") : t("common.add")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "delivered":
        return t("customerProducts.statusDelivered");
      case "paid":
        return t("customerProducts.statusPaid");
      default:
        return t("customerProducts.statusPending");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-900" />
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 absolute top-0 left-0" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 dark:from-emerald-700 dark:via-emerald-700 dark:to-emerald-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/customers/${customerId}`)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                {t("customerProducts.title")}
              </h2>
              {customer && (
                <p className="text-emerald-100 mt-1">
                  {t("customerProducts.forCustomer")}: {customer.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>{t("customerProducts.addProduct")}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("customerProducts.totalProducts")}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {products.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("customerProducts.totalQuantity")}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("customerProducts.totalValue")}
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                {t("currency")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("customerProducts.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.product")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.quantity")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.unitPrice")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.total")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.status")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("customerProducts.date")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.product_name}
                          </p>
                          {product.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(product.quantity * product.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {product.purchase_date
                        ? new Date(product.purchase_date).toLocaleDateString(
                            t("currency") === "د.م." ? "ar-MA" : "fr-FR"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-lg transition-colors"
                          title={t("common.edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
            <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t("customerProducts.noProducts")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("customerProducts.noProductsMessage")}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t("customerProducts.addProduct")}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleEditProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};

export default CustomerProducts;
