# `aichat` Python Library

The `aichat` package is a first-class Python client for the AI Help Center service that
ships with this repository.  It mirrors the TypeScript SDK under `lib/sdk` so that backend
jobs, data pipelines, or notebook experiments written in Python can submit questions,
preview Gemini requests, and synchronise knowledge base documents with minimal boilerplate.
This document explains *everything* you need to know to install, configure, and publish the
library.

> **Who is this guide for?**
>
> - Engineers embedding the Help Center into Django, FastAPI, or Flask services.
> - Data teams that want to keep the knowledge base in sync from Airflow, Dagster, or cron.
> - DevOps engineers tasked with packaging and releasing the Python SDK to PyPI.

## Package overview

| Item | Value |
| --- | --- |
| Distribution name | `aichat` |
| Python support | 3.9 – 3.12 |
| Transport | `requests` (synchronous HTTP) |
| Source layout | `src/aichat/` with `py.typed` marker for type hints |
| Key classes | `AiChatClient`, `AskOptions`, `DatasetDocumentInput`, `RetrievedDoc` |

The client is intentionally small: it only wraps the `/api/ask` and `/api/datasets` routes
provided by the Next.js application.  You can extend it with additional helpers, but the
core surface area is purposely close to the TypeScript client so that docs and examples can
be shared across languages.

## Installing the client

### From PyPI (recommended once published)

```bash
pip install aichat
```

### From a cloned repository

1. Install build tooling (once per environment):

   ```bash
   python -m pip install --upgrade pip build
   ```

2. Build the wheel and source distribution:

   ```bash
   python -m build
   ```

   The artifacts will appear under `dist/`.  For local development you can install the
   editable package directly:

   ```bash
   pip install -e .
   ```

3. Verify the installation:

   ```bash
   python -c "import aichat; print(aichat.__version__)"
   ```

### In isolated environments

- **Virtualenv**

  ```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install aichat
  ```

- **Poetry**

  ```bash
  poetry add aichat
  ```

- **Pipx**

  Use pipx if you want to ship the library with a CLI wrapper:

  ```bash
  pipx install aichat
  ```

## Quick start

```python
from aichat import AiChatClient

client = AiChatClient("https://your-help-center.example.com")
response = client.ask(
    "How do I reset my password?",
    {
        "mode": "markdown",
        "workspace": {"name": "Acme Support", "tone": "friendly"},
    },
)

print(response["response"]["candidates"][0])
```

> **Development mode:** when the server does not have `GEMINI_API_KEY` configured the API
> responds with a request preview instead of contacting Gemini.  The client will happily
> return that payload, which makes it perfect for unit tests and prompt inspection.

## Configuring the client

### Base URL and custom paths

- `base_url` should point to the public deployment (e.g. `https://support.example.com`).
- Override `ask_path` or `dataset_path` if your infrastructure rewrites routes (for
  example, when placing the Next.js API behind a reverse proxy).

```python
client = AiChatClient(
    "https://support.example.com",
    ask_path="/v1/ask",
    dataset_path="/v1/datasets",
)
```

### Authentication and headers

Attach API keys, session cookies, or auth tokens through `default_headers`:

```python
client = AiChatClient(
    "https://support.example.com",
    default_headers={
        "Authorization": "Bearer $YOUR_TOKEN",
        "X-Tenant": "enterprise",
    },
)
```

You can also pass a pre-configured `requests.Session` to reuse proxies, retry adapters, or
custom TLS settings.

### Timeouts and retry policies

- `timeout` (default 30 seconds) controls how long to wait for the HTTP request.
- For retries use `requests.adapters.HTTPAdapter` with the standard `urllib3` retry
  support:

  ```python
  import requests
  from requests.adapters import HTTPAdapter
  from urllib3.util.retry import Retry

  session = requests.Session()
  retries = Retry(total=3, backoff_factor=0.5, status_forcelist=(500, 502, 503, 504))
  session.mount("https://", HTTPAdapter(max_retries=retries))

  client = AiChatClient("https://support.example.com", session=session)
  ```

## Asking questions

### Minimal call

```python
client.ask("What is the refund policy?")
```

### Supplying retrieved documents

Use `RetrievedDoc` or dictionaries.  The client normalises either representation.

```python
from aichat import RetrievedDoc, AskOptions

retrieved_docs = [
    RetrievedDoc(
        id="kb-123",
        title="Refund policy",
        url="https://support.example.com/docs/refunds",
        text="We offer 30 day refunds on all paid plans.",
    )
]

options = AskOptions(retrieved_docs=retrieved_docs, mode="markdown")
response = client.ask("Can I request a refund after 10 days?", options)
```

