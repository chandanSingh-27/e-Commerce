import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import Loader from '../components/Loader';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCartLocally } = useCart();

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validItems = items.filter((item) => item.product && !item.product.isDeleted);

  const subtotal = validItems.reduce((acc, item) => {
    const price = Number(item.product?.price) || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const validate = () => {
    const errors = {};
    if (!shippingAddress.name.trim()) {
      errors.name = 'Full recipient name is required.';
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Contact phone number is required.';
    } else if (!/^\d{10}$/.test(shippingAddress.phone.trim().replace(/[-\s]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }
    if (!shippingAddress.addressLine.trim()) {
      errors.addressLine = 'Street address / house number is required.';
    }
    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required.';
    }
    if (!shippingAddress.state.trim()) {
      errors.state = 'State is required.';
    }
    if (!shippingAddress.pincode.trim()) {
      errors.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
      errors.pincode = 'Please enter a valid 6-digit postal pincode.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (validItems.length === 0) {
      setServerError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      // CRITICAL DESIGN DECISION:
      // Send ONLY { shippingAddress: { name, phone, addressLine, city, state, pincode } }
      // Do NOT send prices, subtotals, or item totals.
      const payload = {
        shippingAddress: {
          name: shippingAddress.name.trim(),
          phone: shippingAddress.phone.trim(),
          addressLine: shippingAddress.addressLine.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          pincode: shippingAddress.pincode.trim(),
        },
      };

      const res = await orderService.placeOrder(payload.shippingAddress);
      const placedOrder = res?.data || res;

      // Clear local cart state
      clearCartLocally();

      // Navigate to order-success page with created order details in state
      navigate('/order-success', {
        state: { order: placedOrder },
        replace: true,
      });
    } catch (err) {
      console.error('Failed to place order:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to complete order. An item might be out of stock.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (validItems.length === 0 && !submitting) {
    return (
      <div className="container page not-found-page">
        <h2>Your cart has no valid items for checkout</h2>
        <p className="text-muted">Please add products to your cart before proceeding.</p>
        <Link to="/products" className="btn btn-primary mt-4">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container page checkout-page">
      <div className="page-header">
        <h1>Checkout</h1>
        <p className="text-muted">Provide your delivery details and place your order.</p>
      </div>

      {serverError && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="checkout-layout">
        {/* Left: Shipping Address Form */}
        <div className="checkout-form-column">
          <div className="card checkout-card">
            <div className="checkout-card-header">
              <MapPin size={22} className="checkout-step-icon" />
              <div>
                <h2 className="checkout-card-title">Delivery Shipping Address</h2>
                <p className="checkout-card-subtitle">Where should we deliver your order?</p>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} id="checkout-form" noValidate>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="ship-name">Recipient Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <input
                      id="ship-name"
                      name="name"
                      type="text"
                      value={shippingAddress.name}
                      onChange={handleChange}
                      placeholder="e.g. Rohit Sharma"
                      className={fieldErrors.name ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="ship-phone">Contact Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="field-icon" />
                    <input
                      id="ship-phone"
                      name="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className={fieldErrors.phone ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ship-address">Street Address / Flat / Floor</label>
                <input
                  id="ship-address"
                  name="addressLine"
                  type="text"
                  value={shippingAddress.addressLine}
                  onChange={handleChange}
                  placeholder="Apartment 4B, Greenwood Heights, MG Road"
                  className={fieldErrors.addressLine ? 'input-error' : ''}
                  required
                />
                {fieldErrors.addressLine && (
                  <span className="field-error">{fieldErrors.addressLine}</span>
                )}
              </div>

              <div className="form-row three-cols">
                <div className="form-group">
                  <label htmlFor="ship-city">City</label>
                  <input
                    id="ship-city"
                    name="city"
                    type="text"
                    value={shippingAddress.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className={fieldErrors.city ? 'input-error' : ''}
                    required
                  />
                  {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ship-state">State</label>
                  <input
                    id="ship-state"
                    name="state"
                    type="text"
                    value={shippingAddress.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className={fieldErrors.state ? 'input-error' : ''}
                    required
                  />
                  {fieldErrors.state && <span className="field-error">{fieldErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ship-pincode">Pincode</label>
                  <input
                    id="ship-pincode"
                    name="pincode"
                    type="text"
                    maxLength={6}
                    value={shippingAddress.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    className={fieldErrors.pincode ? 'input-error' : ''}
                    required
                  />
                  {fieldErrors.pincode && (
                    <span className="field-error">{fieldErrors.pincode}</span>
                  )}
                </div>
              </div>

              <div className="payment-method-box">
                <div className="payment-header">
                  <CreditCard size={20} className="payment-icon" />
                  <div>
                    <h4>Payment Mode</h4>
                    <p className="payment-desc">Cash on Delivery / Pay on Delivery (Pre-selected)</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Review Column */}
        <div className="checkout-summary-column">
          <div className="card checkout-summary-card">
            <h3 className="summary-title">Items in Order ({validItems.length})</h3>

            <div className="checkout-items-preview">
              {validItems.map((item) => {
                const product = item.product;
                const unitPrice = Number(product?.price) || 0;
                const lineTotal = unitPrice * (item.quantity || 1);

                return (
                  <div key={item._id || product?._id} className="checkout-item-row">
                    <img
                      src={product?.image || 'https://placehold.co/60x60?text=No+Img'}
                      alt={product?.name}
                      className="checkout-item-thumb"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/60x60?text=No+Img';
                      }}
                    />
                    <div className="checkout-item-meta">
                      <p className="checkout-item-title">{product?.name}</p>
                      <p className="checkout-item-sub">
                        Qty: {item.quantity} &times; ₹{unitPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="checkout-item-price">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            <hr className="summary-divider" />

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value text-success">FREE</span>
              </div>
              <hr className="summary-divider" />
              <div className="summary-row total-row">
                <span className="total-label">Total to Pay:</span>
                <span className="total-value">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="btn btn-primary w-full btn-lg mt-4"
              disabled={submitting}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>

            <div className="checkout-security-note">
              <ShieldCheck size={16} />
              <span>Safe and encrypted transaction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
