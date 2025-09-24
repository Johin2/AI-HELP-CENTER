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

export function DocsSection({ id = 'docs', className } = {}) {
  const baseClassName =
    'rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-2xl shadow-black/40 backdrop-blur';
  const sectionClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <section id={id} className={sectionClassName}>
      <header className="space-y-4">
        <span className="inline-flex rounded-full border border-brand/50 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand">
          Docs
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Everything developers need to ship the AI Help Center SDK.
        </h2>
        <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
          Follow the guided quickstart, reference every environment variable, and copy ready-to-use code snippets to interact
          with the `/api/ask` and `/api/datasets` routes. The SDK works in Node.js, serverless functions, and browser clients alike.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Quickstart</h3>
          <ol className="space-y-4 text-sm text-slate-300">
            {quickStartSteps.map((step) => (
              <li key={step.title} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="font-semibold text-slate-100">{step.title}</p>
                <p className="mt-2 text-slate-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Environment variables</h3>
          <ul className="space-y-4 text-sm text-slate-300">
            {envVariables.map((variable) => (
              <li key={variable.name} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="font-semibold text-slate-100">{variable.name}</p>
                <p className="mt-2 text-slate-400">{variable.description}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">SDK configuration</h3>
          <ul className="space-y-4 text-sm text-slate-300">
            {clientConfigOptions.map((option) => (
              <li key={option.name} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="font-semibold text-slate-100">{option.name}</p>
                <p className="mt-2 text-slate-400">{option.description}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Ask options</h3>
          <ul className="space-y-4 text-sm text-slate-300">
            {askOptions.map((option) => (
              <li key={option.name} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="font-semibold text-slate-100">{option.name}</p>
                <p className="mt-2 text-slate-400">{option.description}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Dataset modes</h3>
          <ul className="space-y-4 text-sm text-slate-300">
            {datasetModes.map((mode) => (
              <li key={mode.name} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="font-semibold text-slate-100">{mode.name}</p>
                <p className="mt-2 text-slate-400">{mode.description}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Code examples</h3>
          <div className="space-y-4 text-xs text-slate-300">
            <div>
              <p className="font-semibold text-slate-100">Asking the assistant</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-left">
                <code>{askExample}</code>
              </pre>
            </div>
            <div>
              <p className="font-semibold text-slate-100">Syncing datasets</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-left">
                <code>{datasetExample}</code>
              </pre>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
