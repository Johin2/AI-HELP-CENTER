import React from 'react';

type DocsSectionProps = {
  id?: string;
  className?: string;
};

type OutlineItem = {
  id: string;
  title: string;
  children?: OutlineItem[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const quickStartSteps = [
  {
    title: 'Install the SDK',
    description:
      'Copy the SDK folder from this project or publish it internally, then import the AiHelpCenterClient anywhere you need to call the assistant.',
  },
  {
    title: 'Configure environment secrets',
    description:
      'Set up Gemini and Supabase credentials (if used) in your deployment environment so the API routes can retrieve and store knowledge base content.',
  },
  {
    title: 'Boot the Next.js application',
    description:
      'Run the dev server locally with `npm run dev` or deploy to Vercel/your platform of choice. The `/api/ask` and `/api/datasets` routes power the SDK.',
  },
  {
    title: 'Instantiate the SDK client',
    description:
      'Provide the base URL for your deployed app or API gateway and call the `ask` and `uploadDataset` helpers from any client or server environment.',
  },
];

const quickStartWithIds = quickStartSteps.map((step) => ({
  ...step,
  id: `quickstart-${slugify(step.title)}`,
}));

const envVariables = [
  {
    name: 'GEMINI_API_KEY',
    description:
      'Required for real Gemini completions. When omitted, the API returns a debug payload with the request body so you can integrate safely.',
  },
  {
    name: 'GEMINI_MODEL',
    description: 'Optional model override. Defaults to `gemini-2.0-flash-001`.',
  },
  {
    name: 'GEMINI_BASE_URL',
    description: 'Optional Gemini endpoint override. Defaults to the public Google Generative Language API.',
  },
  {
    name: 'SUPABASE_URL',
    description: 'Supabase project URL used when syncing datasets to a remote table.',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY',
    description:
      'Credential used by the dataset uploader. The service role key is preferred so the API can upsert documents; the anon key works for read-only demos.',
  },
  {
    name: 'SUPABASE_KB_TABLE',
    description: "Optional table name for your knowledge base. Defaults to `'knowledge_base'`.",
  },
  {
    name: 'KB_PATH',
    description:
      'Path to the JSON file used for local development fallbacks. The dataset store reads and writes to this file when Supabase is not configured.',
  },
];

const clientConfigOptions = [
  {
    name: 'baseUrl',
    description:
      'Required. The root origin where your Next.js app is hosted. Trailing slashes are trimmed automatically before building requests.',
  },
  {
    name: 'askPath',
    description: 'Optional. Path to the ask endpoint. Defaults to `/api/ask`.',
  },
  {
    name: 'datasetPath',
    description: 'Optional. Path to the dataset upload endpoint. Defaults to `/api/datasets`.',
  },
  {
    name: 'fetch',
    description:
      'Optional fetch implementation. Provide this when running in environments without a global `fetch` (for example Node.js scripts or tests).',
  },
  {
    name: 'defaultHeaders',
    description:
      'Optional object of headers appended to every request. Useful for auth tokens or custom routing metadata.',
  },
];

const askOptions = [
  {
    name: 'workspace',
    description:
      'Metadata about the requester such as `name`, `tone`, `locale`, or brand attributes. These values are merged directly into the prompt context.',
  },
  {
    name: 'mode',
    description:
      "Controls the response format. Choose `'markdown'` (default) for rich text replies or `'json'` to receive structured output for widgets.",
  },
  {
    name: 'retrieved_docs',
    description:
      'Supply your own supporting documents to override retrieval. When omitted, the server automatically loads up to three matches from the knowledge base.',
  },
  {
    name: 'policies',
    description:
      'Attach any additional policy payload the prompt builder should respect (escalation criteria, compliance statements, guardrails, and more).',
  },
];

const datasetModes = [
  {
    name: 'append',
    description:
      'Adds new documents to the existing corpus. This is the default behaviour and keeps prior entries intact.',
  },
  {
    name: 'replace',
    description:
      'Replaces the entire knowledge base with the provided documents. Useful for scheduled sync jobs or large migrations.',
  },
];

const askExample = String.raw`import { AiHelpCenterClient } from '@/lib/sdk';

const client = new AiHelpCenterClient({
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
});

export async function askSupport(question: string) {
  const result = await client.ask(question, {
    workspace: {
      name: 'Acme Support Hub',
      tone: 'friendly',
    },
    mode: 'markdown',
  });

  if ('response' in result) {
    return result.response;
  }

  return result;
}`;

const datasetExample = String.raw`import { AiHelpCenterClient } from '@/lib/sdk';

const client = new AiHelpCenterClient({
  baseUrl: 'https://support.example.com',
  defaultHeaders: {
    Authorization: 'Bearer ' + process.env.HELP_CENTER_TOKEN,
  },
});

export async function syncKnowledgeBase() {
  await client.uploadDataset(
    [
      {
        id: 'workspace-overview',
        title: 'Workspace overview',
        url: 'https://docs.example.com/workspace-overview',
        text: 'Overview of permissions, notifications, and workspaces.',
      },
      {
        title: 'Troubleshooting sign in',
        url: 'https://docs.example.com/sign-in-troubleshooting',
        text: 'Reset multi-factor authentication, recover accounts, and resolve lockouts.',
      },
    ],
    { mode: 'replace' },
  );
}`;

export const docsOutline: OutlineItem[] = [
  { id: 'overview', title: 'Overview' },
  {
    id: 'quickstart',
    title: 'Quickstart',
    children: quickStartWithIds.map((step) => ({ id: step.id, title: step.title })),
  },
  {
    id: 'client-usage',
    title: 'Client usage',
    children: [
      { id: 'client-usage-ask', title: 'Ask from any runtime' },
      { id: 'client-usage-datasets', title: 'Synchronize your knowledge base' },
    ],
  },
  { id: 'environment', title: 'Environment variables' },
  {
    id: 'configuration',
    title: 'Configuration reference',
    children: [
      { id: 'configuration-client', title: 'Client configuration options' },
      { id: 'configuration-ask', title: 'Ask options' },
      { id: 'configuration-datasets', title: 'Dataset modes' },
    ],
  },
  { id: 'launch', title: 'Launch checklist' },
];

export function DocsSection({ id = 'docs', className }: DocsSectionProps = {}) {
  const baseClassName =
    'flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl shadow-black/40 backdrop-blur';
  const sectionClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <section id={id} className={sectionClassName}>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_60%)]"
          aria-hidden
        />
        <article className="relative space-y-16 px-8 py-12 md:px-12">
          <section id="overview" className="scroll-mt-32 space-y-6">
            <header className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                <span>Docs</span>
                <span className="text-brand">AI</span>
              </div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Overview</h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-300">
                Everything developers need to ship the AI Help Center SDK. Follow the guided quickstart, reference every
                environment variable, and copy ready-to-use code snippets to interact with the `/api/ask` and `/api/datasets`
                routes.
              </p>
            </header>

            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-amber-100">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200">Alpha notice</p>
              <p className="mt-2 text-sm leading-relaxed">
                These docs cover the v0-alpha release of the AI Help Center SDK. Components and APIs may evolve before the
                stable launch. Keep an eye on the changelog and upgrade guides for breaking changes.
              </p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <p>
                The SDK exposes strongly typed helpers for asking the assistant and synchronizing datasets. It is designed to be
                framework agnostic and can be called from browsers, Node.js scripts, or background workers with the same
                configuration object.
              </p>
              <p>
                Serverless-friendly API routes power retrieval, prompt building, and Gemini generation. When Gemini credentials
                are absent, the application falls back to a deterministic mock response so you can integrate safely without
                incurring token costs.
              </p>
            </div>
          </section>

          <section id="quickstart" className="scroll-mt-32 space-y-6 border-t border-slate-800 pt-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Quickstart</p>
              <h2 className="text-2xl font-semibold text-white">Ship the assistant in minutes</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Walk through the essential steps required to deploy the SDK inside your own product experience. Each card links to
                configuration details and code samples available on this page.
              </p>
            </div>

            <ol className="space-y-4">
              {quickStartWithIds.map((step, index) => (
                <li
                  key={step.title}
                  id={step.id}
                  className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900/80"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-sm font-semibold text-brand">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="client-usage" className="scroll-mt-32 space-y-6 border-t border-slate-800 pt-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Client usage</p>
              <h2 className="text-2xl font-semibold text-white">Interact with the SDK from any runtime</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                The client wraps REST endpoints with minimal configuration. Provide your deployment&apos;s base URL, optionally add
                custom headers, and call the helper methods wherever you have access to `fetch`.
              </p>
            </div>

            <div className="space-y-8">
              <article
                id="client-usage-ask"
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner shadow-black/20"
              >
                <h3 className="text-lg font-semibold text-slate-100">Ask the assistant from any runtime</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  The client validates that a question is supplied before reaching the server. Missing Gemini credentials trigger a
                  simulated payload response, letting you verify prompts and workspace metadata during development without
                  consuming tokens.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-5 text-xs leading-relaxed text-slate-200">
                  <code>{askExample}</code>
                </pre>
              </article>

              <article
                id="client-usage-datasets"
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner shadow-black/20"
              >
                <h3 className="text-lg font-semibold text-slate-100">Synchronize your knowledge base</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Upload documentation in batches with <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">append</code> or
                  run full refreshes with <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">replace</code>. The API persists data to Supabase when
                  credentials are present and falls back to the on-disk JSON dataset for local development.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-5 text-xs leading-relaxed text-slate-200">
                  <code>{datasetExample}</code>
                </pre>
              </article>
            </div>
          </section>

          <section id="environment" className="scroll-mt-32 space-y-6 border-t border-slate-800 pt-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Configuration</p>
              <h2 className="text-2xl font-semibold text-white">Environment variables</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Configure these variables to control how the server connects to Gemini and your storage layer. Only
                <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">GEMINI_API_KEY</code> is required for production responses.
              </p>
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              {envVariables.map((variable) => (
                <div key={variable.name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-brand">{variable.name}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate-300">{variable.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="configuration" className="scroll-mt-32 space-y-8 border-t border-slate-800 pt-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Reference</p>
              <h2 className="text-2xl font-semibold text-white">Configuration reference</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Deep dive into the available options for the SDK client, the ask helper, and dataset synchronization. Combine these
                settings to tailor the assistant&apos;s tone, retrieval strategy, and routing.
              </p>
            </div>

            <div className="space-y-8">
              <article id="configuration-client" className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Client configuration options</h3>
                <dl className="space-y-4 text-sm leading-relaxed text-slate-300">
                  {clientConfigOptions.map((option) => (
                    <div key={option.name}>
                      <dt className="font-semibold text-slate-100">{option.name}</dt>
                      <dd className="mt-1">{option.description}</dd>
                    </div>
                  ))}
                </dl>
              </article>

              <article id="configuration-ask" className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Ask options</h3>
                <dl className="space-y-4 text-sm leading-relaxed text-slate-300">
                  {askOptions.map((option) => (
                    <div key={option.name}>
                      <dt className="font-semibold text-slate-100">{option.name}</dt>
                      <dd className="mt-1">{option.description}</dd>
                    </div>
                  ))}
                </dl>
              </article>

              <article id="configuration-datasets" className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Dataset modes</h3>
                <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
                  {datasetModes.map((mode) => (
                    <li key={mode.name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="font-semibold text-slate-100">{mode.name}</p>
                      <p className="mt-2">{mode.description}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section id="launch" className="scroll-mt-32 space-y-6 border-t border-slate-800 pt-12">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Launch checklist</p>
              <h2 className="text-2xl font-semibold text-white">Prep for production</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Finalize your rollout by validating dataset freshness, monitoring observability hooks, and coordinating support
                hand-offs with your team.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm leading-relaxed text-slate-300">
                <h3 className="text-base font-semibold text-slate-100">Production launch checklist</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Enable Supabase credentials or schedule a recurring dataset sync job.</li>
                  <li>Set custom <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">defaultHeaders</code> if routes require authentication or tenant routing.</li>
                  <li>Use the <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-xs text-slate-200">json</code> mode for structured hand-offs to chat widgets or CRMs.</li>
                  <li>Monitor `/api/datasets` uploads—every response includes counts you can alert on.</li>
                </ul>
              </article>

              <article className="rounded-2xl border border-brand/40 bg-brand/10 p-6 text-sm leading-relaxed text-brand">
                <h3 className="text-base font-semibold text-brand">Debug-friendly defaults</h3>
                <p className="mt-2 text-brand/80">
                  Missing Gemini credentials? The server responds with the normalized request payload so you can verify prompts and
                  workspace metadata while developing locally. Add the API key at any time to switch to live Gemini generations.
                </p>
              </article>
            </div>
          </section>
        </article>
      </div>
    </section>
  );
}
