# Review Guardian

Web app for AI-summarized Amazon product reviews. The landing page describes
the service (review summarization + fake-review detection) and has a search
bar to look up a product by its Amazon ASIN; the product page shows the
AI summary, the trust-adjusted rating, and the full list of scored reviews.

## Development

You need Node.js (or Bun) installed.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install     # or: npm install
bun run dev     # or: npm run dev
```

Copy `.env.example` to `.env` and point `VITE_API_URL` at your running
backend (see the `backend/` project) before starting the dev server.
