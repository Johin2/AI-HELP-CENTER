# AI Help Center SDK

The **AI Help Center SDK** is a lightweight JavaScript client for the AI Help Center API. It mirrors the behaviour of the Python `aichat` package so that applications can submit questions and synchronise knowledge base documents without hand rolling HTTP calls.

## Installation

```bash
npm install ai-help-center-sdk
# or
pnpm add ai-help-center-sdk
# or
yarn add ai-help-center-sdk
```

## Quick start

```js
import { AiHelpCenterClient } from 'ai-help-center-sdk';

const client = new AiHelpCenterClient({
  baseUrl: 'https://support.example.com',
});

const response = await client.ask('How do I reset my password?', {
  mode: 'markdown',
});
```

Upload datasets to keep your retriever in sync:

```js
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

Follow these steps whenever you want to release a new version of the SDK:

1. **Log in to npm** – `npm login` authenticates your machine (use `--registry` for private registries).
2. **Set the version** – update the version number in the root `package.json`. The helper script mirrors it into the SDK manifest.
3. **Build the bundle** – run `npm run build:sdk` to emit ESM and CJS bundles under `dist/` along with a generated `package.json` and README.
4. **Verify the output (optional)** – inspect the folder or run `npm pack dist` to preview the tarball that npm will receive.
5. **Publish** – `npm publish dist` pushes the package to the registry. Add `--access public` when publishing a scoped package for the first time.

Once published, consumers can install the package globally via `npm install ai-help-center-sdk`, `pnpm add ai-help-center-sdk`, or `yarn add ai-help-center-sdk`. Refer to [`docs/sdk-publishing.md`](../../docs/sdk-publishing.md) for an expanded walkthrough with optional validation steps.


## License

MIT © AI Help Center Team
