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
