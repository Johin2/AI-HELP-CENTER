# AI Help-Center

The AI Help-Center is a production-ready Node.js service that wraps Google Gemini with retrieval-augmented generation (RAG) and enforceable citation rules. It exposes a simple HTTP API that accepts end-user questions, retrieves relevant knowledge base passages, and builds a Gemini request powered by the provided system prompt.

## Features

- 📚 Lightweight keyword retriever backed by a Supabase-hosted knowledge base.
- 🤖 Gemini integration that outputs either Markdown or JSON responses using the provided RAG-centric system prompt.
- 🔐 Safety-aware defaults with optional safety settings and schema-constrained JSON mode.
- 🧪 Comprehensive test coverage for request building, retrieval, and the public API route.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` (or set variables directly):

   ```bash
   cp .env.example .env
   ```

   Required variables:

   - `SUPABASE_URL` – Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) – Key used to read the knowledge base table.

   Optional variables:

   - `PORT` – Server port (default: `3000`).
   - `GEMINI_API_KEY` – Required when you want to proxy requests to Gemini.
   - `GEMINI_MODEL` – Gemini model name (default: `gemini-2.0-flash-001`).
   - `GEMINI_BASE_URL` – Gemini API base URL (default: official REST endpoint).
   - `SUPABASE_KB_TABLE` – Supabase table that stores knowledge base entries (default: `knowledge_base`).
   - `KB_PATH` – Path to a local JSON fallback if Supabase is not configured (default: `data/knowledgeBase.json`).

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Without a configured `GEMINI_API_KEY`, the `/api/ask` endpoint returns the request payload for inspection, making local development safe and deterministic.

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

5. **Deploy to Vercel**

   The repository ships with a ready-to-use [`vercel.json`](./vercel.json) configuration and a catch-all serverless function in [`api/[[...path]].mjs`](./api/[[...path]].mjs). To deploy:

   ```bash
   npm install -g vercel
   vercel login
   vercel link
   vercel env pull            # optional: sync local .env
   vercel env add NAME VALUE  # add required env vars
   vercel deploy --prod
   ```

   The build step compiles the TypeScript sources (`npm run build`) before bundling the serverless handler. All `/api/*` requests are routed through the Express app, so the same endpoints work locally and on Vercel.

## API

### `POST /api/ask`

Generate an answer for an end-user question. The server automatically retrieves the top knowledge base passages if none are supplied.

**Request body**

```json
{
  "question": "How do I configure the system?",
  "mode": "markdown",
  "workspace": { "name": "Acme" }
}
```

**Response (without API key)**

```json
{
  "message": "Gemini API key not configured. Returning request payload for debugging.",
  "request": {
    "model": "gemini-2.0-flash-001",
    "contents": [
      { "role": "system", "parts": [{ "text": "..." }] },
      { "role": "user", "parts": [{ "text": "How do I configure the system?" }] },
      { "role": "user", "parts": [{ "text": "{\\n  ...\\n}" }] }
    ]
  }
}
```

When a `GEMINI_API_KEY` is supplied, the endpoint forwards the request to Gemini and returns the model response.

## Knowledge base

Knowledge base entries are stored in Supabase. Create a table (default name: `knowledge_base`) with at least the following columns:

| Column       | Type      | Notes                                     |
| ------------ | --------- | ----------------------------------------- |
| `id`         | `uuid`    | Primary key, returned as a string.        |
| `title`      | `text`    | Required. Used in retrieval scoring.      |
| `text`       | `text`    | Required. Full passage content.           |
| `url`        | `text`    | Required. Used for citations.             |
| `created_at` | `timestamptz` | Optional. Helps resolve conflicting docs. |

Additional metadata columns are preserved and passed through to Gemini. Populate the table with your organization’s documents to power retrieval.

If Supabase credentials are not provided, the service falls back to loading documents from `data/knowledgeBase.json`, making local development possible without a database. The simple keyword-based retriever can be replaced with an embedding-based implementation without changing the API surface.

## Testing

Run the automated test suite with:

```bash
npm test
```

Tests cover the Gemini request builder, retriever ranking, and the `/api/ask` HTTP handler.

## Project structure

```
src/
├── config.ts              # Environment & configuration helpers
├── gemini/                # Request builder and API client
├── prompt/                # System prompt used for all conversations
├── retrieval/             # Lightweight knowledge base loader and retriever
├── routes/                # Express routers
├── middleware/            # Error handling utilities
├── index.ts               # Express app factory exported for tests & serverless
└── server.ts              # Node.js runtime entrypoint for local/VM hosting
```

## License

This project is provided as-is for demonstration purposes. Adapt and secure it to match your production requirements.
