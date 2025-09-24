# AI Help Center (Next.js Edition)

A production-ready AI Help Center rebuilt with **Next.js 14**, **Tailwind CSS**, and a JavaScript integration with Google Gemini. The app unifies a modern UI, a retrieval-augmented generation (RAG) pipeline, and Supabase-backed knowledge base ingestion so you can ship a reliable support copilot in minutes.

## Highlights

- ⚡️ **Next.js App Router** front-end with a well-tested API route – no more manual Express wiring.
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
   NEXTAUTH_SECRET=complex-random-string
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
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
  api/ask/route.js       → Next.js API route backed by the shared ask handler
  layout.jsx             → Root layout with global styles
  page.jsx               → Landing page with the interactive Ask form
components/
  ask-form.jsx           → Client component that calls the API and renders JSON responses
lib/
  config.js              → Loads environment-driven configuration
  gemini/                → Gemini client + request builder
  prompt/                → Production system prompt
  retrieval/             → SimpleRetriever and Supabase knowledge base loader
  server/ask.js          → Zod-validated ask handler used by the API and tests
  server/runtime.js      → Bootstraps retriever + Gemini client at module scope
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

### `POST /api/datasets`

Upload or replace knowledge base documents so the retriever stays up to date.

- Accepts a list of document objects that mirror the `RetrievedDoc` shape.
- Supports an optional `mode` flag:
  - `append` (default) upserts documents into the current store.
  - `replace` clears the existing store before inserting the new dataset.
- When Supabase credentials are configured the documents are synced to the Supabase table. Otherwise they are persisted to `data/knowledgeBase.json`.

**Example request**

```json
{
  "mode": "append",
  "documents": [
    {
      "title": "Billing policies",
      "text": "Invoices are generated on the 1st of every month.",
      "url": "https://example.com/docs/billing",
      "created_at": "2024-05-01T12:00:00Z"
    }
  ]
}
```

**Example response**

```json
{
  "message": "Dataset updated successfully.",
  "mode": "append",
  "uploaded": 1,
  "total": 6,
  "source": "file"
}
```

## SDKs

The project ships with:

- A lightweight JavaScript SDK so you can integrate the Help Center from any front-end or server without manually crafting HTTP requests. Install it globally with `npm install ai-help-center-sdk` or generate a local build using `npm run build:sdk`.
- A Python package named [`aichat`](./docs/aichat-python.md) that mirrors the TypeScript surface area for backend jobs, data pipelines, and notebook experiments.

```js
import { AiHelpCenterClient } from 'ai-help-center-sdk';

const client = new AiHelpCenterClient({ baseUrl: 'https://your-deployment.com' });

// Ask the chatbot
const answer = await client.ask('How do I reset my password?', { mode: 'markdown' });

// Sync new knowledge base entries
await client.uploadDataset([
  {
    title: 'Release notes',
    text: 'Highlights for the latest product release.',
    url: 'https://example.com/release-notes'
  }
]);
```

You can override the request paths or provide a custom `fetch` implementation when instantiating the client if you need to route through a proxy or supply authentication headers.

Python developers can follow the [aichat package guide](./docs/aichat-python.md) for installation, configuration, and publishing instructions.

### Publishing the JavaScript SDK

The repository already ships with a build pipeline and metadata that prepares the JavaScript client for npm. To ship a new version:

1. **Authenticate with npm** – run `npm login` (or `npm login --registry <url>` if you use a private registry).
2. **Update the version** – bump the semantic version in the root `package.json`. The build script copies it into `lib/sdk/package.json` so the published manifest stays in sync.
3. **Generate the distributable** – run `npm run build:sdk`. This bundles `lib/sdk` into `lib/sdk/dist/` with ESM and CJS outputs.
4. **Smoke test the tarball (optional)** – `npm pack lib/sdk` creates a local `.tgz` so you can inspect the contents before pushing it live.
5. **Publish** – run `npm run release:sdk` to rebuild (for safety) and invoke `npm publish lib/sdk`. Add `--access public` if you re-scope the package name and need to override the default visibility.

After the publish succeeds the library is immediately installable with `npm install ai-help-center-sdk` (or whatever name you configured in `lib/sdk/package.json`). See [docs/sdk-publishing.md](./docs/sdk-publishing.md) for a detailed checklist covering optional validation steps and tagging guidance.

## Deployment

The repository includes a minimal [`vercel.json`](./vercel.json). Deploy with Vercel or any Next.js-compatible platform:

```bash
npm install -g vercel
vercel deploy --prod
```

Set the same environment variables in your hosting provider to enable Supabase retrieval and Gemini generation in production.
