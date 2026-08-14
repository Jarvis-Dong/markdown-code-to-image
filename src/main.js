import { Actor } from 'apify'

import { launchBrowser, renderDocument, validateInput } from './renderer.js'

await Actor.init()
let browser

try {
  const config = validateInput(await Actor.getInput())
  const store = await Actor.openKeyValueStore()
  browser = await launchBrowser()

  for (const [index, document] of config.documents.entries()) {
    const { image, height } = await renderDocument(browser, document, config)
    const key = `IMAGE-${String(index + 1).padStart(3, '0')}.png`
    await store.setValue(key, image, { contentType: 'image/png' })
    await Actor.pushData({
      title: document.title,
      theme: config.theme,
      width: config.width,
      height,
      format: 'png',
      markdownChars: document.markdown.length,
      storageKey: key,
      imageUrl: `https://api.apify.com/v2/key-value-stores/${store.id}/records/${encodeURIComponent(key)}`,
      generatedAt: new Date().toISOString(),
    })
  }

  await Actor.setStatusMessage(`Generated ${config.documents.length} PNG image(s)`)
} finally {
  await browser?.close()
  await Actor.exit()
}
