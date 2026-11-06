import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import productService from '../services/productService';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Sports', 'Books'];

const SORT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const sortParam = searchParams.get('sort') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search field input
  const [searchInput, setSearchInput] = useState(searchParam);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync search input when URL changes externally (e.g. from Navbar)
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const updateFilters = useCallback(
    (newFilters) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(newFilters).forEach(([key, val]) => {
        if (!val || val === 'All' || val === '') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, val);
        }
      });

      // Reset to page 1 unless specifically setting the page
      if (!('page' in newFilters)) {
        nextParams.delete('page');
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageParam,
        limit: 12,
      };

      if (searchParam) params.search = searchParam;
      if (categoryParam && categoryParam !== 'All') params.category = categoryParam;
      if (sortParam) params.sort = sortParam;

      const response = await productService.getProducts(params);
      const data = response?.data;

      if (data && Array.isArray(data.products)) {
        setProducts(data.products.filter((p) => !p.isDeleted));
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setProducts(data.filter((p) => !p.isDeleted));
        setTotalPages(1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, categoryParam, sortParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilters({ search: '' });
  };

  const handleCategoryChange = (cat) => {
    updateFilters({ category: cat });
  };

  const handleSortChange = (sortVal) => {
    updateFilters({ sort: sortVal });
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(newPage));
    }
    setSearchParams(nextParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchParam || (categoryParam && categoryParam !== 'All') || sortParam;

  const handleResetAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="container page products-page">
      <div className="page-header">
        <h1>All Products</h1>
        <p className="text-muted">
          Browse our catalog of high-quality items with instant filtering and sorting.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="filter-bar card">
        <form onSubmit={handleSearchSubmit} className="filter-search-form">
          <div className="search-input-wrapper">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filter by keyword..."
              className="filter-search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Search size={16} />
            Search
          </button>
        </form>

        <div className="filter-dropdowns">
          <div className="filter-control-group">
            <label htmlFor="category-select" className="filter-label">
              <Filter size={14} /> Category:
            </label>
            <select
              id="category-select"
              value={categoryParam}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="filter-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-control-group">
            <label htmlFor="sort-select" className="filter-label">
              Sort By:
            </label>
            <select
              id="sort-select"
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              className="filter-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-secondary filter-reset-btn"
              onClick={handleResetAll}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Content */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchProducts} />
      ) : (
        <>
          <ProductGrid
            products={products}
            loading={loading}
            emptyMessage={
              hasActiveFilters
                ? 'No products matched your search or filters. Try adjusting them.'
                : 'No products are currently in the catalog.'
            }
          />

          {!loading && (
            <Pagination
              currentPage={pageParam}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
