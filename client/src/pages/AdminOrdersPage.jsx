import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Filter,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import orderService from '../services/orderService';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

// State machine transitions as specified in backend API contract
const TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const ALL_STATUSES = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      const response = await orderService.getAllOrders(params);
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
      console.error('Failed to fetch admin orders:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus) return;
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      showFeedback('success', `Order #${orderId.slice(-8)} updated to ${newStatus}.`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container page admin-orders-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin" className="back-link mb-2 inline-flex">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Customer Orders</h1>
          <p className="text-muted">Review, confirm, ship, and update customer order fulfillment.</p>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} mt-2`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Status Filter */}
      <div className="card admin-controls-card">
        <div className="admin-filter-group">
          <label htmlFor="order-status-filter" className="filter-label">
            <Filter size={15} /> Filter by Order Status:
          </label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="page-loader-wrapper">
          <Loader size="lg" text="Loading customer orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No orders found matching this filter.</p>
        </div>
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Current Status</th>
                <th>Update Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const total = order.totalAmount ?? order.total ?? 0;
                const dateStr = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A';

                const customerName =
                  order.user?.name ||
                  order.shippingAddress?.name ||
                  'Customer';
                const customerContact =
                  order.user?.email ||
                  order.shippingAddress?.phone ||
                  '';

                const nextAllowedStatuses = TRANSITIONS[order.status] || [];
                const isFinalState = nextAllowedStatuses.length === 0;
                const isUpdating = updatingId === order._id;

                return (
                  <tr key={order._id}>
                    <td>
                      <span className="order-code">#{order._id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="admin-customer-info">
                        <strong>{customerName}</strong>
                        {customerContact && (
                          <span className="text-muted text-xs">{customerContact}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{dateStr}</span>
                    </td>
                    <td>
                      <strong>₹{Number(total).toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      {isFinalState ? (
                        <span className="text-muted text-xs font-semibold">Finalized</span>
                      ) : (
                        <select
                          disabled={isUpdating}
                          value=""
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="status-action-select"
                        >
                          <option value="" disabled>
                            {isUpdating ? 'Updating...' : 'Change to...'}
                          </option>
                          {nextAllowedStatuses.map((st) => (
                            <option key={st} value={st}>
                              &rarr; {st}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-sm btn-secondary"
                        title="View order details"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
