import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Dumbbell,
  BookOpen,
} from 'lucide-react';
import productService from '../services/productService';
import ProductGrid from '../components/ProductGrid';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = [
  { name: 'Electronics', icon: Laptop, color: '#3b82f6' },
  { name: 'Fashion', icon: Shirt, color: '#ec4899' },
  { name: 'Home & Kitchen', icon: HomeIcon, color: '#10b981' },
  { name: 'Sports', icon: Dumbbell, color: '#f59e0b' },
  { name: 'Books', icon: BookOpen, color: '#8b5cf6' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts({ limit: 8 });
      // API response contract: { success: true, data: { products: [...], ... } } or { success: true, data: [...] }
      const productsData = response?.data?.products || response?.data || [];
      // Filter out deleted products if any
      const activeProducts = Array.isArray(productsData)
        ? productsData.filter((p) => !p.isDeleted)
        : [];
      setFeaturedProducts(activeProducts);
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError(err.response?.data?.message || 'Failed to load featured products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge">Welcome to ShopEase</span>
            <h1 className="hero-title">Shop the Latest Products</h1>
            <p className="hero-subtitle">
              Discover premium quality electronics, fashion, home essentials, books, and sports gear
              at unbeatable prices with fast pan-India delivery.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary hero-btn">
                Shop Now
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="benefits-section">
        <div className="container benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="benefit-title">Fast Delivery</h4>
              <p className="benefit-desc">Quick doorstep dispatch</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="benefit-title">Secure Payments</h4>
              <p className="benefit-desc">100% safe & protected</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 className="benefit-title">Easy Returns</h4>
              <p className="benefit-desc">Hassle-free 7-day policy</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <Headphones size={24} />
            </div>
            <div>
              <h4 className="benefit-title">24/7 Support</h4>
              <p className="benefit-desc">Dedicated assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Explore Categories</h2>
            <p className="section-subtitle">Find exactly what you are looking for</p>
          </div>
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="category-card"
              >
                <div className="category-icon" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                  <Icon size={28} />
                </div>
                <h3 className="category-name">{cat.name}</h3>
                <span className="category-link-text">Browse &rarr;</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Handpicked selection of top-selling items</p>
          </div>
          <Link to="/products" className="btn btn-secondary btn-sm">
            View All Products &rarr;
          </Link>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={fetchFeaturedProducts} />
        ) : (
          <ProductGrid
            products={featuredProducts}
            loading={loading}
            emptyMessage="No featured products currently available."
          />
        )}
      </section>
    </div>
  );
}
