import type { CartItem } from '../stores/cartStore';

const SHOP_PHONE = '393283632440'; // +39 328 363 2440, formato wa.me (senza +)
const SHOP_EMAIL = 'magicbones111@gmail.com';

export function formatEuro(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function buildOrderText(items: CartItem[], customerName: string, customerContact: string, notes: string): string {
  const lines = [
    `Richiesta ordine Magic Bones — ${customerName || 'senza nome'}`,
    '',
    ...items.map(
      (i) =>
        `• ${i.title} × ${i.quantity} — ${formatEuro(i.price * i.quantity)}${i.isCustom ? ' (personalizzabile — da confermare)' : ''}`,
    ),
    '',
    `Totale indicativo: ${formatEuro(items.reduce((s, i) => s + i.price * i.quantity, 0))}`,
    '',
    `Contatto: ${customerContact || 'da specificare'}`,
    notes ? `Note: ${notes}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export function buildWhatsAppLink(items: CartItem[], customerName: string, customerContact: string, notes: string): string {
  const text = buildOrderText(items, customerName, customerContact, notes);
  return `https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent(text)}`;
}

export function buildMailtoLink(items: CartItem[], customerName: string, customerContact: string, notes: string): string {
  const subject = `Richiesta ordine Magic Bones — ${customerName || 'nuovo cliente'}`;
  const body = buildOrderText(items, customerName, customerContact, notes);
  return `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
