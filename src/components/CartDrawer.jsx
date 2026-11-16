import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';

export default function CartDrawer({ open, items, total, onClose, onUpdateQty, onUpdateNote, onRemove }) {
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div><p>YOUR SELECTION</p><h2>سلة الطلب</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="إغلاق السلة"><X size={22} /></button>
        </div>

        <div className="drawer-items">
          {!items.length && (
            <div className="empty-cart"><ShoppingBag size={34} strokeWidth={1.2} /><h3>السلة لسه فاضية</h3><p>اختار مشروبك أو البن المفضل، وهنجهّز طلبك.</p><button type="button" onClick={onClose}>كمّل تصفح</button></div>
          )}
          {items.map((item) => (
            <article className="drawer-item" key={item.id}>
              <div className={`drawer-item-image ${!item.image ? 'drink-placeholder' : ''}`}>
                {item.image ? <img src={item.image} alt="" /> : <span>☕</span>}
              </div>
              <div className="drawer-item-content">
                <div className="drawer-item-top">
                  <div><h3>{item.arName || item.name}</h3><p>{item.size ? `${item.name} · ${item.size} · ${item.roast} · ${item.type}` : item.name}</p></div>
                  <strong>{item.price * item.qty} <small>ج.م</small></strong>
                </div>
                <div className="drawer-item-actions">
                  <div className="qty-control small"><button type="button" onClick={() => onUpdateQty(item.id, -1)}><Minus size={13} /></button><span>{item.qty}</span><button type="button" onClick={() => onUpdateQty(item.id, 1)}><Plus size={13} /></button></div>
                  <button className="remove-item" type="button" onClick={() => onRemove(item.id)} aria-label="حذف"><Trash2 size={15} /></button>
                </div>
                <input value={item.note || ''} onChange={(event) => onUpdateNote(item.id, event.target.value)} placeholder="ملاحظة على المنتج (اختياري)" />
              </div>
            </article>
          ))}
        </div>

        <div className="drawer-footer">
          <div><span>الإجمالي</span><strong>{total.toLocaleString('ar-EG')} <small>ج.م</small></strong></div>
          <a className={`button button-gold ${!items.length ? 'disabled' : ''}`} href={items.length ? '#order' : undefined} onClick={items.length ? onClose : undefined}>إتمام الطلب <ArrowLeft size={17} /></a>
          <p>الطلب بيتأكد معاك مباشرة على واتساب.</p>
        </div>
      </aside>
    </>
  );
}
