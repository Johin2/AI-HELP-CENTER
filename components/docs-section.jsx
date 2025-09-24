import Link from 'next/link';

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

export async function askSupport(question) {
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

const navTabs = [
  { label: 'AI Help Center', active: true },
  { label: 'Integrations', active: false },
  { label: 'Learn', active: false },
  { label: 'Contributing', active: false },
];

const docsNavigation = [
  { id: 'overview', title: 'Overview' },
  { id: 'quickstart', title: 'Quickstart' },
  { id: 'environment-variables', title: 'Environment variables' },
  { id: 'sdk-configuration', title: 'SDK configuration' },
  { id: 'ask-options', title: 'Ask options' },
  { id: 'dataset-modes', title: 'Dataset modes' },
  { id: 'code-examples', title: 'Code examples' },
];

const resourceLinks = [
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Forum', href: 'https://github.com/discussions' },
];

export function DocsSection({ id = 'docs', className } = {}) {
  const baseClassName = 'scroll-smooth';
  const sectionClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <section id={id} className={sectionClassName}>
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">On this page</p>
              <nav className="mt-4 space-y-1 text-sm">
                {docsNavigation.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-slate-400 transition hover:bg-slate-900/60 hover:text-white"
                  >
                    <span>{item.title}</span>
                    <span aria-hidden className="text-xs text-slate-600">
                      ↗
                    </span>
                  </a>
                ))}
              </nav>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Need implementation help?</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Spin up the embedded assistant on the home page to get live answers about the SDK setup.
              </p>
              <Link
                href="/#contact"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand hover:text-white"
              >
                Contact us
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </aside>

        <div className="space-y-12">
          <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 shadow-2xl shadow-black/40">
            <div className="border-b border-slate-800/80 bg-slate-950/60 px-8 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                    AI Help Center
                  </span>
                  <span className="text-sm text-slate-400">Developer documentation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {resourceLinks.map((resource) => (
                    <Link
                      key={resource.label}
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-slate-300 transition hover:border-brand hover:text-white"
                    >
                      <span>{resource.label}</span>
                      <span aria-hidden>↗</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-slate-800/80 bg-slate-950/80 px-8">
              <div className="flex flex-wrap items-center gap-2 py-3 text-sm">
                {navTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    className={
                      tab.active
                        ? 'rounded-full border border-brand/60 bg-brand/20 px-4 py-1.5 font-medium text-white shadow-glow'
                        : 'rounded-full border border-transparent px-4 py-1.5 text-slate-400 transition hover:border-slate-700 hover:text-slate-200'
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-16 px-8 py-10">
              <article id="overview" className="scroll-mt-28 space-y-8">
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent px-5 py-4 text-amber-100 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Alpha notice</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
                    >
                      Copy page
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-amber-100/80">
                    This guide mirrors the pre-release AI Help Center SDK. Expect rapid iteration, new endpoints, and occasional breaking changes as we stabilise the toolkit.
                  </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                  <div className="space-y-4 lg:flex-1">
                    <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Overview</h1>
                    <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                      Everything developers need to ship the AI Help Center SDK with confidence and speed.
                    </p>
                    <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
                      Follow the guided quickstart, reference every environment variable, and copy ready-to-use code snippets to interact with the `/api/ask` and `/api/datasets` routes. The SDK works in Node.js, serverless functions, and browser clients alike.
                    </p>
                  </div>

                  <div className="lg:w-72">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-inner shadow-black/20">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <span>Install</span>
                        <span>npm</span>
                      </div>
                      <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-100">
                        <code>npm install @ai-help-center/sdk</code>
                      </pre>
                      <p className="mt-4 text-xs text-slate-500">
                        Prefer Yarn?{' '}
                        <code className="font-mono text-slate-300">yarn add @ai-help-center/sdk</code>
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article id="quickstart" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                    Guided setup
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Quickstart</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    A four-step implementation path to wire the assistant into your product.
                  </p>
                </div>
                <ol className="grid gap-4 lg:grid-cols-2">
                  {quickStartSteps.map((step, index) => (
                    <li
                      key={step.title}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5 shadow-[0_8px_30px_rgba(2,6,23,0.35)]"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Step {index + 1}
                      </span>
                      <p className="mt-3 font-semibold text-slate-100">{step.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </article>

              <article id="environment-variables" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Configuration
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Environment variables</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Provision the secrets that power Gemini responses and optional Supabase persistence.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {envVariables.map((variable) => (
                    <div
                      key={variable.name}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5"
                    >
                      <p className="font-mono text-sm font-semibold text-slate-100">{variable.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{variable.description}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article id="sdk-configuration" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-brand/40 bg-brand/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                    Client options
                  </span>
                  <h2 className="text-2xl font-semibold text-white">SDK configuration</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Tune the client once and reuse it across Edge functions, background jobs, and browser apps.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {clientConfigOptions.map((option) => (
                    <div
                      key={option.name}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5"
                    >
                      <p className="font-semibold text-slate-100">{option.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article id="ask-options" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Prompt payload
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Ask options</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Tailor the conversation for your support tone, regional requirements, and fallback experiences.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {askOptions.map((option) => (
                    <div
                      key={option.name}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5"
                    >
                      <p className="font-semibold text-slate-100">{option.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article id="dataset-modes" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                    Knowledge base
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Dataset modes</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Control how new documentation blends with what is already in your workspace corpus.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {datasetModes.map((mode) => (
                    <div
                      key={mode.name}
                      className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5"
                    >
                      <p className="font-semibold text-slate-100">{mode.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{mode.description}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article id="code-examples" className="scroll-mt-28 space-y-6 border-t border-slate-800/80 pt-10">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Copy &amp; run
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Code examples</h2>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Drop these snippets into scripts, Edge handlers, or full-stack frameworks to interact with the assistant.
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5">
                    <p className="font-semibold text-slate-100">Asking the assistant</p>
                    <pre className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
                      <code>{askExample}</code>
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-5">
                    <p className="font-semibold text-slate-100">Syncing datasets</p>
                    <pre className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
                      <code>{datasetExample}</code>
                    </pre>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
