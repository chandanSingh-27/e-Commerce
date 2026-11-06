import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setItems([]);
      return;
    }
    setLoading(true);
    setCartError(null);
    try {
      const res = await cartService.getCart();
      const cartData = res.data || res;
      setCart(cartData);
      setItems(cartData.items || []);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setCartError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setItems([]);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await cartService.addToCart(productId, quantity);
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      await cartService.updateCartItem(productId, quantity);
      await fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await cartService.removeCartItem(productId);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    }
  };

  const clearCartLocally = () => {
    setCart(null);
    setItems([]);
  };

  // Compute total count of items in the cart
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        totalItems,
        loading,
        cartError,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCartLocally,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export default CartContext;
