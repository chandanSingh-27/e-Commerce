import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Check,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [imgSrc, setImgSrc] = useState('');

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProduct(id);
      const data = response?.data || response;
      if (!data || data.isDeleted) {
        setError('This product is no longer available.');
        setProduct(null);
      } else {
        setProduct(data);
        setImgSrc(data.image || 'https://placehold.co/600x500?text=No+Image');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      if (err.response?.status === 404) {
        setError('Product not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load product details.');
      }
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta) => {
    if (!product) return;
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (product.stock <= 0) return;

    setAdding(true);
    setFeedback(null);
    try {
      await addToCart(product._id, quantity);
      setFeedback({ type: 'success', message: `${quantity} item(s) added to your cart!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add product to cart.';
      setFeedback({ type: 'error', message: msg });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container page page-loader-wrapper">
        <Loader size="lg" text="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container page not-found-page">
        <ErrorMessage message={error || 'Product not found.'} onRetry={fetchProduct} />
        <Link to="/products" className="btn btn-secondary mt-4">
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const ratingValue = Number(product.rating) || 0;
  const priceDisplay = typeof product.price === 'number'
    ? `₹${product.price.toLocaleString('en-IN')}`
    : '₹0';

  return (
    <div className="container page product-detail-page">
      {/* Navigation Breadcrumb */}
      <div className="detail-breadcrumb">
        <Link to="/products" className="back-link">
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>

      <div className="product-detail-layout card">
        {/* Left: Image Container */}
        <div className="product-detail-media">
          <img
            src={imgSrc}
            alt={product.name}
            className="product-detail-image"
            onError={() => setImgSrc('https://placehold.co/600x500?text=Image+Not+Found')}
          />
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="product-detail-info">
          {product.category && (
            <span className="badge badge-confirmed detail-category-badge">
              {product.category}
            </span>
          )}

          <h1 className="detail-title">{product.name}</h1>

          {/* Rating */}
          <div className="product-card-rating detail-rating">
            <div className="product-stars">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <Star
                  key={starIndex}
                  size={18}
                  className={starIndex <= Math.round(ratingValue) ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <span className="product-rating-text">
              {ratingValue.toFixed(1)} / 5.0
            </span>
          </div>

          {/* Price */}
          <div className="detail-price-wrap">
            <span className="detail-price">{priceDisplay}</span>
            <span className="detail-tax-note">(Inclusive of all taxes)</span>
          </div>

          <hr className="detail-divider" />

          {/* Description */}
          <div className="detail-description-section">
            <h3 className="section-small-title">Description</h3>
            <p className="detail-description">{product.description || 'No description available.'}</p>
          </div>

          <hr className="detail-divider" />

          {/* Stock & Quantity */}
          <div className="detail-availability-row">
            <span className="detail-label">Availability:</span>
            <span className={`stock-indicator ${isOutOfStock ? 'stock-out' : 'stock-in'}`}>
              {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}
            </span>
          </div>

          {!isOutOfStock && (
            <div className="detail-quantity-row">
              <span className="detail-label">Quantity:</span>
              <div className="quantity-counter">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || adding}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="counter-val">{quantity}</span>
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock || adding}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {feedback && (
            <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'} mt-3`}>
              {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="detail-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg detail-add-btn"
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
            >
              <ShoppingCart size={20} />
              <span>{adding ? 'Adding to Cart...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>

          {/* Assurance bullet points */}
          <div className="detail-perks">
            <div className="perk-item">
              <Truck size={18} className="perk-icon" />
              <span>Fast Doorstep Delivery available pan-India</span>
            </div>
            <div className="perk-item">
              <ShieldCheck size={18} className="perk-icon" />
              <span>100% Genuine, Quality-checked product</span>
            </div>
            <div className="perk-item">
              <RotateCcw size={18} className="perk-icon" />
              <span>7-day easy replacement or return policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
