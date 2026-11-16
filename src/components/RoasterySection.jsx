import { ArrowUpLeft } from 'lucide-react';
import { products as fallbackProducts } from '../data/catalog';
import productImage from '../assets/coffee-bag.webp';

function ProductCard({ product, onSelect }) {
  const fromPrice = Math.min(...Object.values(product.sizes));
  return (
    <article className="product-card" onClick={() => onSelect(product)}>
      <div className="product-image-wrap">
        <span className="product-number">{product.accent}</span>
        <img src={product.image || productImage} alt={`عبوة ${product.arName}`} loading="lazy" />
        <button type="button" className="product-open" aria-label={`تفاصيل ${product.arName}`} onClick={(event) => { event.stopPropagation(); onSelect(product); }}><ArrowUpLeft size={19} /></button>
      </div>
      <div className="product-meta">
        <div><p>{product.note}</p><h3>{product.name}</h3><span>{product.arName}</span></div>
        <div className="product-price"><small>يبدأ من</small><strong>{fromPrice} <i>ج.م</i></strong></div>
      </div>
    </article>
  );
}

export default function RoasterySection({ products = fallbackProducts, onSelectProduct }) {
  const blends = products.filter((product) => product.group === 'blends');
  const origins = products.filter((product) => product.group === 'single');

  return (
    <section className="roastery section" id="roastery">
      <div className="shell">
        <div className="section-heading split-heading roastery-heading">
          <div><p className="eyebrow">من المحمصة</p><h2 className="display-title">البن على <em>ذوقك.</em></h2></div>
          <p>اختار التوليفة، الوزن، درجة التحميص، وسادة أو محوّج. وإحنا نجهّزه طازة لطلبك.</p>
        </div>

        <div className="collection-head"><span>Waqar Blends</span><i /><small>توليفات وقار</small></div>
        <div className="products-grid blends-grid">{blends.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />)}</div>

        <div className="collection-head origins-head"><span>Single Origin</span><i /><small>أحادية المنشأ</small></div>
        <div className="products-grid origins-grid">{origins.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />)}</div>
      </div>
    </section>
  );
}
