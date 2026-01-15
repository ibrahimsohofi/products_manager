import {
  Building2,
  Edit,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Suppliers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const debounceTimerRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const API_URL = "http://localhost:3001/api/suppliers";

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

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAddSupplier = async (supplierData) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData),
      });
      if (!response.ok) throw new Error("Failed to add supplier");
      setShowAddForm(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert(t("suppliersPage.errorAddSupplier") || "Failed to add supplier");
    }
  };

  const handleEditSupplier = async (supplierData) => {
    try {
      const response = await fetch(`${API_URL}/${editingSupplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData),
      });
      if (!response.ok) throw new Error("Failed to update supplier");
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert(t("suppliersPage.errorUpdateSupplier") || "Failed to update supplier");
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm(t("suppliersPage.confirmDeleteSupplier") || "Are you sure you want to delete this supplier?")) return;

    try {
      const response = await fetch(`${API_URL}/${supplierId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete supplier");
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert(t("suppliersPage.errorDeleteSupplier") || "Failed to delete supplier");
    }
  };

  // Supplier Form Component
  const SupplierForm = ({ supplier, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: supplier?.name || "",
      contact_person: supplier?.contact_person || "",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
      city: supplier?.city || "",
      postal_code: supplier?.postal_code || "",
      payment_terms: supplier?.payment_terms || "Net 30",
      notes: supplier?.notes || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
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
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 dark:from-blue-700 dark:via-blue-700 dark:to-indigo-800 p-6 rounded-t-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {supplier ? t("suppliersPage.editSupplierTitle") || "Edit Supplier" : t("suppliersPage.addSupplierTitle") || "Add New Supplier"}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {supplier ? t("suppliersPage.editSupplierDesc") || "Update supplier information" : t("suppliersPage.addSupplierDesc") || "Add a new supplier to your network"}
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
            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.form.name") || "Supplier Name"} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder={t("suppliersPage.form.namePlaceholder") || "Enter supplier name"}
              />
            </div>

            {/* Contact Person & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.contactPerson") || "Contact Person"}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder={t("suppliersPage.form.contactPersonPlaceholder") || "Contact name"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.email") || "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder={t("suppliersPage.form.emailPlaceholder") || "email@example.com"}
                  />
                </div>
              </div>
            </div>

            {/* Phone & Payment Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.phone") || "Phone"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder={t("suppliersPage.form.phonePlaceholder") || "+212 XXX XXX XXX"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.paymentTerms") || "Payment Terms"}
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="Immediate">Immediate</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.form.address") || "Address"}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="2"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                  placeholder={t("suppliersPage.form.addressPlaceholder") || "Street address"}
                />
              </div>
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.city") || "City"}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder={t("suppliersPage.form.cityPlaceholder") || "City name"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("suppliersPage.form.postalCode") || "Postal Code"}
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder={t("suppliersPage.form.postalCodePlaceholder") || "12345"}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("suppliersPage.form.notes") || "Notes"}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                placeholder={t("suppliersPage.form.notesPlaceholder") || "Additional notes..."}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {supplier ? t("common.update") || "Update" : t("common.add") || "Add Supplier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900" />
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0" />
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
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t("suppliersPage.title") || "Suppliers"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t("suppliersPage.subtitle") || "Manage your supplier network"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5 font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>{t("suppliersPage.addSupplierButton") || "Add Supplier"}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.totalSuppliers") || "Total Suppliers"}
              </p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">{suppliers.length}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.activeSuppliers") || "Active"}
              </p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">{suppliers.filter(s => s.is_active !== false).length}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-500 to-pink-600 p-6 rounded-2xl shadow-xl text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {t("suppliersPage.withProducts") || "With Products"}
              </p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">0</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-300">
              <Package className="w-8 h-8" />
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
            placeholder={t("suppliersPage.searchSuppliers") || "Search suppliers..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors line-clamp-1">
                      {supplier.name}
                    </h3>
                    {supplier.contact_person && (
                      <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {supplier.contact_person}
                      </p>
                    )}
                  </div>
                  <Building2 className="w-6 h-6 text-white/60" />
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{supplier.city}</span>
                  </div>
                )}
                {supplier.payment_terms && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Payment Terms: </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.payment_terms}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => navigate(`/suppliers/${supplier.id}/products`)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t("suppliersPage.viewProducts") || "View Products"}</span>
                </button>
                <button
                  onClick={() => setEditingSupplier(supplier)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
            <Building2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t("suppliersPage.noSuppliersFound") || "No Suppliers Found"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchTerm
              ? t("suppliersPage.noSuppliersSearchHint") || "Try a different search term"
              : t("suppliersPage.noSuppliersStartMessage") || "Start by adding your first supplier"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{t("suppliersPage.addSupplierButton") || "Add Supplier"}</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <SupplierForm onSubmit={handleAddSupplier} onCancel={() => setShowAddForm(false)} />
      )}

      {editingSupplier && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleEditSupplier}
          onCancel={() => setEditingSupplier(null)}
        />
      )}
    </div>
  );
};

export default Suppliers;
