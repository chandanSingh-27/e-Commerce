import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [imgSrc, setImgSrc] = useState(
    product?.image || 'https://placehold.co/400x300?text=No+Image'
  );

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const priceDisplay = typeof product.price === 'number' 
    ? `₹${product.price.toLocaleString('en-IN')}`
    : '₹0';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    setFeedback(null);
    try {
      await addToCart(product._id, 1);
      setFeedback({ type: 'success', message: 'Added to cart!' });
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not add to cart';
      setFeedback({ type: 'error', message: msg });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  const ratingValue = Number(product.rating) || 0;

  return (
    <div className="card product-card">
      <div className="product-card-image-wrapper">
        <Link to={`/products/${product._id}`}>
          <img
            src={imgSrc}
            alt={product.name}
            className="product-card-image"
            onError={() => setImgSrc('https://placehold.co/400x300?text=Image+Not+Found')}
            loading="lazy"
          />
        </Link>
        {product.category && (
          <span className="product-card-category-tag">{product.category}</span>
        )}
      </div>

      <div className="product-card-body">
        <Link to={`/products/${product._id}`} className="product-card-title-link">
          <h3 className="product-card-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        <div className="product-card-rating">
          <div className="product-stars" aria-label={`Rating: ${ratingValue} out of 5`}>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <Star
                key={starIndex}
                size={15}
                className={starIndex <= Math.round(ratingValue) ? 'star-filled' : 'star-empty'}
              />
            ))}
          </div>
          <span className="product-rating-text">{ratingValue.toFixed(1)}</span>
        </div>

        <div className="product-card-price-row">
          <span className="product-card-price">{priceDisplay}</span>
          <span className={`stock-indicator ${isOutOfStock ? 'stock-out' : 'stock-in'}`}>
            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </span>
        </div>

        {feedback && (
          <div className={`product-card-feedback feedback-${feedback.type}`}>
            {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="product-card-actions">
          <Link to={`/products/${product._id}`} className="btn btn-sm btn-secondary product-view-btn">
            View Details
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-primary product-add-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
          >
            <ShoppingCart size={15} />
            <span>{adding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
