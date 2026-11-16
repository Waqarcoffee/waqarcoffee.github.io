import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import productImage from '../assets/coffee-bag.webp';

function OptionGroup({ label, values, value, onChange }) {
  return (
    <div className="option-group">
      <p>{label}</p>
      <div>{values.map((option) => <button type="button" key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{option}</button>)}</div>
    </div>
  );
}

export default function ProductModal({ product, onClose, onAdd }) {
  const [size, setSize] = useState('');
  const [roast, setRoast] = useState('');
  const [type, setType] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setSize(Object.keys(product.sizes)[0]);
    setRoast(product.roasts[0]);
    setType(product.types[0]);
    setQty(1);
  }, [product]);

  useEffect(() => {
    if (!product) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product || !size) return null;
  const total = product.sizes[size] * qty;

  const addToCart = () => {
    onAdd({
      key: `${product.id}-${size}-${roast}-${type}`, refId: product.id, itemType: 'product',
      name: product.name, arName: product.arName, size, roast, type,
      price: product.sizes[size], qty, image: product.image || productImage, note: '',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title">
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="إغلاق"><X size={22} /></button>
        <div className="modal-product-visual">
          <span>{product.accent}</span>
          <img src={product.image || productImage} alt={`عبوة ${product.arName}`} />
          <p>ROASTED WITH INTENTION<br />MADE TO BE REMEMBERED</p>
        </div>
        <div className="modal-product-content">
          <p className="eyebrow">{product.note}</p>
          <h2 id="product-title">{product.name}</h2>
          <h3>{product.arName}</h3>
          <p className="modal-description">{product.desc}</p>
          <OptionGroup label="الوزن" values={Object.keys(product.sizes)} value={size} onChange={setSize} />
          <OptionGroup label="درجة التحميص" values={product.roasts} value={roast} onChange={setRoast} />
          <OptionGroup label="النوع" values={product.types} value={type} onChange={setType} />
          <div className="modal-buy-row">
            <div className="qty-control">
              <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="تقليل الكمية"><Minus size={16} /></button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((value) => value + 1)} aria-label="زيادة الكمية"><Plus size={16} /></button>
            </div>
            <button className="button button-dark add-product-button" type="button" onClick={addToCart}>
              <ShoppingBag size={17} /> أضف للسلة <span>{total} ج.م</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
