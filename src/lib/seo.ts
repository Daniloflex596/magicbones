import type { Product } from './types';

export function buildProductJsonLd(product: Product, site: URL | undefined) {
  const base = site?.toString().replace(/\/$/, '') ?? '';
  const image = product.data.images[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.data.title,
    description: product.data.seoDescription ?? product.data.description,
    sku: product.id,
    ...(image && !image.placeholder ? { image: `${base}${image.src}` } : {}),
    brand: { '@type': 'Brand', name: 'Magic Bones' },
    offers: {
      '@type': 'Offer',
      url: `${base}/negozio/${product.id}`,
      priceCurrency: 'EUR',
      price: product.data.price,
      availability:
        product.data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Magic Bones' },
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