### Workspace and policy metadata

```python
client.ask(
    "Do we support SSO?",
    {
        "workspace": {
            "name": "Enterprise Support",
            "brand": "Contoso",
            "locale": "en-US",
        },
        "policies": {
            "escalation_required": False,
            "allowed_integrations": ["Okta", "AzureAD"],
        },
        "mode": "json",
    },
)
```

### Handling responses

The API always returns JSON.  When Gemini is configured you will receive the model
response under the `response` key.  Without an API key the payload has the structure shown
below (ideal for testing and prompt debugging):

```json
{
  "message": "Gemini API key not configured. Returning request payload for debugging.",
  "request": { "model": "gemini-2.0-flash-001", "contents": [...] }
}
```

Use defensive coding when extracting answers:

```python
payload = client.ask("Help me troubleshoot login issues")
if "response" in payload:
    content = payload["response"]["candidates"][0]
else:
    # Development mode preview
    print(payload["request"]["contents"])  # inspect the generated prompt
```

### Error handling

Network issues or non-2xx HTTP responses raise `AiChatError`.  Catch it to implement
fallback behaviour:

```python
from aichat import AiChatError

try:
    client.ask("Is the API rate limited?")
except AiChatError as exc:
    logger.warning("Help Center call failed: %s", exc)
```

## Uploading datasets

Synchronise the retriever with structured documents using
`AiChatClient.upload_dataset()`.

```python
from datetime import datetime
from aichat import DatasetDocumentInput, DatasetUploadOptions

release_notes = DatasetDocumentInput(
    title="Release notes",
    text="Highlights from the June release.",
    url="https://support.example.com/docs/june-release",
    created_at=datetime.utcnow().isoformat() + "Z",
)

client.upload_dataset([release_notes], DatasetUploadOptions(mode="append"))
```

- `mode="append"` upserts documents into the existing store (default).
- `mode="replace"` clears the store before inserting the new dataset.
- Additional metadata can be attached through the `extras` field on
  `DatasetDocumentInput` or by passing dictionaries.

## Using the client as a context manager

`AiChatClient` exposes `__enter__` / `__exit__` so the underlying session is closed
cleanly:

```python
with AiChatClient("https://support.example.com") as client:
    client.ask("Where can I update billing info?")
```

## Integration patterns

### Server-side workflows

- **Django or Flask** – keep a single `AiChatClient` on module scope to benefit from
  connection pooling.
- **Celery tasks** – instantiate the client inside the task and close it once the job
  completes.
- **FastAPI dependency injection** – declare the client as a dependency so request handlers
  can call `ask()` or `upload_dataset()` without boilerplate.

### Offline pipelines

1. Export knowledge base content from your CMS.
2. Transform it into the `DatasetDocumentInput` structure (ids optional).
3. Call `upload_dataset(..., mode="replace")` at the end of the pipeline to refresh the
   retriever before your next deploy.

### Prompt experimentation

When running `npm run dev`, omit `GEMINI_API_KEY`.  Every call from the Python client will
return the Gemini request payload, letting you iterate on prompts directly in notebooks.

## Publishing the library

1. Ensure the version in `pyproject.toml` and `aichat.__version__` is updated.
2. Run `python -m build` to produce the wheel (`.whl`) and source archive (`.tar.gz`).
3. Inspect the built metadata:

   ```bash
   tar -tf dist/aichat-<version>.tar.gz | head
   ```

4. Upload to TestPyPI first:

   ```bash
   python -m pip install twine
   python -m twine upload --repository testpypi dist/*
   ```

5. Verify installation from TestPyPI:

   ```bash
   pip install --index-url https://test.pypi.org/simple/ --no-deps aichat
   ```

6. Publish to the real index when satisfied:

   ```bash
   python -m twine upload dist/*
   ```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `AiChatError: Fetch API key not configured` | Ensure the Next.js deployment has `GEMINI_API_KEY` if you expect live generations. |
| `ValueError: question must be a non-empty string` | Sanity check user input before forwarding to the client. |
| `requests.exceptions.SSLError` | Attach a custom `requests.Session` with organisation-specific certificate bundles. |
| Dataset uploads never persist | Confirm Supabase credentials are set on the server or that the filesystem is writeable. |

## Reference

- Source code: [`src/aichat/client.py`](../src/aichat/client.py)
- TypeScript counterpart: [`lib/sdk/client.ts`](../lib/sdk/client.ts)
- API contracts: [`lib/types.ts`](../lib/types.ts)

The Python client intentionally mirrors these files.  When new fields are added to the API
update both implementations to keep the documentation accurate.
