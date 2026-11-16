import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

const navItems = [
  ['القصة', '#story'], ['المنيو', '#menu'], ['المحمصة', '#roastery'], ['تواصل معنا', '#contact'],
];

export default function Header({ cartCount, onOpenCart }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner shell">
        <a className="brand-wordmark" href="#top" aria-label="وقار كوفي" onClick={closeMenu}>
          <span className="brand-ar">وَقَار</span>
          <span className="brand-en">WAQAR COFFEE</span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="القائمة الرئيسية">
          {navItems.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
          <a className="mobile-order-link" href="#order" onClick={closeMenu}>اطلب الآن</a>
        </nav>

        <div className="header-actions">
          <a className="header-order" href="#order">اطلب الآن</a>
          <button className="icon-button cart-trigger" type="button" onClick={onOpenCart} aria-label={`السلة، ${cartCount} منتجات`}>
            <ShoppingBag size={20} strokeWidth={1.6} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button className="icon-button menu-trigger" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="فتح القائمة" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
