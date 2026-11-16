import { useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { menuCategories as fallbackCategories } from '../data/catalog';

export default function MenuSection({ categories = fallbackCategories, onAddDrink }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const tabsRef = useRef(null);
  const active = categories.find((category) => category.id === activeId) || categories[0];
  if (!active) return null;

  const selectCategory = (id, event) => {
    setActiveId(id);
    event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <section className="menu-section section dark-section" id="menu">
      <div className="shell">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow light">من البار</p>
            <h2 className="display-title light-title">اختار مزاجك.</h2>
          </div>
          <p>كلاسيك، بارد، أو تجربة جديدة — كل مشروب بيتحضّر وقت طلبك.</p>
        </div>

        <div className="menu-tabs" role="tablist" aria-label="تصنيفات المنيو" ref={tabsRef}>
          {categories.map((category) => (
            <button key={category.id} className={activeId === category.id ? 'active' : ''} type="button" role="tab" aria-selected={activeId === category.id} onClick={(event) => selectCategory(category.id, event)}>
              <span>{category.ar}</span><small>{category.en}</small>
            </button>
          ))}
        </div>

        <div className="menu-board" key={active.id}>
          <div className="menu-board-head">
            <span className="menu-category-number">{String(categories.indexOf(active) + 1).padStart(2, '0')}</span>
            <div><p>{active.ar}</p><h3>{active.en}</h3></div>
            <span className="menu-item-count">{active.items.length} اختيار</span>
          </div>
          <div className="menu-grid">
            {active.items.map((rawItem, index) => {
              const item = Array.isArray(rawItem) ? { ar: rawItem[0], en: rawItem[1], price: rawItem[2] } : rawItem;
              return <article className="menu-item" key={item.id || `${active.id}-${item.en}`}>
                <div className="menu-item-copy"><h4>{item.ar}</h4><p>{item.en}</p></div>
                <span className="menu-rule" />
                <strong>{item.price}<small> EGP</small></strong>
                <button type="button" onClick={() => onAddDrink({ category: active, item, index })} aria-label={`أضف ${item.ar} للسلة`}><ShoppingBag size={13} /><span>أضف</span></button>
              </article>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
