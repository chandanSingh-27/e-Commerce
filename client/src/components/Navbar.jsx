import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Handle outside clicks to close user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-logo" aria-label="ShopEase Home">
          <span className="logo-accent">Shop</span>Ease
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="navbar-search-input"
            aria-label="Search products"
          />
          <button type="submit" className="navbar-search-btn" aria-label="Submit search">
            <Search size={18} />
          </button>
        </form>

        {/* Desktop Navigation */}
        <nav className="navbar-desktop-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link
            to="/products"
            className={`nav-link ${location.pathname.startsWith('/products') ? 'active' : ''}`}
          >
            Products
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link admin-nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <Shield size={16} />
              Admin
            </Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="navbar-cart-btn" aria-label="Shopping Cart">
            <ShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {/* User Section */}
          {isAuthenticated ? (
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className="user-dropdown-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <span className="user-name">{user?.name || 'Account'}</span>
                <ChevronDown size={14} className={userDropdownOpen ? 'rotate-180' : ''} />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Package size={16} />
                    <span>My Orders</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Shield size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button type="button" className="dropdown-item logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="btn btn-sm btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="navbar-mobile-controls">
          <Link to="/cart" className="navbar-cart-btn" aria-label="Shopping Cart">
            <ShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="navbar-search-input"
            />
            <button type="submit" className="navbar-search-btn" aria-label="Search">
              <Search size={18} />
            </button>
          </form>

          <nav className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link">
              Home
            </Link>
            <Link to="/products" className="mobile-nav-link">
              Products
            </Link>
            {isAdmin && (
              <Link to="/admin" className="mobile-nav-link mobile-admin-link">
                <Shield size={16} />
                Admin Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <p className="mobile-user-name">{user?.name}</p>
                  <p className="mobile-user-email">{user?.email}</p>
                </div>
                <Link to="/orders" className="mobile-nav-link">
                  <Package size={16} />
                  My Orders
                </Link>
                <button type="button" className="mobile-logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-actions">
                <Link to="/login" className="btn btn-secondary w-full">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary w-full">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
