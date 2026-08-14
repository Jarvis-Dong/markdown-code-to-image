# Automation recipes

These recipes call the public Apify Actor API with the caller's own account.
They contain no API token, cookie, private webhook URL, or signed output URL.
Copy the generated `imageUrl` values from the response into a downstream step;
do not hard-code them because run storage can expire.

The canonical batch body is in [`batch-input.json`](./batch-input.json). It is
valid for the Actor input contract: `documents` contains 1–20 items, each
`markdown` value is non-empty, and `theme`, `width`, `fontSize`, and `watermark`
use the documented types and bounds.

## n8n: Markdown to image API and code screenshot API

Import [`n8n-markdown-code-to-image.json`](./n8n-markdown-code-to-image.json),
set `APIFY_TOKEN` in the n8n runtime, and click **Run manually**. The workflow
sends two documents in one request: a Markdown release note with a highlighted
JavaScript code block and an OG-image-sized content card. Each output item is
one dataset record with the public output fields `title`, `theme`, `width`,
`height`, `format`, `markdownChars`, `storageKey`, `imageUrl`, and
`generatedAt`.

The HTTP node uses the documented synchronous endpoint:

```text
POST https://api.apify.com/v2/acts/ai-coding-radar~markdown-code-to-image/run-sync-get-dataset-items?clean=1
Authorization: Bearer <your Apify token from n8n's environment>
Content-Type: application/json
```

For a production workflow, replace **Run manually** with a Webhook or Schedule
Trigger and replace the static **Build batch input** code with fields from your
own CMS, database, or AI step. Keep each batch at 20 documents or fewer. Map
each returned `imageUrl` to an n8n HTTP Request, cloud-storage, email, or owned
publishing step; the URL is generated at run time.

## Make: batch Markdown/code PNGs

[`make-markdown-code-to-image.json`](./make-markdown-code-to-image.json) is a
safe HTTP-module recipe rather than an exported scenario, so it imports without
an account-specific connection or webhook. Create a **Scheduler** module,
then copy its `request` object into **HTTP > Make a request**:

1. Set method and URL from `request.method` and `request.url`.
2. Add the `Accept` and `Content-Type` headers from `request.headers`.
3. Configure Bearer authorization using a private Make connection or secret
   field. The placeholder in the JSON is deliberately not a credential.
4. Paste `request.body` as the raw JSON body and run **JSON > Parse JSON** on
   the response.
5. Add an **Iterator** over the parsed array. Each item has a generated
   `imageUrl`; pass that mapped field to **HTTP > Get a file**, cloud storage,
   email, or another owned destination.

The body demonstrates the high-intent use cases `markdown to image API`, `code
screenshot API`, and `OG image` without fetching remote assets. The Actor
returns PNG only, and raw HTML, remote Markdown images, and network requests
from the rendering page remain disabled.

Every run uses the caller's Apify account and is subject to the Actor's current
Store price. A successful test run, free usage, or image count is not creator
revenue; only an actually settled payout counts as income.
