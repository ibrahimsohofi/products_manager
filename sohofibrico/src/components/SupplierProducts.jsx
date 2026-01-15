import {
  ArrowLeft,
  Box,
  DollarSign,
  Edit,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";

const SupplierProducts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const [searchParams] = useSearchParams();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const debounceTimerRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // JAMALBRICO API URL
  const JAMALBRICO_API_URL = "http://localhost:5000";

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Check if we should open the add form from URL
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Fetch supplier info
  const fetchSupplier = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/suppliers/${supplierId}`
      );
      if (!response.ok) throw new Error("Failed to fetch supplier");
      const data = await response.json();
      setSupplier(data);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      setError(t("suppliersPage.errorFetchSuppliers"));
    }
  }, [supplierId, t]);

  // Fetch products for this supplier from JAMALBRICO
  const fetchProducts = useCallback(async () => {
    if (!supplier?.name) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("supplier", supplier.name);
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

      const response = await fetch(
        `${JAMALBRICO_API_URL}/api/products?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(t("suppliersPage.errorFetchProducts"));
    } finally {
      setLoading(false);
    }
  }, [supplier?.name, debouncedSearchTerm, t]);

  // Fetch categories from JAMALBRICO
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${JAMALBRICO_API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchSupplier();
    fetchCategories();
  }, [fetchSupplier, fetchCategories]);

  useEffect(() => {
    if (supplier?.name) {
      fetchProducts();
    }
  }, [supplier?.name, fetchProducts]);

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch(`${JAMALBRICO_API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          supplier: supplier.name,
        }),
      });
      if (!response.ok) throw new Error("Failed to add product");
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert(t("suppliersPage.errorAddProduct"));
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      const response = await fetch(
        `${JAMALBRICO_API_URL}/api/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );
      if (!response.ok) throw new Error("Failed to update product");
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert(t("suppliersPage.errorUpdateProduct"));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(t("suppliersPage.confirmDeleteProduct"))) return;

    try {
      const response = await fetch(
        `${JAMALBRICO_API_URL}/api/products/${productId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete product");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(t("suppliersPage.errorDeleteProduct"));
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
      return `0,00 ${t("currency")}`;
    }
    const locale = t("currency") === "د.م." ? "ar-MA" : "fr-MA";
    return `${new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))} ${t("currency")}`;
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, p) => sum + (p.selling_price || 0) * (p.remaining_stock || 0),
      0
    );
    const lowStock = products.filter(
      (p) => (p.remaining_stock || 0) <= (p.min_stock_level || 10)
    ).length;
    const totalProfit = products.reduce(
      (sum, p) =>
        sum +
        ((p.selling_price || 0) - (p.purchase_price || 0)) *
          (p.remaining_stock || 0),
      0
    );
    return { totalProducts, totalValue, lowStock, totalProfit };
  };

  const stats = calculateStats();

  // Modern Product Form Component
  const ProductForm = ({ product, onSubmit, onCancel }) => {
    const fileInputRef = useRef(null);
    const [uploadedImage, setUploadedImage] = useState(product?.image_url || null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
      name: product?.name || "",
      description: product?.description || "",
      category_id: product?.category_id || "",
      purchase_price: product?.purchase_price || "",
      selling_price: product?.selling_price || "",
      remaining_stock: product?.remaining_stock || "",
      min_stock_level: product?.min_stock_level || "10",
      image_url: product?.image_url || "",
    });

    const handleImageUpload = async (file) => {
      if (!file.type.startsWith("image/")) {
        alert(t("form.imageTypeError"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t("form.imageSizeError"));
        return;
      }

      setIsUploading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);

        const response = await fetch(`${JAMALBRICO_API_URL}/api/upload`, {
          method: "POST",
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imageUrl) {
            setUploadedImage(data.imageUrl);
            setFormData((prev) => ({ ...prev, image_url: data.imageUrl }));
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    };

    const handleFileChange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    };

    const removeImage = () => {
      setUploadedImage(null);
      setFormData((prev) => ({ ...prev, image_url: "" }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        remaining_stock: parseInt(formData.remaining_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        image_url: formData.image_url || null,
      });
    };

    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-emerald-700 dark:to-teal-800 p-6 rounded-t-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {product ? t("suppliersPage.editProductTitle") : t("suppliersPage.addProductTitle")}
                  </h3>
                  <p className="text-emerald-100 text-sm mt-1">
                    {t("suppliersPage.fromSupplier")}: <strong>{supplier?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.productForm.name")} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder={t("suppliersPage.productForm.namePlaceholder")}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.productForm.description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                placeholder={t("suppliersPage.productForm.descriptionPlaceholder")}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.productForm.imageUrl")}
              </label>
              <div className="space-y-4">
                {uploadedImage ? (
                  <div className="relative p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                    <img
                      src={uploadedImage}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-6 right-6 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-8 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-800">
                        <ImageIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t("form.noImageSelected") || "No image selected"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isUploading ? t("form.uploading") || "Uploading..." : t("form.chooseImage") || "Choose Image"}</span>
                  </Button>
                  {uploadedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeImage}
                      className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      <span>{t("form.removeImage") || "Remove"}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.productForm.category")} *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="">{t("suppliersPage.productForm.selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Prices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.productForm.purchasePrice")} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.productForm.sellingPrice")} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Stock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.productForm.stock")} *
                </label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.remaining_stock}
                    onChange={(e) => setFormData({ ...formData, remaining_stock: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.productForm.minStock")}
                </label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
              >
                {t("suppliersPage.form.cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {product ? t("suppliersPage.form.updateProduct") || "Update Product" : t("suppliersPage.productForm.addProduct")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && !supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-900" />
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 absolute top-0 left-0" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {t("common.loading") || "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate("/suppliers")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("common.back") || "Back to Suppliers"}</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {supplier?.name || t("suppliersPage.products")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t("suppliersPage.productsFor") || "Products from this supplier"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-700 text-white rounded-xl flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5 font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>{t("suppliersPage.addProductsButton")}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.totalProducts") || "Total Products"}
              </p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalProducts}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.totalValue") || "Total Value"}
              </p>
              <p className="text-2xl font-bold mt-2 drop-shadow-lg">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.lowStock") || "Low Stock"}
              </p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.lowStock}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <Box className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-green-500 via-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.potentialProfit") || "Potential Profit"}
              </p>
              <p className="text-2xl font-bold mt-2 drop-shadow-lg">{formatCurrency(stats.totalProfit)}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder={t("suppliersPage.searchProducts") || "Search products..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {(product.remaining_stock || 0) <= (product.min_stock_level || 10) && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                    {t("suppliersPage.lowStockBadge") || "Low Stock"}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("suppliersPage.productForm.purchasePrice")}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.purchase_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("suppliersPage.productForm.sellingPrice")}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(product.selling_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("suppliersPage.productForm.stock")}
                    </span>
                    <span className={`font-bold ${(product.remaining_stock || 0) <= (product.min_stock_level || 10) ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {product.remaining_stock || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{t("common.edit") || "Edit"}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
            <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t("suppliersPage.noProductsFound") || "No Products Found"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchTerm
              ? t("suppliersPage.noProductsSearchHint") || "Try a different search term"
              : t("suppliersPage.noProductsStartMessage") || "Start by adding products from this supplier"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{t("suppliersPage.addProductsButton")}</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <ProductForm onSubmit={handleAddProduct} onCancel={() => setShowAddForm(false)} />
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

export default SupplierProducts;
