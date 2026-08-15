import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

import { buildHtml, validateInput } from '../src/renderer.js'

test('published preview is a real 1080px PNG', async () => {
  const image = await fs.readFile(new URL('../docs/markdown-code-to-image-preview.png', import.meta.url))

  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(image.readUInt32BE(16), 1080)
  assert.ok(image.readUInt32BE(20) >= 600)
  assert.ok(image.length >= 20_000)
})

test('empty API input renders one bounded default card', () => {
  const config = validateInput({})

  assert.equal(config.documents.length, 1)
  assert.match(config.documents[0].markdown, /Markdown to image/)
  assert.equal(config.theme, 'paper')
  assert.equal(config.width, 1080)
  assert.equal(config.fontSize, 22)
  assert.equal(config.watermark, 'Made with Cardify')
})

test('renders untrusted Markdown without HTML or remote images', () => {
  const config = validateInput({
    documents: [{ markdown: '<script>alert(1)</script>\n\n![x](https://example.com/a.png)\n\n```js\nconst x = 1\n```' }],
  })
  const html = buildHtml(config.documents[0], config)
  assert.doesNotMatch(html, /<script>alert/)
  assert.doesNotMatch(html, /https:\/\/example\.com\/a\.png/)
  assert.match(html, /\[image: x\]/)
  assert.match(html, /class="hljs language-js"/)
})

test('rejects oversized or malformed input', () => {
  assert.throws(() => validateInput({ documents: [] }), /1-20/)
  assert.throws(() => validateInput({ documents: [{ markdown: 'x'.repeat(12001) }] }), /12000/)
  assert.throws(() => validateInput({ documents: [{ markdown: 'ok' }], width: 200 }), /640/)
})
