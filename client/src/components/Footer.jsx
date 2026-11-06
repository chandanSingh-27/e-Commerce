import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="container footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="logo-accent">Shop</span>Ease
          </Link>
          <p className="footer-tagline">
            Your trusted destination for quality shopping with fast delivery and great support.
          </p>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links-list">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">All Products</Link>
            </li>
            <li>
              <Link to="/orders">My Orders</Link>
            </li>
            <li>
              <Link to="/cart">Cart</Link>
            </li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-heading">Customer Care</h4>
          <ul className="footer-links-list">
            <li><span>24/7 Support: support@shopease.com</span></li>
            <li><span>Toll Free: 1800-123-4567</span></li>
            <li><span>Pan-India Delivery</span></li>
            <li><span>Secure Payments & Easy Returns</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p>&copy; {currentYear} ShopEase. All rights reserved.</p>
          <p className="footer-privacy-text">Built with React, Vite & MERN Stack.</p>
        </div>
      </div>
    </footer>
  );
}
