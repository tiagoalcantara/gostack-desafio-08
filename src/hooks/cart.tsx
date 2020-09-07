import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (loadedProducts) {
        setProducts(JSON.parse(loadedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newValues = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newValues),
      );

      setProducts(newValues);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newValues = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      const newValuesFiltered = newValues.filter(
        product => product.quantity > 0,
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newValuesFiltered),
      );

      setProducts(newValuesFiltered);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const alreadyHasProduct = products.find(
        existentProduct => product.id === existentProduct.id,
      );
      if (alreadyHasProduct) {
        increment(product.id);
        return;
      }

      const productWithQuantity = {
        ...product,
        quantity: 1,
      };

      const newProducts = [...products, productWithQuantity];

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
