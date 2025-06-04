import fetch from 'node-fetch';

/**
 * Fetch product data from an endpoint.
 * For demo purposes, this uses a static JSON example.
 */
export async function fetchEsselungaProducts() {
  const url = 'https://example.com/esselunga.json'; // TODO: replace with real endpoint
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Esselunga data: ${res.status}`);
  return res.json();
}

/**
 * Normalize product fields: EAN, quantity, price per unit.
 */
export function normalizeProducts(products) {
  return products.map(p => ({
    ean: p.ean,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    price_per_unit: p.price / p.quantity
  }));
}

if (require.main === module) {
  fetchEsselungaProducts()
    .then(data => console.log(normalizeProducts(data)))
    .catch(err => console.error(err));
}
