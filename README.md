# Markdown & Code to Image API

Turn Markdown, code snippets, tables, quotes, and AI answers into polished PNG
images through Apify. Use it from the Console, API, n8n, Make, Zapier, or a
schedule. It is a rendering API, not a web scraper: no login, proxy, source
website, or external API key is required.

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

## Pricing note

The intended launch price is `$0.01` per generated image plus a small run-start
event. Platform usage is included. Test runs, free users, and generated image
counts are not creator revenue; only a finalized payout that actually settles
is treated as income.
