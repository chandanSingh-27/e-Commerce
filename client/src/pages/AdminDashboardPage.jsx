import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';
import adminService from '../services/adminService';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getStats();
      const data = response?.data || response;
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container page page-loader-wrapper">
        <Loader size="lg" text="Loading admin analytics..." />
      </div>
    );
  }

  const totalProducts = stats?.totalProducts ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalSales = stats?.totalSales ?? stats?.revenue ?? 0;

  return (
    <div className="container page admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <span className="badge badge-confirmed mb-2">
            <Shield size={12} className="inline mr-1" /> Admin Control Center
          </span>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">High-level store performance and operational metrics.</p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/products" className="btn btn-secondary btn-sm">
            <Package size={16} /> Manage Products
          </Link>
          <Link to="/admin/orders" className="btn btn-primary btn-sm">
            <ShoppingCart size={16} /> Manage Orders
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchStats} />}

      {/* 4 Stat Cards */}
      <div className="admin-stats-grid">
        <div className="card stat-card stat-sales">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Total Sales</p>
              <h2 className="stat-value">₹{Number(totalSales).toLocaleString('en-IN')}</h2>
              <span className="stat-hint">Lifetime gross revenue</span>
            </div>
            <div className="stat-icon-wrapper sales-bg">
              <IndianRupee size={26} />
            </div>
          </div>
        </div>

        <div className="card stat-card stat-orders">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Total Orders</p>
              <h2 className="stat-value">{Number(totalOrders).toLocaleString('en-IN')}</h2>
              <span className="stat-hint">Across all statuses</span>
            </div>
            <div className="stat-icon-wrapper orders-bg">
              <ShoppingCart size={26} />
            </div>
          </div>
        </div>

        <div className="card stat-card stat-products">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Total Products</p>
              <h2 className="stat-value">{Number(totalProducts).toLocaleString('en-IN')}</h2>
              <span className="stat-hint">Active in catalog</span>
            </div>
            <div className="stat-icon-wrapper products-bg">
              <Package size={26} />
            </div>
          </div>
        </div>

        <div className="card stat-card stat-users">
          <div className="stat-card-inner">
            <div>
              <p className="stat-label">Total Users</p>
              <h2 className="stat-value">{Number(totalUsers).toLocaleString('en-IN')}</h2>
              <span className="stat-hint">Registered customers</span>
            </div>
            <div className="stat-icon-wrapper users-bg">
              <Users size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Navigation Cards */}
      <div className="admin-quick-links mt-4">
        <h2 className="section-title mb-3">Management Consoles</h2>
        <div className="quick-links-grid">
          <Link to="/admin/products" className="card quick-link-card">
            <div className="quick-link-body">
              <div className="quick-link-icon-wrap products-color">
                <Layers size={28} />
              </div>
              <div className="quick-link-meta">
                <h3>Product Inventory Management</h3>
                <p>Add new products, update pricing and inventory, soft delete or restore items.</p>
              </div>
              <ArrowRight size={20} className="quick-link-arrow" />
            </div>
          </Link>

          <Link to="/admin/orders" className="card quick-link-card">
            <div className="quick-link-body">
              <div className="quick-link-icon-wrap orders-color">
                <ShoppingCart size={28} />
              </div>
              <div className="quick-link-meta">
                <h3>Order Fulfillment & Processing</h3>
                <p>Process pending orders, update delivery statuses through valid transition states.</p>
              </div>
              <ArrowRight size={20} className="quick-link-arrow" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
