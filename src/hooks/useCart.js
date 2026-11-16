import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'waqar-cart-v2';

export function useCart() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const addItem = (item) => {
    setItems((current) => {
      const found = current.find((entry) => entry.key === item.key && !entry.note);
      if (found) return current.map((entry) => entry.id === found.id ? { ...entry, qty: entry.qty + item.qty } : entry);
      return [...current, { ...item, id: `${item.key}-${Date.now()}` }];
    });
  };

  const updateQty = (id, change) => setItems((current) => current.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item));
  const updateNote = (id, note) => setItems((current) => current.map((item) => item.id === id ? { ...item, note } : item));
  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  return { items, count, total, addItem, updateQty, updateNote, removeItem, clearCart };
}
