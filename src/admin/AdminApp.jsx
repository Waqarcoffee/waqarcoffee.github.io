import { createElement, useCallback, useEffect, useState } from 'react';
import { BarChart3, Box, Check, Coffee, ExternalLink, Eye, Image, LayoutDashboard, LogOut, Menu, PackagePlus, Pencil, Plus, Save, Settings, ShoppingBag, Trash2, Upload, X } from 'lucide-react';

const labels = { overview: 'نظرة عامة', orders: 'الطلبات', products: 'المنتجات', menu: 'المنيو', settings: 'الإعدادات' };
let csrfToken = '';

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}), ...options.headers } });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ الطلب');
  return data;
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState('');
  const notify = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400); };

  useEffect(() => { api('/api/admin/session').then((data) => { csrfToken = data.csrf; setSession(data.admin); }).catch(() => setSession(null)); }, []);
  if (session === undefined) return <div className="admin-loading"><span>وَقَار</span><p>جاري تأمين لوحة الإدارة…</p></div>;
  if (!session) return <Login onLogin={(data) => { csrfToken = data.csrf; setSession(data.admin); }} />;

  const logout = async () => { await api('/api/admin/logout', { method: 'POST' }); csrfToken = ''; setSession(null); };
  return (
    <div className="admin-app" dir="rtl">
      <aside className={`admin-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="admin-brand"><strong>وَقَار</strong><span>CONTROL ROOM</span><button onClick={() => setMobileNav(false)}><X /></button></div>
        <nav>{[
          ['overview', LayoutDashboard], ['orders', ShoppingBag], ['products', Box], ['menu', Coffee], ['settings', Settings],
        ].map(([id, icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setMobileNav(false); }}>{createElement(icon, { size: 18 })}<span>{labels[id]}</span></button>)}</nav>
        <div className="admin-account"><div><span>WA</span><p><strong>مدير النظام</strong><small>{session.email}</small></p></div><button onClick={logout} aria-label="تسجيل الخروج"><LogOut size={17} /></button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><button className="admin-menu-button" onClick={() => setMobileNav(true)}><Menu /></button><div><p>WAQAR COFFEE / ADMIN</p><h1>{labels[tab]}</h1></div><a href="/" target="_blank">عرض الموقع <ExternalLink size={15} /></a></header>
        <div className="admin-content">
          {tab === 'overview' && <Overview setTab={setTab} />}
          {tab === 'orders' && <Orders notify={notify} />}
          {tab === 'products' && <Products notify={notify} />}
          {tab === 'menu' && <MenuManager notify={notify} />}
          {tab === 'settings' && <SettingsManager notify={notify} />}
        </div>
      </main>
      <div className={`admin-notice ${notice ? 'show' : ''}`}><Check size={16} />{notice}</div>
    </div>
  );
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { onLogin(await api('/api/admin/login', { method: 'POST', body: JSON.stringify(form) })); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return <div className="admin-login"><section><div className="login-mark">وَقَار<small>WAQAR COFFEE</small></div><div className="login-copy"><p>SECURE CONTROL ROOM</p><h1>إدارة وقار،<br /><em>من مكان واحد.</em></h1><span>الطلبات، المنتجات، المنيو، والمحتوى.</span></div></section><form onSubmit={submit}><p>دخول الإدارة</p><h2>أهلًا برجوعك</h2><label>البريد الإلكتروني<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" required /></label><label>كلمة المرور<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required /></label>{error && <span className="admin-error">{error}</span>}<button disabled={loading}>{loading ? 'جاري التحقق…' : 'دخول آمن'}</button><small>الجلسة مشفرة وتنتهي تلقائيًا بعد 8 ساعات.</small></form></div>;
}

function Overview({ setTab }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api('/api/admin/dashboard').then(setStats); }, []);
  const cards = stats ? [{ name: 'إجمالي الطلبات', value: stats.orders, icon: ShoppingBag }, { name: 'طلبات جديدة', value: stats.newOrders, icon: BarChart3 }, { name: 'إجمالي المبيعات', value: `${Number(stats.revenue).toLocaleString('ar-EG')} ج.م`, icon: LayoutDashboard }, { name: 'منتجات نشطة', value: stats.products, icon: Box }] : [];
  return <><div className="admin-welcome"><div><p>صباح القهوة ☕</p><h2>كل حاجة تحت السيطرة.</h2><span>تابع الطلبات وحدّث المتجر من لوحة واحدة.</span></div><button onClick={() => setTab('products')}><PackagePlus size={17} /> إضافة منتج</button></div><div className="stat-grid">{cards.map(({ name, value, icon }) => <article key={name}>{createElement(icon, { size: 20 })}<p>{name}</p><strong>{value}</strong></article>)}</div><div className="overview-grid"><article className="quick-panel"><p>إجراءات سريعة</p><button onClick={() => setTab('orders')}><ShoppingBag /> راجع الطلبات الجديدة <span>←</span></button><button onClick={() => setTab('menu')}><Coffee /> حدّث أسعار المنيو <span>←</span></button><button onClick={() => setTab('settings')}><Settings /> عدّل بيانات التواصل <span>←</span></button></article><article className="security-panel"><p>حالة الحماية</p><div><Check /><span><strong>جلسات HttpOnly</strong><small>رمز الجلسة غير متاح للمتصفح.</small></span></div><div><Check /><span><strong>CSRF + Rate Limit</strong><small>حماية عمليات الإدارة وتسجيل الدخول.</small></span></div><div><Check /><span><strong>إثباتات دفع خاصة</strong><small>لا تُعرض إلا للمستخدم المصرح.</small></span></div></article></div></>;
}

function Orders({ notify }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const load = useCallback(() => api('/api/admin/orders').then(setOrders), []);
  useEffect(() => { load(); }, [load]);
  const changeStatus = async (id, status) => { await api(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); notify('تم تحديث حالة الطلب'); load(); };
  const removeOrder = async (id) => { if (!window.confirm('حذف الطلب نهائيًا؟ لن يدخل في الحسابات بعد الحذف.')) return; await api(`/api/admin/orders/${id}`, { method: 'DELETE' }); setSelected(null); notify('تم حذف الطلب من الحسابات'); load(); };
  const statuses = { new: 'جديد', confirmed: 'تم التأكيد', preparing: 'قيد التجهيز', delivery: 'خرج للتوصيل', completed: 'مكتمل', cancelled: 'ملغي' };
  return <div className="admin-panel"><div className="panel-head"><div><p>ORDER PIPELINE</p><h2>إدارة الطلبات</h2></div><span>{orders.length} طلب</span></div><div className="table-wrap"><table><thead><tr><th>الطلب</th><th>العميل</th><th>الدفع</th><th>الإجمالي</th><th>الحالة</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><small>{new Date(`${order.created_at}Z`).toLocaleString('ar-EG')}</small></td><td>{order.customer_name}<small dir="ltr">{order.phone}</small></td><td><span className={`pay-badge ${order.payment_method}`}>{order.payment_method}</span></td><td>{order.total} ج.م</td><td><select value={order.status} onChange={(e) => changeStatus(order.id, e.target.value)}>{Object.entries(statuses).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></td><td><div className="order-actions"><button className="table-action" onClick={() => setSelected(order)} aria-label="عرض الطلب"><Eye size={16} /></button><button className="table-action delete-order" onClick={() => removeOrder(order.id)} aria-label="حذف الطلب"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!orders.length && <Empty text="مفيش طلبات لسه" />}</div>{selected && <OrderDetails order={selected} onClose={() => setSelected(null)} />}</div>;
}

function OrderDetails({ order, onClose }) { return <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="admin-modal order-details"><button className="admin-modal-close" onClick={onClose}><X /></button><p>ORDER DETAILS</p><h2>{order.order_number}</h2><div className="order-customer"><span><small>العميل</small><strong>{order.customer_name}</strong></span><span><small>الهاتف</small><strong dir="ltr">{order.phone || '—'}</strong></span><span><small>الاستلام</small><strong>{order.order_type === 'delivery' ? order.address : order.pickup}</strong></span></div><div className="detail-items">{order.items.map((item) => <div key={item.id}><span><strong>{item.name} × {item.qty}</strong><small>{Object.values(item.variant || {}).filter(Boolean).join(' · ')}</small></span><b>{item.price * item.qty} ج.م</b></div>)}</div><div className="detail-total"><span>الإجمالي</span><strong>{order.total} ج.م</strong></div>{order.proof_path && <a className="proof-link" href={`/api/admin/orders/${order.id}/proof`} target="_blank" rel="noreferrer"><Image size={17} /> عرض صورة إثبات الدفع</a>}</div></div>; }

function Products({ notify }) {
  const [products, setProducts] = useState([]); const [editing, setEditing] = useState(null);
  const load = useCallback(() => api('/api/admin/products').then(setProducts), []); useEffect(() => { load(); }, [load]);
  const remove = async (id) => { if (!window.confirm('حذف المنتج نهائيًا؟')) return; await api(`/api/admin/products/${id}`, { method: 'DELETE' }); notify('تم حذف المنتج'); load(); };
  return <div className="admin-panel"><div className="panel-head"><div><p>CATALOG</p><h2>المنتجات</h2></div><button className="primary-admin-button" onClick={() => setEditing({})}><Plus size={16} /> منتج جديد</button></div><div className="admin-products">{products.map((product) => <article key={product.id}><img src={product.image} alt="" /><div><small>{product.group === 'blends' ? 'توليفات وقار' : 'أحادية المنشأ'}</small><h3>{product.arName}</h3><p>{product.name}</p><strong>من {Math.min(...Object.values(product.sizes))} ج.م</strong></div><span className={product.active ? 'active-dot' : 'inactive-dot'}>{product.active ? 'نشط' : 'مخفي'}</span><div className="card-actions"><button onClick={() => setEditing(product)}><Pencil size={15} /></button><button onClick={() => remove(product.id)}><Trash2 size={15} /></button></div></article>)}</div>{editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); notify('تم حفظ المنتج'); load(); }} />}</div>;
}

function ProductEditor({ product, onClose, onSaved }) {
  const isNew = !product.id; const [form, setForm] = useState({ id: product.id || '', group: product.group || 'blends', name: product.name || '', arName: product.arName || '', note: product.note || '', desc: product.desc || '', sizes: JSON.stringify(product.sizes || { '125g': 65, '250g': 130 }, null, 2), roasts: (product.roasts || ['فاتح', 'وسط']).join(', '), types: (product.types || ['سادة', 'محوّج']).join(', '), active: product.active ?? true, sortOrder: product.sortOrder || 0 }); const [file, setFile] = useState(null); const [error, setError] = useState('');
  const save = async (event) => { event.preventDefault(); try { const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, key === 'roasts' || key === 'types' ? JSON.stringify(String(value).split(',').map((v) => v.trim()).filter(Boolean)) : String(value))); if (file) body.append('image', file); await api(isNew ? '/api/admin/products' : `/api/admin/products/${product.id}`, { method: isNew ? 'POST' : 'PATCH', body }); onSaved(); } catch (err) { setError(err.message); } };
  return <div className="admin-modal-backdrop"><form className="admin-modal editor-form" onSubmit={save}><button type="button" className="admin-modal-close" onClick={onClose}><X /></button><p>{isNew ? 'NEW PRODUCT' : 'EDIT PRODUCT'}</p><h2>{isNew ? 'إضافة منتج' : `تعديل ${product.arName}`}</h2><div className="editor-grid"><Field label="معرّف المنتج" value={form.id} disabled={!isNew} onChange={(v) => setForm({ ...form, id: v })} /><label>المجموعة<select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}><option value="blends">توليفات</option><option value="single">أحادية المنشأ</option></select></label><Field label="الاسم العربي" value={form.arName} onChange={(v) => setForm({ ...form, arName: v })} /><Field label="الاسم الإنجليزي" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Field label="وصف مختصر" value={form.note} onChange={(v) => setForm({ ...form, note: v })} /><Field label="ترتيب العرض" type="number" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: v })} /><label className="wide">الوصف<textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></label><label>الأسعار JSON<textarea dir="ltr" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></label><div><Field label="التحميص (بفاصلة)" value={form.roasts} onChange={(v) => setForm({ ...form, roasts: v })} /><Field label="الأنواع (بفاصلة)" value={form.types} onChange={(v) => setForm({ ...form, types: v })} /></div><label className="upload-field"><Upload /><span>{file ? file.name : 'ارفع صورة المنتج'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files[0])} /></label><label className="check-field"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> المنتج ظاهر في الموقع</label></div>{error && <span className="admin-error">{error}</span>}<button className="save-button"><Save size={16} /> حفظ المنتج</button></form></div>;
}

function MenuManager({ notify }) {
  const [categories, setCategories] = useState([]); const [newItem, setNewItem] = useState({ categoryId: 'turkish', ar: '', en: '', price: '', sortOrder: 99 });
  const load = useCallback(() => api('/api/admin/menu').then((data) => { setCategories(data); if (data[0]) setNewItem((current) => ({ ...current, categoryId: data[0].id })); }), []); useEffect(() => { load(); }, [load]);
  const update = async (categoryId, item) => { await api(`/api/admin/menu/items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ categoryId, ar: item.ar, en: item.en, price: item.price, sortOrder: 0 }) }); notify('تم تحديث المشروب'); load(); };
  const add = async (e) => { e.preventDefault(); await api('/api/admin/menu/items', { method: 'POST', body: JSON.stringify(newItem) }); setNewItem({ ...newItem, ar: '', en: '', price: '' }); notify('تمت إضافة المشروب'); load(); };
  const remove = async (id) => { await api(`/api/admin/menu/items/${id}`, { method: 'DELETE' }); notify('تم الحذف'); load(); };
  return <div className="admin-panel"><div className="panel-head"><div><p>CAFE MENU</p><h2>المنيو والأسعار</h2></div></div><form className="quick-add" onSubmit={add}><select value={newItem.categoryId} onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.ar}</option>)}</select><input placeholder="الاسم العربي" value={newItem.ar} onChange={(e) => setNewItem({ ...newItem, ar: e.target.value })} required /><input placeholder="English name" value={newItem.en} onChange={(e) => setNewItem({ ...newItem, en: e.target.value })} required /><input type="number" placeholder="السعر" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} required /><button><Plus /> إضافة</button></form><div className="menu-admin-groups">{categories.map((category) => <section key={category.id}><h3>{category.ar}<small>{category.en}</small></h3>{category.items.map((item) => <MenuRow key={item.id} item={item} onSave={(changed) => update(category.id, changed)} onDelete={() => remove(item.id)} />)}</section>)}</div></div>;
}

