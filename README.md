# Markdown & Code to Image API

Turn Markdown, code snippets, tables, quotes, and AI answers into polished PNG
images through Apify. Use it from the Console, API, n8n, Make, Zapier, or a
schedule. It is a rendering API, not a web scraper: no login, proxy, source
website, or external API key is required.

- [Run the Actor on Apify](https://apify.com/ai-coding-radar/markdown-code-to-image)
- [Try the public Markdown-to-PNG example](https://apify.com/ai-coding-radar/markdown-code-to-image/examples/render-markdown-and-code-to-a-png)
- [Connect it to an AI agent with Apify MCP](https://apify.com/ai-coding-radar/markdown-code-to-image/api/mcp)

## What it is for

- Markdown to image automation for newsletters and social posts.
- Code screenshot generation with syntax highlighting.
- ChatGPT, Claude, or Gemini answer cards without browser copy/paste work.
- Batch quote cards, changelog images, and documentation previews.

Each successful document creates one Dataset record and one PNG in the run's
default key-value store. The Dataset record contains a direct `imageUrl`.
Storage retention follows the caller's Apify plan and storage settings; copy a
file elsewhere if it needs to be permanent.

## Input

```json
{
  "documents": [
    {
      "title": "Ship the small thing",
      "markdown": "# Markdown to image\n\nTurn **notes** and code into a PNG.\n\n```js\nconst result = await automate();\n```"
    }
  ],
  "theme": "paper",
  "width": 1080,
  "fontSize": 22,
  "watermark": "Made with Cardify"
}
```

Available themes are `paper`, `midnight`, `terminal`, and `clean`. A run accepts
1-20 documents. Each Markdown value is capped at 12,000 characters and each
rendered image at 16,000 pixels high so oversized input fails explicitly.

## Automation API

Set `APIFY_TOKEN` in your secret manager, then call the synchronous Dataset
endpoint from a shell, n8n HTTP Request node, or Make HTTP module:

```sh
curl -sS -X POST \
  "https://api.apify.com/v2/acts/ai-coding-radar~markdown-code-to-image/run-sync-get-dataset-items?token=$APIFY_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"documents":[{"title":"Release note","markdown":"# Shipped\n\nThe useful change is live."}],"theme":"paper","width":1080,"fontSize":22,"watermark":""}'
```

The response is an array with one record per generated PNG. Download the
signed `imageUrl` from each record before the run storage expires. Never put an
Apify token in a workflow exported to a public repository.

## Security and limits

Raw HTML is disabled. Markdown images are replaced with alt text, and the
rendering page blocks network requests. This prevents user content from turning
the Actor into a request proxy or silently loading tracking pixels. The first
version outputs PNG only and uses system fonts; it does not fetch remote fonts,
images, Mermaid diagrams, or arbitrary HTML.

## Local verification

```sh
npm install
npm test
npm run smoke
```

The smoke command writes `/tmp/markdown-code-to-image-smoke.png` using local
Chrome. The Apify image uses the official Playwright Chrome base image.

## Pricing

The launch price is `$0.01` per generated image plus `$0.00005` per Actor start.
Platform usage is included. Test runs, free users, and generated image counts
are not creator revenue; only a finalized payout that actually settles is
treated as income.
