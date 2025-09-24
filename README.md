# AI Help Center (Next.js Edition)

A production-ready AI Help Center rebuilt with **Next.js 14**, **Tailwind CSS**, and a typed integration with Google Gemini. The app unifies a modern UI, a retrieval-augmented generation (RAG) pipeline, and Supabase-backed knowledge base ingestion so you can ship a reliable support copilot in minutes.

## Highlights

- ⚡️ **Next.js App Router** front-end with a type-safe API route – no more manual Express wiring.
- 🎨 **Tailwind CSS** design system with dark mode styling, interactive forms, and responsive layout.
- 📚 **Retrieval pipeline** reusing the SimpleRetriever and Supabase loader from the original service, exposed through a shared handler used by tests and API routes.
- 🤖 **Gemini client** capable of producing Markdown or schema-constrained JSON responses with the existing production system prompt.
- 🧪 **Vitest suite** covering request construction, retrieval ranking, Supabase normalization, and the ask handler behaviour.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file (Next.js automatically loads it) or export variables directly:

   ```env
   GEMINI_API_KEY=your-api-key
   GEMINI_MODEL=gemini-2.0-flash-001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=service-role-or-anon-key
   SUPABASE_KB_TABLE=knowledge_base
   KB_PATH=data/knowledgeBase.json
   ```

   - When `GEMINI_API_KEY` is omitted, the API returns the Gemini request payload so you can inspect prompts safely in development.
   - When Supabase credentials are missing, the retriever falls back to the bundled JSON knowledge base.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to interact with the Tailwind UI, submit questions, and preview raw responses from `/api/ask`.

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

5. **Run tests**

   ```bash
   npm test
   ```

## Project Structure

```
app/
  api/ask/route.ts       → Next.js API route backed by the shared ask handler
  layout.tsx             → Root layout with global styles
  page.tsx               → Landing page with the interactive Ask form
components/
  ask-form.tsx           → Client component that calls the API and renders JSON responses
lib/
  config.ts              → Loads environment-driven configuration
  gemini/                → Gemini client + request builder
  prompt/                → Production system prompt
  retrieval/             → SimpleRetriever and Supabase knowledge base loader
  server/ask.ts          → Zod-validated ask handler used by the API and tests
  server/runtime.ts      → Bootstraps retriever + Gemini client at module scope
```

## API Endpoint

### `POST /api/ask`

Generate an answer for a user question.

- Automatically runs lightweight keyword retrieval (top 3 matches) when `retrieved_docs` are not provided.
- Accepts an optional workspace descriptor, policy blob, and response mode (`markdown` or `json`).
- Returns either the Gemini generation response or a request preview when the API key is missing.

**Example request**

```json
{
  "question": "How do I configure the system?",
  "workspace": { "name": "Acme Support" },
  "mode": "markdown"
}
```

**Example response (no API key configured)**

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

## Deployment

The repository includes a minimal [`vercel.json`](./vercel.json). Deploy with Vercel or any Next.js-compatible platform:

```bash
npm install -g vercel
vercel deploy --prod
```

Set the same environment variables in your hosting provider to enable Supabase retrieval and Gemini generation in production.