function MenuRow({ item, onSave, onDelete }) { const [row, setRow] = useState(item); return <div className="menu-admin-row"><input value={row.ar} onChange={(e) => setRow({ ...row, ar: e.target.value })} /><input dir="ltr" value={row.en} onChange={(e) => setRow({ ...row, en: e.target.value })} /><input type="number" value={row.price} onChange={(e) => setRow({ ...row, price: Number(e.target.value) })} /><button onClick={() => onSave(row)}><Save /></button><button onClick={onDelete}><Trash2 /></button></div>; }

function SettingsManager({ notify }) {
  const [data, setData] = useState(null); const load = useCallback(() => api('/api/admin/settings').then(setData), []); useEffect(() => { load(); }, [load]);
  if (!data) return <Empty text="جاري تحميل الإعدادات…" />;
  const saveSettings = async (e) => { e.preventDefault(); await api('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(data.settings) }); notify('تم حفظ إعدادات الموقع'); };
  const saveSocial = async (social, file) => { const body = new FormData(); body.append('name', social.name); body.append('href', social.href); body.append('active', social.active); body.append('sortOrder', social.sortOrder || 0); if (file) body.append('logo', file); await api(`/api/admin/socials/${social.id}`, { method: 'PATCH', body }); notify('تم تحديث السوشيال'); load(); };
  return <div className="settings-grid"><form className="admin-panel settings-form" onSubmit={saveSettings}><div className="panel-head"><div><p>STORE DETAILS</p><h2>بيانات الموقع</h2></div></div><Field label="اسم البراند" value={data.settings.site_name || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, site_name: v } })} /><Field label="العنوان" value={data.settings.address || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, address: v } })} /><Field label="رقم واتساب" value={data.settings.whatsapp || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, whatsapp: v } })} /><Field label="رقم التحويل" value={data.settings.payment_number || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, payment_number: v } })} /><Field label="عنوان الهيرو — السطر الأول" value={data.settings.hero_title_1 || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, hero_title_1: v } })} /><Field label="عنوان الهيرو — السطر الثاني" value={data.settings.hero_title_2 || ''} onChange={(v) => setData({ ...data, settings: { ...data.settings, hero_title_2: v } })} /><button className="save-button"><Save /> حفظ البيانات</button></form><div className="admin-panel socials-manager"><div className="panel-head"><div><p>SOCIAL PRESENCE</p><h2>السوشيال واللوجوهات</h2></div></div>{data.socials.map((social, index) => <SocialRow key={social.id} social={social} onChange={(changed) => setData({ ...data, socials: data.socials.map((s, i) => i === index ? changed : s) })} onSave={saveSocial} />)}</div></div>;
}

function SocialRow({ social, onChange, onSave }) { const [file, setFile] = useState(null); return <div className="social-admin-row"><div className="social-logo">{social.logo ? <img src={social.logo} alt="" /> : social.name.slice(0, 2)}</div><div><input value={social.name} onChange={(e) => onChange({ ...social, name: e.target.value })} /><input dir="ltr" value={social.href} onChange={(e) => onChange({ ...social, href: e.target.value })} /></div><label><Upload /><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></label><button onClick={() => onSave(social, file)}><Save /></button></div>; }
function Field({ label, value, onChange, type = 'text', disabled = false }) { return <label>{label}<input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} required /></label>; }
function Empty({ text }) { return <div className="admin-empty"><ShoppingBag /><p>{text}</p></div>; }
