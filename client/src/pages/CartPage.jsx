import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function CartPage() {
  const { items, loading, updateQuantity, removeFromCart, cartError, fetchCart } = useCart();
  const navigate = useNavigate();

  const [modifyingId, setModifyingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleUpdate = async (productId, nextQuantity) => {
    setModifyingId(productId);
    setActionError('');
    try {
      await updateQuantity(productId, nextQuantity);
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      setActionError(err.response?.data?.message || 'Could not update quantity.');
    } finally {
      setModifyingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setModifyingId(productId);
    setActionError('');
    try {
      await removeFromCart(productId);
    } catch (err) {
      console.error('Failed to remove item:', err);
      setActionError(err.response?.data?.message || 'Could not remove item.');
    } finally {
      setModifyingId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="container page page-loader-wrapper">
        <Loader size="lg" text="Loading your shopping cart..." />
      </div>
    );
  }

  const hasItems = Array.isArray(items) && items.length > 0;

  // Calculate cart subtotal from current product prices
  const validItems = items.filter((item) => item.product && !item.product.isDeleted);
  const deletedOrMissingItems = items.filter((item) => !item.product || item.product.isDeleted);

  const subtotal = validItems.reduce((acc, item) => {
    const price = Number(item.product?.price) || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const shippingCost = 0; // Free shipping
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="container page cart-page">
      <div className="page-header">
        <h1>Your Shopping Cart</h1>
        <p className="text-muted">
          Review your items before proceeding to secure checkout.
        </p>
      </div>

      {cartError && <ErrorMessage message={cartError} onRetry={fetchCart} />}
      {actionError && <ErrorMessage message={actionError} />}

      {!hasItems ? (
        <div className="empty-state cart-empty-card">
          <ShoppingBag size={56} className="empty-state-icon" />
          <h2>Your cart is empty</h2>
          <p className="empty-state-text">
            Looks like you haven't added anything to your cart yet. Explore our latest collection
            to find amazing deals.
          </p>
          <Link to="/products" className="btn btn-primary mt-4">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items List */}
          <div className="cart-items-column">
            {deletedOrMissingItems.length > 0 && (
              <div className="alert alert-warning cart-warning-alert">
                <AlertTriangle size={20} className="alert-warning-icon" />
                <div>
                  <strong>Some items are no longer available:</strong>
                  <p>
                    One or more products in your cart have been removed or discontinued. Please remove
                    them to continue.
                  </p>
                </div>
              </div>
            )}

            <div className="card cart-items-card">
              <div className="cart-items-header">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Subtotal</span>
                <span></span>
              </div>

              <div className="cart-items-list">
                {items.map((item) => {
                  const product = item.product;
                  const isItemDisabled = !product || product.isDeleted;
                  const productId = product?._id || item._id;
                  const isUpdating = modifyingId === productId;
                  const price = Number(product?.price) || 0;
                  const lineTotal = price * (item.quantity || 1);

                  return (
                    <div
                      key={item._id || productId}
                      className={`cart-item-row ${isItemDisabled ? 'item-unavailable' : ''}`}
                    >
                      {/* Product Media & Info */}
                      <div className="cart-item-product">
                        <img
                          src={product?.image || 'https://placehold.co/100x100?text=No+Img'}
                          alt={product?.name || 'Product'}
                          className="cart-item-image"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/100x100?text=No+Img';
                          }}
                        />
                        <div className="cart-item-details">
                          {isItemDisabled ? (
                            <span className="cart-item-unavailable-tag">Item Unavailable</span>
                          ) : (
                            <Link to={`/products/${productId}`} className="cart-item-name">
                              {product?.name}
                            </Link>
                          )}
                          {product?.category && (
                            <span className="cart-item-category">{product.category}</span>
                          )}
                          {product && product.stock <= 5 && product.stock > 0 && (
                            <span className="cart-item-low-stock">
                              Only {product.stock} left in stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="cart-item-price">
                        <span className="mobile-only-label">Price: </span>
                        <span>₹{price.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="cart-item-qty">
                        <span className="mobile-only-label">Quantity: </span>
                        <div className="quantity-counter counter-sm">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => handleUpdate(productId, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1 || isItemDisabled}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="counter-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={() => handleUpdate(productId, item.quantity + 1)}
                            disabled={
                              isUpdating ||
                              (product && item.quantity >= product.stock) ||
                              isItemDisabled
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Line Subtotal */}
                      <div className="cart-item-subtotal">
                        <span className="mobile-only-label">Subtotal: </span>
                        <strong>₹{lineTotal.toLocaleString('en-IN')}</strong>
                      </div>

                      {/* Remove Button */}
                      <div className="cart-item-actions">
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => handleRemove(productId)}
                          disabled={isUpdating}
                          aria-label="Remove item from cart"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cart-footer-links">
              <Link to="/products" className="btn btn-secondary btn-sm">
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Cart Summary Column */}
          <div className="cart-summary-column">
            <div className="card cart-summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Items ({validItems.length}):</span>
                  <span className="summary-value">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping:</span>
                  <span className="summary-value text-success">FREE</span>
                </div>
                <hr className="summary-divider" />
                <div className="summary-row total-row">
                  <span className="total-label">Grand Total:</span>
                  <span className="total-value">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="summary-action">
                <button
                  type="button"
                  className="btn btn-primary w-full btn-lg"
                  onClick={() => navigate('/checkout')}
                  disabled={validItems.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="summary-perks">
                <div className="perk-item-sm">
                  <ShieldCheck size={16} />
                  <span>Secure 256-bit SSL encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
