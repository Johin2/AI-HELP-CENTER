# AI Help Center SDK

The **AI Help Center SDK** is a lightweight TypeScript client for the AI Help Center API. It mirrors the behaviour of the Python `aichat` package so that JavaScript and TypeScript applications can submit questions and synchronise knowledge base documents without hand rolling HTTP calls.

## Installation

```bash
npm install ai-help-center-sdk
# or
pnpm add ai-help-center-sdk
# or
yarn add ai-help-center-sdk
```

## Quick start

```ts
import { AiHelpCenterClient } from 'ai-help-center-sdk';

const client = new AiHelpCenterClient({
  baseUrl: 'https://support.example.com',
});

const response = await client.ask('How do I reset my password?', {
  mode: 'markdown',
});
```

Upload datasets to keep your retriever in sync:

```ts
await client.uploadDataset(
  [
    {
      title: 'Release notes',
      text: 'Highlights from the June release.',
      url: 'https://support.example.com/docs/june-release',
    },
  ],
  { mode: 'replace' },
);
```

## Configuration

* `baseUrl` – **required**. The base URL for your deployed AI Help Center (for example `https://support.example.com`).
* `askPath` – Optional override for the ask endpoint. Defaults to `/api/ask`.
* `datasetPath` – Optional override for the dataset endpoint. Defaults to `/api/datasets`.
* `fetch` – Provide a custom `fetch` implementation when the global Fetch API is unavailable.
* `defaultHeaders` – Supply headers (API keys, auth tokens) automatically sent with every request.

## Error handling

The client throws standard `Error` objects when requests fail. When the HTTP response includes a body it is returned in the error message, making debugging easier in CI pipelines.

## Publishing

Run the provided build step to generate the distributable artefacts under `dist/`:

```bash
npm run build:sdk
```

The resulting `dist` directory is publishable directly to npm (`npm publish dist`).

## License

MIT © AI Help Center Team
