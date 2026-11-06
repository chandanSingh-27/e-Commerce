import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import orderService from '../services/orderService';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrder(id);
      const data = response?.data || response;
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(err.response?.data?.message || 'Could not find order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container page page-loader-wrapper">
        <Loader size="lg" text="Retrieving order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container page not-found-page">
        <ErrorMessage message={error || 'Order not found.'} onRetry={fetchOrderDetail} />
        <Link to="/orders" className="btn btn-secondary mt-4">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>
    );
  }

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const total = order.totalAmount ?? order.total ?? 0;
  const shipping = order.shippingAddress || {};

  return (
    <div className="container page order-detail-page">
      <div className="detail-breadcrumb">
        <Link to="/orders" className="back-link">
          <ArrowLeft size={16} />
          Back to My Orders
        </Link>
      </div>

      <div className="order-header-card card">
        <div className="order-title-section">
          <div>
            <span className="order-eyebrow">Order Summary</span>
            <h1 className="order-detail-id">#{order._id}</h1>
            <div className="order-meta-info">
              <span className="order-meta-item">
                <Calendar size={15} />
                {orderDate}
              </span>
            </div>
          </div>
          <div className="order-status-badge-wrap">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="order-content-grid">
        {/* Items List */}
        <div className="order-items-column">
          <div className="card order-items-card">
            <h3 className="section-small-title mb-3">Purchased Items</h3>
            <div className="order-items-list">
              {order.items?.map((item, idx) => {
                const product = item.product || {};
                const name = product.name || item.name || 'Product';
                const image = product.image || item.image || 'https://placehold.co/80x80?text=No+Img';
                const price = Number(item.price ?? product.price ?? 0);
                const qty = item.quantity || 1;
                const lineTotal = price * qty;

                return (
                  <div key={item._id || idx} className="order-item-row">
                    <img
                      src={image}
                      alt={name}
                      className="order-item-img"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/80x80?text=No+Img';
                      }}
                    />
                    <div className="order-item-info">
                      <p className="order-item-name">{name}</p>
                      <p className="order-item-qty-price">
                        {qty} &times; ₹{price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="order-item-total">
                      <strong>₹{lineTotal.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="summary-divider mt-4" />

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">₹{Number(total).toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value text-success">FREE</span>
              </div>
              <hr className="summary-divider" />
              <div className="summary-row total-row">
                <span className="total-label">Total Amount:</span>
                <span className="total-value">₹{Number(total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address & Delivery Details */}
        <div className="order-meta-column">
          <div className="card order-address-card">
            <div className="address-card-header">
              <MapPin size={20} className="address-icon" />
              <h3>Shipping Address</h3>
            </div>
            <div className="address-details">
              <p className="address-name">{shipping.name || 'Recipient'}</p>
              <p className="address-phone">Phone: {shipping.phone || 'N/A'}</p>
              <p className="address-line">{shipping.addressLine}</p>
              <p className="address-locality">
                {shipping.city}, {shipping.state} - {shipping.pincode}
              </p>
            </div>
          </div>

          <div className="card order-payment-card mt-3">
            <div className="address-card-header">
              <CreditCard size={20} className="address-icon" />
              <h3>Payment Status</h3>
            </div>
            <div className="payment-details">
              <p>Method: <strong>Cash on Delivery (COD)</strong></p>
              <p className="mt-1">
                Status:{' '}
                <span className={order.status === 'Delivered' ? 'text-success' : 'text-warning'}>
                  {order.status === 'Delivered' ? 'Paid upon delivery' : 'Payment pending on delivery'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
