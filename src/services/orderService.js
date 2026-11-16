import { WA_NUMBER } from '../data/catalog';

export function buildOrderMessage({ items, orderType, form, payment, total }) {
  const paymentLabels = { vodafone: 'فودافون كاش', instapay: 'InstaPay', cod: orderType === 'dine' ? 'الدفع في الكافيه' : 'الدفع عند الاستلام' };
  const lines = items.map((item) => `• ${item.name}${item.size ? ` — ${item.size} · تحميص ${item.roast} · ${item.type}` : ''} × ${item.qty} = ${item.price * item.qty} جنيه${item.note ? `\n   ملاحظة: ${item.note}` : ''}`);
  return [
    '*طلب جديد — وَقَار* ☕', '',
    `*نوع الطلب:* ${orderType === 'dine' ? 'استلام من الكافيه' : 'توصيل'}`,
    `*الاسم:* ${form.name}`,
    form.phone ? `*رقم الهاتف:* ${form.phone}` : null,
    orderType === 'dine' ? `*موعد الاستلام:* ${form.pickup}` : `*العنوان:* ${form.address}`,
    '', '*المنتجات:*', ...lines, '',
    `*طريقة الدفع:* ${paymentLabels[payment]}`,
    `*الإجمالي:* ${total.toLocaleString('ar-EG')} جنيه`,
  ].filter(Boolean).join('\n');
}

export async function submitOrderRecord({ items, orderType, form, payment, total }) {
  const payload = { orderType, ...form, payment, total, products: items.map(({ name, size, roast, type, qty, note }) => ({ name, size, roast, type, qty, note })) };
  try {
    await fetch('https://formspree.io/f/xeepznaa', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
  } catch { /* WhatsApp remains the primary order channel. */ }
}

export function openWhatsApp(message) {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
}

export async function createOrder({ items, orderType, form, payment, proof }) {
  const body = new FormData();
  body.append('customerName', form.name);
  body.append('phone', form.phone || '');
  body.append('address', form.address || '');
  body.append('pickup', form.pickup || '');
  body.append('orderType', orderType);
  body.append('paymentMethod', payment);
  body.append('items', JSON.stringify(items.map((item) => ({ id: item.refId, type: item.itemType, qty: item.qty, size: item.size, roast: item.roast, grindType: item.type, note: item.note || '' }))));
  if (proof) body.append('proof', proof);
  const response = await fetch('/api/orders', { method: 'POST', body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'تعذر تسجيل الطلب.');
  return data;
}
