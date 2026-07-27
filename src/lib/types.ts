import type { CollectionEntry } from 'astro:content';

/**
 * Le entry di astro:content contengono un `Date` (availableSince), non
 * serializzabile in modo scontato attraverso il confine server→client delle
 * isole React. Passiamo sempre questa forma "piatta" (stringa ISO) alle
 * isole, mai la CollectionEntry grezza.
 */
export type ProductData = Omit<CollectionEntry<'products'>['data'], 'availableSince'> & {
  availableSince: string;
};
export type Product = { id: string; data: ProductData };

export function toPlainProduct(entry: CollectionEntry<'products'>): Product {
  return {
    id: entry.id,
    data: { ...entry.data, availableSince: entry.data.availableSince.toISOString() },
  };
}

export const CATEGORY_LABELS: Record<ProductData['category'], string> = {
  'teschio-dipinto': 'Teschi dipinti',
  'gioiello-osso': 'Gioielli in osso',
  'arredo-rituale': 'Arredo rituale',
  candele: 'Candele',
  'cristalli-muschio': 'Cristalli & muschio',
  'tarocchi-zodiaco': 'Tarocchi & zodiaco',
};

export function formatPrice(price: number, priceIsFrom: boolean): string {
  const formatted = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
  return priceIsFrom ? `da ${formatted}` : formatted;
}
