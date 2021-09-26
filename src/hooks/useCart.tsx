import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Product>(`products/${productId}`);

      if (!data) throw new Error('Erro na adição do produto');

      const alreadyAdded = cart.find((p) => p.id === productId);

      if (alreadyAdded) {
        updateProductAmount({
          productId,
          amount: alreadyAdded.amount + 1,
        });
      } else {
        const newCart = [...cart, { ...data, amount: 1 }];

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const alreadyAdded = cart.find((p) => p.id === productId);

      if (!alreadyAdded) throw new Error('Erro na remoção do produto');

      const newCart = [...cart];

      var index = newCart
        .map((product) => {
          return product.id;
        })
        .indexOf(productId);

      newCart.splice(index, 1);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch (e) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0)
      return toast.error('Quantidade solicitada fora de estoque');

    try {
      const alreadyAdded = cart.find((p) => p.id === productId);

      if (!alreadyAdded)
        throw new Error('Erro na alteração de quantidade do produto');

      const { data } = await api.get<Stock>(`stock/${productId}`);

      if (data.amount < amount)
        return toast.error('Quantidade solicitada fora de estoque');

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return { ...product, amount };
        }
        return product;
      });

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch (e) {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
