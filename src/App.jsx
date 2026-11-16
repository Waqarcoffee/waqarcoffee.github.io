import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import BrandStory from './components/BrandStory';
import MenuSection from './components/MenuSection';
import RoasterySection from './components/RoasterySection';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutSection from './components/CheckoutSection';
import Footer from './components/Footer';
import { useCart } from './hooks/useCart';
import { menuCategories as fallbackMenu, products as fallbackProducts, socials as fallbackSocials } from './data/catalog';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <Suspense fallback={<div className="admin-loading"><span>وَقَار</span><p>جاري تحميل لوحة الإدارة…</p></div>}><AdminApp /></Suspense>;
  return <Storefront />;
}

function Storefront() {
  const cart = useCart();
  const [content, setContent] = useState({ menuCategories: fallbackMenu, products: fallbackProducts, socials: fallbackSocials, settings: {} });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef();

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => { fetch('/api/content').then((response) => response.ok ? response.json() : Promise.reject()).then(setContent).catch(() => {}); }, []);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', Boolean(selectedProduct) || cartOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [selectedProduct, cartOpen]);

  const addDrink = ({ category, item, index }) => {
    const normalized = Array.isArray(item) ? { ar: item[0], en: item[1], price: item[2], id: `${category.id}-${index}` } : item;
    const { ar, en, price, id } = normalized;
    cart.addItem({ key: `drink-${id}`, refId: id, itemType: 'menu', name: en, arName: ar, price, qty: 1, note: '' });
    notify(`${ar} اتضاف للسلة`);
  };

  const addProduct = (item) => {
    cart.addItem(item);
    notify(`${item.arName} اتضافت للسلة`);
    setCartOpen(true);
  };

  return (
    <>
      <Header cartCount={cart.count} onOpenCart={() => setCartOpen(true)} />
      <main>
        <Hero settings={content.settings} />
        <BrandStory />
        <MenuSection categories={content.menuCategories} onAddDrink={addDrink} />
        <RoasterySection products={content.products} onSelectProduct={setSelectedProduct} />
        <CheckoutSection items={cart.items} total={cart.total} onSuccess={cart.clearCart} />
      </main>
      <Footer settings={content.settings} socials={content.socials} />

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addProduct} />
      <CartDrawer open={cartOpen} items={cart.items} total={cart.total} onClose={() => setCartOpen(false)} onUpdateQty={cart.updateQty} onUpdateNote={cart.updateNote} onRemove={cart.removeItem} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status"><Check size={16} />{toast}</div>
    </>
  );
}
