import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';

export default function OrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;
  const orderId = order?._id || order?.id || location.state?.orderId || 'CONFIRMED';

  return (
    <div className="container page order-success-page">
      <div className="order-success-card card">
        <div className="success-icon-wrap">
          <CheckCircle size={64} className="success-icon" />
        </div>

        <h1 className="success-title">Thank You For Your Order!</h1>
        <p className="success-subtitle">
          Your order has been placed successfully and is now being processed.
        </p>

        <div className="order-id-box">
          <span className="order-id-label">Order Reference ID:</span>
          <span className="order-id-value">#{orderId}</span>
        </div>

        {order?.shippingAddress && (
          <div className="success-shipping-info">
            <h4>Shipping To:</h4>
            <p><strong>{order.shippingAddress.name}</strong> ({order.shippingAddress.phone})</p>
            <p>{order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/orders" className="btn btn-primary">
            <Package size={18} />
            View My Orders
          </Link>
          <Link to="/products" className="btn btn-secondary">
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
