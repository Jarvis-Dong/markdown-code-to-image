import assert from 'node:assert/strict'
import test from 'node:test'

import { buildHtml, validateInput } from '../src/renderer.js'

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
