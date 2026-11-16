import { createElement, useMemo, useState } from 'react';
import { Banknote, Bike, Check, Clock3, Coffee, Smartphone, Upload } from 'lucide-react';
import { PAYMENT_NUMBER } from '../data/catalog';
import { createOrder } from '../services/orderService';

const paymentOptions = [
  { id: 'vodafone', name: 'Vodafone Cash', desc: 'تحويل مباشر على المحفظة', icon: Smartphone },
  { id: 'instapay', name: 'InstaPay', desc: 'تحويل من تطبيق إنستاباي', icon: Smartphone },
  { id: 'cod', name: 'الدفع عند الاستلام', desc: 'كاش وقت وصول الطلب', icon: Banknote },
];

export default function CheckoutSection({ items, total, onSuccess }) {
  const defaultPickup = useMemo(() => {
    const date = new Date(Date.now() + 30 * 60 * 1000);
    return date.toTimeString().slice(0, 5);
  }, []);
  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', pickup: defaultPickup });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [proof, setProof] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!items.length) return setError('السلة فاضية — اختار مشروب أو منتج الأول.');
    if (!form.name.trim() || (orderType === 'delivery' && (!form.phone.trim() || !form.address.trim()))) return setError('كمّل بياناتك علشان نعرف نجهّز ونوصل الطلب.');
    if (!payment) return setError('اختار طريقة الدفع المناسبة ليك.');
    if (payment !== 'cod' && !proof) return setError('ارفع صورة إثبات التحويل علشان نقدر نراجع الطلب.');
    setError('');
    const order = { items, orderType, form, payment, total };
    try {
      const saved = await createOrder({ ...order, proof });
      setOrderNumber(saved.orderNumber);
      setDone(true);
      onSuccess();
    } catch (submitError) { setError(submitError.message); }
  };

  return (
    <section className="checkout-section section" id="order">
      <div className="checkout-layout shell">
        <div className="checkout-intro">
          <p className="eyebrow light">خطوة أخيرة</p>
          <h2 className="display-title light-title">طلبك،<br /><em>على مزاجك.</em></h2>
          <p>كمّل بياناتك وأكد الطلب، وهيظهر عندنا مباشرة علشان نبدأ تجهيزه.</p>
          <div className="checkout-assurance"><Clock3 size={18} /><span><strong>تجهيز طازة</strong><small>كل طلب بيتجهّز وقت تأكيده.</small></span></div>
        </div>

        <div className="checkout-card">
          {done ? (
            <div className="order-success">
              <span><Check size={28} /></span><p className="eyebrow">رقم الطلب · {orderNumber}</p><h3>تم استلام طلبك</h3><p>طلبك اتسجل عندنا بنجاح وهنبدأ مراجعته وتجهيزه.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="checkout-card-head"><span>01</span><div><p>طريقة الاستلام</p><h3>هتاخد قهوتك إزاي؟</h3></div></div>
              <div className="delivery-options">
                <button type="button" className={orderType === 'delivery' ? 'active' : ''} onClick={() => setOrderType('delivery')}><Bike size={20} /><span><strong>توصيل</strong><small>لحد باب البيت</small></span></button>
                <button type="button" className={orderType === 'dine' ? 'active' : ''} onClick={() => setOrderType('dine')}><Coffee size={20} /><span><strong>استلام من الكافيه</strong><small>جهّزه قبل ما أوصل</small></span></button>
              </div>

              <div className="form-grid">
                <label><span>الاسم</span><input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="اسمك الكريم" /></label>
                <label><span>رقم الهاتف</span><input dir="ltr" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="01xxxxxxxxx" /></label>
                {orderType === 'delivery' ? <label className="full-field"><span>عنوان التوصيل</span><input value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="المحافظة، المنطقة، الشارع" /></label> : <label className="full-field"><span>موعد الاستلام</span><input type="time" value={form.pickup} onChange={(event) => updateForm('pickup', event.target.value)} /></label>}
              </div>

              <div className="checkout-card-head payment-head"><span>02</span><div><p>الدفع</p><h3>اختار الطريقة المناسبة</h3></div></div>
              <div className="payment-options">
                {paymentOptions.map(({ id, name, desc, icon }) => (
                  <button type="button" key={id} className={payment === id ? 'active' : ''} onClick={() => setPayment(id)}>
                    {createElement(icon, { size: 19 })}<span><strong>{id === 'cod' && orderType === 'dine' ? 'الدفع في الكافيه' : name}</strong><small>{id === 'cod' && orderType === 'dine' ? 'كاش وقت الاستلام' : desc}</small></span><i>{payment === id && <Check size={13} />}</i>
                  </button>
                ))}
              </div>
              {(payment === 'vodafone' || payment === 'instapay') && <div className="payment-number"><span>رقم التحويل</span><strong dir="ltr">{PAYMENT_NUMBER}</strong><small>احتفظ بصورة التحويل لتأكيد الطلب.</small></div>}
              {(payment === 'vodafone' || payment === 'instapay') && <label className="proof-upload"><Upload size={18} /><span><strong>{proof ? proof.name : 'ارفع صورة التحويل'}</strong><small>PNG أو JPG أو WebP — بحد أقصى 5MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProof(event.target.files?.[0] || null)} /></label>}

              <div className="order-review">
                <div className="order-review-items"><p>طلبك ({items.reduce((sum, item) => sum + item.qty, 0)})</p>{items.slice(0, 3).map((item) => <span key={item.id}>{item.arName || item.name} × {item.qty}</span>)}{items.length > 3 && <small>+ {items.length - 3} منتجات أخرى</small>}</div>
                <div className="order-review-total"><span>الإجمالي</span><strong>{total.toLocaleString('ar-EG')} <small>ج.م</small></strong></div>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark checkout-submit" type="submit">تأكيد الطلب <span>↙</span></button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
