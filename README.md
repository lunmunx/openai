# Price Comparer Prototype

This monorepo contains a small proof-of-concept implementation of a supermarket price comparer. Some modules are placeholders and do **not** implement real scraping or authentication.

## Packages

- `packages/ingestion` – data ingestion utilities. `aggregator.ts` shows a minimal Everli fetch and stores results in PostgreSQL.
- `packages/api` – Express API with minimal `/compare`, `/search`, and `/watch` endpoints.
- `packages/ui` – simple static site served with Express.

## Development

Install dependencies and start all services:

```bash
pnpm install --recursive
pnpm --filter @price-comparer/ingestion start &
node packages/api/index.js &
node packages/ui/index.js &
```

Then open `http://localhost:3001` in your browser.

**Note**: This project is a toy example and does not provide production-ready scraping or data ingestion.
