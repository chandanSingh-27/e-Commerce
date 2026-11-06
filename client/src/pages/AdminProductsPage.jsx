import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import productService from '../services/productService';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports', 'Books'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'deleted'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Feedback state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    stock: '',
    image: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Status banners
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts({
        page,
        limit: 15,
        search: searchQuery.trim() || undefined,
      });

      const data = response?.data;
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open modal for creating a new product
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Electronics',
      stock: '',
      image: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing an existing product
  const handleOpenEditModal = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price !== undefined ? String(product.price) : '',
      category: product.category || 'Electronics',
      stock: product.stock !== undefined ? String(product.stock) : '',
      image: product.image || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required.';
    if (!formData.description.trim()) errors.description = 'Description is required.';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      errors.price = 'Price must be a valid non-negative number.';
    }
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) {
      errors.stock = 'Stock count must be a non-negative integer.';
    }
    if (!formData.category) errors.category = 'Category is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
        image: formData.image.trim() || undefined,
      };

      if (modalMode === 'create') {
        await productService.createProduct(payload);
        showFeedback('success', `Product "${payload.name}" created successfully!`);
      } else {
        // Uses PATCH as explicitly mandated by API contract
        await productService.updateProduct(editingProduct._id, payload);
        showFeedback('success', `Product "${payload.name}" updated successfully!`);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete
  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete._id);
      showFeedback('success', `Product "${productToDelete.name}" marked as deleted.`);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to delete product.');
    }
  };

  // Restore Soft-deleted product
  const handleRestore = async (product) => {
    try {
      await productService.restoreProduct(product._id);
      showFeedback('success', `Product "${product.name}" restored successfully!`);
      fetchProducts();
    } catch (err) {
      console.error('Failed to restore product:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to restore product.');
    }
  };

  // Filter products locally for active vs deleted toggle if needed
  const filteredProducts = products.filter((p) => {
    if (filterStatus === 'active') return !p.isDeleted;
    if (filterStatus === 'deleted') return !!p.isDeleted;
    return true;
  });

  return (
    <div className="container page admin-products-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin" className="back-link mb-2 inline-flex">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Product Inventory</h1>
          <p className="text-muted">Manage your store catalog, edit details, and track stock.</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} mt-2`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card admin-controls-card">
        <div className="admin-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="admin-status-filters">
          <label className="filter-label">Status Filter:</label>
          <div className="status-toggle-group">
            <button
              type="button"
              className={`status-toggle-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Active ({products.filter((p) => !p.isDeleted).length})
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${filterStatus === 'deleted' ? 'active' : ''}`}
              onClick={() => setFilterStatus('deleted')}
            >
              Deleted ({products.filter((p) => p.isDeleted).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="page-loader-wrapper">
          <Loader size="lg" text="Loading product inventory..." />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No products found matching your current filter.</p>
        </div>
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id} className={p.isDeleted ? 'row-deleted' : ''}>
                  <td>
                    <img
                      src={p.image || 'https://placehold.co/50x50?text=No+Img'}
                      alt={p.name}
                      className="admin-thumb"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/50x50?text=No+Img';
                      }}
                    />
                  </td>
                  <td>
                    <div className="admin-product-name-wrap">
                      <strong className="admin-product-name">{p.name}</strong>
                      <span className="admin-product-id">ID: {p._id}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-confirmed">{p.category}</span>
                  </td>
                  <td>
                    <strong>₹{Number(p.price).toLocaleString('en-IN')}</strong>
                  </td>
                  <td>
                    <span className={`stock-indicator ${p.stock <= 0 ? 'stock-out' : 'stock-in'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    {p.isDeleted ? (
                      <span className="badge badge-cancelled">Deleted</span>
                    ) : (
                      <span className="badge badge-delivered">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenEditModal(p)}
                        title="Edit product"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      {p.isDeleted ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRestore(p)}
                          title="Restore product"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleOpenDelete(p)}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="prod-name">Product Name *</label>
                  <input
                    id="prod-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    className={formErrors.name ? 'input-error' : ''}
                    required
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="prod-desc">Description *</label>
                  <textarea
                    id="prod-desc"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe product highlights, specs, and features..."
                    className={formErrors.description ? 'input-error' : ''}
                    required
                  />
                  {formErrors.description && (
                    <span className="field-error">{formErrors.description}</span>
                  )}
                </div>

                <div className="form-row three-cols">
                  <div className="form-group">
                    <label htmlFor="prod-price">Price (₹) *</label>
                    <input
                      id="prod-price"
                      type="number"
                      min="0"
                      step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="999"
                      className={formErrors.price ? 'input-error' : ''}
                      required
                    />
                    {formErrors.price && <span className="field-error">{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-stock">Stock Quantity *</label>
                    <input
                      id="prod-stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="50"
                      className={formErrors.stock ? 'input-error' : ''}
                      required
                    />
                    {formErrors.stock && <span className="field-error">{formErrors.stock}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-cat">Category *</label>
                    <select
                      id="prod-cat"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-image">Image URL</label>
                  <input
                    id="prod-image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/images/product.jpg"
                  />
                  <small className="text-muted">
                    Leave blank to use a default placeholder image.
                  </small>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? It will be marked as inactive and removed from public listings.`}
        confirmText="Delete Product"
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
}
