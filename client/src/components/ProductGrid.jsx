import ProductCard from './ProductCard';
import Loader from './Loader';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({
  products = [],
  loading = false,
  emptyMessage = 'No products found.',
}) {
  if (loading) {
    return (
      <div className="product-grid-loading">
        <Loader size="md" text="Loading products..." />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <PackageOpen size={48} className="empty-state-icon" />
        <p className="empty-state-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
