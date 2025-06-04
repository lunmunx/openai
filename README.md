# Price Comparer Prototype

This monorepo contains a very small proof-of-concept implementation of a supermarket price comparer. It is heavily simplified and does **not** implement real scraping or authentication.

## Packages

- `packages/ingestion` – placeholder ingestion library. `index.js` fetches an example JSON file and normalizes product data.
- `packages/api` – Express API with minimal `/compare`, `/search`, and `/watch` endpoints.
- `packages/ui` – simple static site served with Express.

## Development

Install dependencies and start all services:

```bash
pnpm install --recursive
node packages/api/index.js &
node packages/ui/index.js &
```

Then open `http://localhost:3001` in your browser.

**Note**: This project is a toy example and does not provide production-ready scraping or data ingestion.
