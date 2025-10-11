import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartCanteen {
  id: string;
  name: string;
}

interface CartStore {
  items: CartItem[];
  specialInstructions: string;
  canteen: CartCanteen | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setSpecialInstructions: (instructions: string) => void;
  setCanteen: (canteen: CartCanteen) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      specialInstructions: '',
      canteen: null,
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      clearCart: () => {
        set({ items: [], specialInstructions: '' });
      },
      
      setSpecialInstructions: (instructions) => {
        set({ specialInstructions: instructions });
      },

      setCanteen: (canteen) => {
        const { items } = get();
        // If switching canteens, clear cart to avoid mixing items from different canteens
        if (items.length > 0) {
          set({ canteen, items: [], specialInstructions: '' });
        } else {
          set({ canteen });
        }
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'canteen-cart',
    }
  )
);