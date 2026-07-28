import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Modulo ISOLATO (Livello A/C della skill): store + componenti Cart* +
 * order-message.ts. Rimuovendo questi file e il loro unico gancio
 * (<CartButton> nell'header di ShopLayout.astro) il resto del sito
 * (mondo 3D + catalogo) resta intatto.
 */

export interface CartItem {
  id: string;
  title: string;
  price: number;
  priceIsFrom: boolean;
  quantity: number;
  isCustom: boolean;
  /**
   * Pezzo unico: ne esiste UNO solo al mondo. Opzionale perché i carrelli già
   * salvati in localStorage prima di questo campo si reidratano senza — lì
   * `undefined` vale "non unico", che è il comportamento di prima.
   */
  isUnique?: boolean;
}

/** Un pezzo unico non può mai superare quantità 1: ce n'è uno solo. */
function capQuantity(item: { isUnique?: boolean }, quantity: number): number {
  return item.isUnique ? 1 : quantity;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: capQuantity(i, i.quantity + quantity) } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: capQuantity(item, quantity) }] });
        }
        set({ isOpen: true });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      setQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().remove(id);
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity: capQuantity(i, quantity) } : i)),
        });
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'magic-bones-cart', partialize: (state) => ({ items: state.items }) },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
