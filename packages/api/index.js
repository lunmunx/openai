import express from 'express';
import { normalizeProducts } from '@price-comparer/ingestion';

const app = express();
app.use(express.json());

// Placeholder in-memory store
const products = [];

app.get('/compare', (req, res) => {
  const { ean } = req.query;
  const filtered = products.filter(p => p.ean === ean);
  res.json(filtered);
});

app.get('/search', (req, res) => {
  const { q } = req.query;
  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(filtered);
});

app.post('/watch', (req, res) => {
  // TODO: implement webhook watch logic
  res.json({ status: 'not_implemented' });
});

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
