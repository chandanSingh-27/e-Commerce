import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ExternalLink, ArrowRight, ShoppingBag } from 'lucide-react';
import orderService from '../services/orderService';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getMyOrders(page);
      const data = response?.data;

      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setTotalPages(1);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRowClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="container page orders-page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p className="text-muted">Track past shipments, order status, and view receipts.</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {loading ? (
        <div className="page-loader-wrapper">
          <Loader size="lg" text="Loading your orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <Package size={52} className="empty-state-icon" />
          <h2>No orders yet</h2>
          <p className="empty-state-text">
            You haven't placed any orders yet. Discover our latest items and get shopping!
          </p>
          <Link to="/products" className="btn btn-primary mt-4">
            <ShoppingBag size={18} />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-container">
          <div className="card table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemCount =
                    order.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) ||
                    order.items?.length ||
                    0;
                  const total = order.totalAmount ?? order.total ?? 0;
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr
                      key={order._id}
                      onClick={() => handleRowClick(order._id)}
                      className="clickable-order-row"
                    >
                      <td>
                        <span className="order-code">#{order._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td>{dateStr}</td>
                      <td>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td>
                        <strong>₹{Number(total).toLocaleString('en-IN')}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}
