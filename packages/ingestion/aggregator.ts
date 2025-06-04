/* 
 * Aggregatore Prezzi Grocery – MVP
 * Linguaggio: TypeScript 5.x – Node.js 20 LTS
 * Dipendenze chiave (da installare via pnpm / npm):
 *   - axios            → HTTP client
 *   - graphql-request  → Everli GraphQL wrapper
 *   - dotenv           → env vars (solo runtime dev)
 *   - pg               → PostgreSQL driver
 *   - playwright-core  → scraping siti con login (Eurospin, Esselunga)
 *   - tesseract.js     → OCR (PDF volantini)
 *   - zx               → task runner/cron (optional)
 *
 * NB: questo file è un entry‑point semplificato che mostra
 *  – fetch prezzi Everli (storeId determinato dal CAP)
 *  – normalizzazione €/unità
 *  – persistenza in PostgreSQL (tabella prices_history)
 *  – gestione throttling e logging
 */

import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**********************
 * 1  · Configurazione *
 **********************/
const EVERLI_ENDPOINT = 'https://it.everli.com/graphql';
const POSTAL_CODE = process.env.POSTAL_CODE ?? '20833';
// Map statico storeId→nome (in produzione da DB)
const STORES: Record<string, string> = {
  '2024': 'Esselunga Monza',
  '2158': 'Carrefour Villasanta',
  '3367': 'Iperal Monza',
  // aggiungi altri storeId qui
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/************************
 * 2  · Query GraphQL    *
 ************************/
const productsSearch = gql`
  query ProductsSearch($storeId: ID!, $text: String!) {
    productsSearch(storeId: $storeId, searchText: $text, first: 50) {
      edges {
        node {
          id
          name
          brand
          price {
            price
            unitPrice
            unitSize
          }
          gtin
        }
      }
    }
  }
`;

async function fetchEverli(storeId: string, keyword = 'integrale') {
  const client = new GraphQLClient(EVERLI_ENDPOINT, {
    headers: {
      // Everli non richiede token per catalogo anonimo
      'Content-Type': 'application/json',
    },
  });
  const data = await client.request(productsSearch, {
    storeId,
    text: keyword,
  });
  return (
    data?.productsSearch?.edges || []
  ).map((e: any) => normalizeEverli(e.node, storeId));
}

/***********************************
 * 3  · Normalizzazione SKU & price *
 ***********************************/
interface NormalizedPrice {
  ean: string;
  name: string;
  brand: string;
  price: number;          // prezzo confezione
  price_per_unit: number; // €/kg o €/l già calcolato
  unit: string;           // kg, l, ecc.
  store_id: string;
  captured_at: Date;
}

function normalizeEverli(node: any, storeId: string): NormalizedPrice {
  const { gtin, name, brand, price } = node;
  return {
    ean: gtin,
    name,
    brand,
    price: price.price,
    price_per_unit: price.unitPrice,
    unit: price.unitSize,
    store_id: storeId,
    captured_at: new Date(),
  };
}

/****************************
 * 4  · Persiste nel DB      *
 ****************************/
async function savePrices(rows: NormalizedPrice[]) {
  const client = await pool.connect();
  try {
    const text = `INSERT INTO prices_history
      (ean, store_id, price, price_per_unit, unit, captured_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (ean, store_id, captured_at)
      DO NOTHING;`;
    for (const r of rows) {
      await client.query(text, [
        r.ean,
        r.store_id,
        r.price,
        r.price_per_unit,
        r.unit,
        r.captured_at,
      ]);
    }
  } finally {
    client.release();
  }
}

/***************************
 * 5  · Loop principale     *
 ***************************/
async function main() {
  for (const [storeId, label] of Object.entries(STORES)) {
    try {
      console.log(`Fetching ${label}`);
      const rows = await fetchEverli(storeId);
      await savePrices(rows);
      console.log(`→ salvati ${rows.length} SKU`);
    } catch (err) {
      console.error(`Errore store ${storeId}:`, err);
    }
  }
  await pool.end();
}

main().catch(console.error);

/**********************
 * 6  · TODO prossimi  *
 **********************/
// • Playwright login Eurospin → estrai DOM protetto e push nel DB
// • Glovo OAuth (Penny)      → fetch prodotti & prezzi JSON
// • OCR volantini (Aldi)     → parse prezzo / formato
// • Cron job (zx) ogni 5 min
// • API GraphQL + Next.js UI
