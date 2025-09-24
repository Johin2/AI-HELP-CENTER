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
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_KB_TABLE=knowledge_base
   SUPABASE_REPO_CHUNKS_TABLE=repo_code_chunks
   SUPABASE_REPOSITORIES_TABLE=repository_indexes
   KB_PATH=data/knowledgeBase.json
   GITHUB_APP_ID=your-github-app-id
   GITHUB_APP_CLIENT_ID=your-github-app-oauth-client-id
   GITHUB_APP_CLIENT_SECRET=your-github-app-oauth-client-secret
   GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   GITHUB_APP_WEBHOOK_SECRET=super-secret
   GEMINI_EMBEDDING_MODEL=gemini-embedding-001
   REPO_INDEXING_MAX_FILE_SIZE=262144
   REPO_INDEXING_CONCURRENCY=5
   REPO_INDEXING_CHUNK_LINES=120
   REPO_INDEXING_CHUNK_OVERLAP=20
   REPO_RETRIEVAL_TOP_K=8
   ```

   - When `GEMINI_API_KEY` is omitted, the API returns the Gemini request payload so you can inspect prompts safely in development.
   - When Supabase credentials are missing, the retriever falls back to the bundled JSON knowledge base.
   - If you enable Supabase, ensure the knowledge base and repository tables exist. Run this SQL in the SQL editor (adjust the schema/name as needed):

### Configure Supabase authentication

The UI relies on Supabase Auth for Google sign-in and session management. Ensure you:

1. Enable **Google** under **Authentication → Providers** in the Supabase dashboard and paste the OAuth client credentials you created in Google Cloud (the redirect URL should match the Supabase callback URL you already configured).
2. Copy your project URL and anon/public API key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Provide the service role key in `SUPABASE_SERVICE_ROLE_KEY` so server utilities can manage the knowledge base and repository indexes.

The browser client persists sessions automatically, so returning users stay signed in until they explicitly sign out from the navigation bar.

     ```sql
     create table if not exists public.knowledge_base (
       id uuid primary key,
       title text not null,
       text text not null,
       url text not null,
       created_at timestamptz default now()
     );

     create table if not exists public.repository_indexes (
       installation_id bigint not null,
       repository_id bigint not null,
       repository_name text not null,
       default_branch text not null,
       enabled boolean default false,
       status text default 'pending',
       last_indexed_commit text,
       indexed_at timestamptz,
       error text,
       updated_at timestamptz default now(),
       primary key (installation_id, repository_id)
     );

     create table if not exists public.repo_code_chunks (
       id text primary key,
       installation_id bigint not null,
       repository_id bigint not null,
       repository_name text not null,
       branch text not null,
       path text not null,
       language text,
       symbol text,
       start_line integer,
       end_line integer,
       commit_sha text,
       content text not null,
       embedding vector(768),
       score float8,
       updated_at timestamptz default now()
     );
     ```

     Create an approximate nearest neighbour index on `repo_code_chunks.embedding` using HNSW for low-latency similarity search:

     ```sql
     create index if not exists repo_code_chunks_embedding_hnsw
       on public.repo_code_chunks
       using hnsw (embedding vector_cosine_ops)
       with (m = 16, ef_construction = 200);
     ```

     Add an RPC helper the API uses for hybrid retrieval (adjust schema/table names as required):

     ```sql
     create or replace function public.match_repo_code_chunks(
       query_embedding vector,
       match_count int,
       installation_identifier bigint,
       repository_filter bigint[] default null,
       language_filter text[] default null,
       path_prefix text default null
     ) returns table (
       id text,
       installation_id bigint,
       repository_id bigint,
       repository_name text,
       branch text,
       path text,
       language text,
       symbol text,
       start_line int,
       end_line int,
       commit_sha text,
       content text,
       score float8
     )
     language sql
     security definer
     set search_path = public
     as $$
       select
         c.id,
         c.installation_id,
         c.repository_id,
         c.repository_name,
         c.branch,
         c.path,
         c.language,
         c.symbol,
         c.start_line,
         c.end_line,
         c.commit_sha,
         c.content,
         1 - (c.embedding <=> query_embedding) as score
       from public.repo_code_chunks as c
       where c.installation_id = installation_identifier
         and (repository_filter is null or c.repository_id = any(repository_filter))
         and (language_filter is null or c.language = any(language_filter))
         and (path_prefix is null or c.path like (path_prefix || '%'))
       order by c.embedding <=> query_embedding
       limit match_count;
     $$;
     ```
     ```

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
- Supports a `scope` switch (`docs`, `repo`, or `both`) so you can target Supabase docs, indexed repositories, or merge the two.
- When `scope` includes `repo`, pass the `repo_context` object (`installation_id` + optional `repository_ids`) so the retriever can issue Gemini embeddings + pgvector ANN searches.
- Accepts an optional workspace descriptor, policy blob, and response mode (`markdown` or `json`).
- Returns either the Gemini generation response or a request preview when the API key is missing.

**Example request**

```json
{
  "question": "How do I configure the system?",
  "workspace": { "name": "Acme Support" },
  "mode": "markdown",
  "scope": "both",
  "repo_context": {
    "installation_id": 123456,
    "repository_ids": [987654321]
  }
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
- `POST /api/github/installations/:installationId/index` kicks off snapshot indexing for the provided installation (all repos or a filtered list).
- `GET /api/github/installations/:installationId/repositories` + `PATCH` let you list and toggle repository indexing preferences.
- `POST /api/github/webhook` receives GitHub App webhooks (`installation`, `installation_repositories`, `push`) to keep metadata and code chunks in sync.

### GitHub Repo Q&A flow

1. [Create a GitHub App](https://docs.github.com/apps/creating-github-apps/) with **Contents** + **Metadata** read-only permissions and subscribe to `installation`, `installation_repositories`, and `push` events.
2. Supply the app credentials/private key + webhook secret via environment variables listed above.
3. Install the app on a workspace, selecting "All" or specific repositories. The new `/dashboard` page surfaces the installation + repo picker.
4. Trigger indexing from the dashboard or POST endpoint. The service uses the Git Trees API with an automatic tarball fallback when trees are truncated.
5. The indexer chunks source files, generates Gemini embeddings (single text per request), and stores vectors + metadata in Supabase with an HNSW index for ANN queries.
6. Push webhooks upsert/delete only the changed file chunks, keeping vectors hot without reprocessing the entire repo.
7. In chat, switch the scope (Docs | Repo | Both) to control retrieval. Repo answers include GitHub file + line citations (e.g. `repo/path/file.ts#L10–L42`).

