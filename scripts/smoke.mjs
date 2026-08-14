import fs from 'node:fs/promises'

import { launchBrowser, renderDocument, validateInput } from '../src/renderer.js'

const config = validateInput({
  theme: 'paper',
  width: 1080,
  documents: [{
    title: 'Ship the small thing',
    markdown: '# Markdown to image\n\nTurn **notes**, tables, and code into a shareable PNG.\n\n```js\nconst revenue = settledOnly();\n```\n\n> No login. No remote assets.',
  }],
})
const browser = await launchBrowser()
try {
  const result = await renderDocument(browser, config.documents[0], config)
  const output = '/tmp/markdown-code-to-image-smoke.png'
  await fs.writeFile(output, result.image)
  console.log(JSON.stringify({ output, bytes: result.image.length, width: config.width, height: result.height }))
} finally {
  await browser.close()
}
