import fs from 'node:fs'

import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import { chromium } from 'playwright'

const THEMES = {
  paper: {
    page: '#efe8dc', card: '#fffdf7', text: '#17212b', muted: '#69727b',
    accent: '#df5b36', border: '#d8cfc0', code: '#202a35', codeText: '#edf5f7',
  },
  midnight: {
    page: '#07111f', card: '#101d2d', text: '#eef6ff', muted: '#9aacc1',
    accent: '#48d5bf', border: '#273a50', code: '#07101b', codeText: '#e8f2ff',
  },
  terminal: {
    page: '#07100b', card: '#0c1811', text: '#b9f6ca', muted: '#6ca77c',
    accent: '#f6d365', border: '#274a32', code: '#030806', codeText: '#b9f6ca',
  },
  clean: {
    page: '#e7edf2', card: '#ffffff', text: '#16202a', muted: '#64727f',
    accent: '#176b87', border: '#d5dee5', code: '#18212b', codeText: '#eef4f8',
  },
}

const MAX_DOCUMENTS = 20
const MAX_MARKDOWN_CHARS = 12000
const MAX_RENDER_HEIGHT = 16000
const DEFAULT_DOCUMENTS = [{
  title: 'A useful answer',
  markdown: '# Markdown to image\n\nTurn **notes**, tables, and highlighted code into a shareable PNG.\n\n```js\nconst result = await automate();\n```',
}]

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) {
      return `<pre><code class="hljs language-${escapeHtml(language)}">${hljs.highlight(code, { language }).value}</code></pre>`
    }
    return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`
  },
})

// External Markdown images are rendered as alt text so user input cannot make network requests.
markdown.renderer.rules.image = (tokens, index) => `<span class="image-alt">[image: ${escapeHtml(tokens[index].content || 'untitled')}]</span>`

export function validateInput(input) {
  input ??= {}
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Actor input must be an object')
  }
  const documents = input.documents ?? DEFAULT_DOCUMENTS
  if (!Array.isArray(documents) || documents.length < 1 || documents.length > MAX_DOCUMENTS) {
    throw new RangeError(`documents must contain 1-${MAX_DOCUMENTS} items`)
  }
  const normalized = documents.map((document, index) => {
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      throw new TypeError(`documents[${index}] must be an object`)
    }
    if (typeof document.markdown !== 'string' || !document.markdown.trim()) {
      throw new TypeError(`documents[${index}].markdown must be a non-empty string`)
    }
    if (document.markdown.length > MAX_MARKDOWN_CHARS) {
      throw new RangeError(`documents[${index}].markdown exceeds ${MAX_MARKDOWN_CHARS} characters`)
    }
    if (document.title != null && (typeof document.title !== 'string' || document.title.length > 160)) {
      throw new TypeError(`documents[${index}].title must be a string up to 160 characters`)
    }
    return { title: document.title?.trim() || null, markdown: document.markdown }
  })
  const theme = input.theme ?? 'paper'
  if (!Object.hasOwn(THEMES, theme)) throw new RangeError(`theme must be one of: ${Object.keys(THEMES).join(', ')}`)
  const width = input.width ?? 1080
  if (!Number.isInteger(width) || width < 640 || width > 1600) throw new RangeError('width must be an integer from 640 to 1600')
  const fontSize = input.fontSize ?? 22
  if (!Number.isInteger(fontSize) || fontSize < 16 || fontSize > 30) throw new RangeError('fontSize must be an integer from 16 to 30')
  const watermark = input.watermark ?? 'Made with Cardify'
  if (typeof watermark !== 'string' || watermark.length > 80) throw new TypeError('watermark must be a string up to 80 characters')
  return { documents: normalized, theme, width, fontSize, watermark: watermark.trim() }
}

export function buildHtml(document, options) {
  const colors = THEMES[options.theme]
  const body = markdown.render(document.markdown)
  const title = document.title ? `<header>${escapeHtml(document.title)}</header>` : ''
  const watermark = options.watermark ? `<footer>${escapeHtml(options.watermark)}</footer>` : ''
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;padding:0;color:${colors.text}}
body{font-family:Georgia,'Times New Roman',serif}
#canvas{width:${options.width}px;padding:64px;background:${colors.page}}
#card{width:100%;padding:58px 64px;background:${colors.card};border:1px solid ${colors.border};border-radius:28px;box-shadow:0 22px 70px rgba(0,0,0,.18);overflow:hidden}
header{margin:0 0 38px;padding:0 0 24px;border-bottom:4px solid ${colors.accent};font:700 ${options.fontSize + 15}px/1.15 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.035em}
main{font-size:${options.fontSize}px;line-height:1.68;overflow-wrap:anywhere}h1,h2,h3,h4{margin:1.2em 0 .45em;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.2;letter-spacing:-.025em}h1{font-size:1.8em}h2{font-size:1.45em}h3{font-size:1.2em}p,ul,ol,blockquote,pre,table{margin:.8em 0}a{color:${colors.accent};text-decoration:none}strong{font-weight:750}hr{border:0;border-top:1px solid ${colors.border};margin:1.5em 0}blockquote{margin-left:0;padding:.15em 0 .15em 1.1em;border-left:5px solid ${colors.accent};color:${colors.muted}}ul,ol{padding-left:1.35em}li+li{margin-top:.3em}
pre{max-width:100%;padding:28px 30px;border-radius:18px;background:${colors.code};color:${colors.codeText};white-space:pre-wrap;overflow-wrap:anywhere;font:500 .78em/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}p code,li code{padding:.12em .36em;border:1px solid ${colors.border};border-radius:7px;color:${colors.accent};font-size:.86em}.hljs-keyword,.hljs-selector-tag,.hljs-literal{color:#ff7b91}.hljs-string,.hljs-title,.hljs-section{color:#a6e3a1}.hljs-number,.hljs-attr{color:#f6d365}.hljs-comment{color:#7f8c98}
table{width:100%;border-collapse:collapse;font-size:.88em}th,td{padding:.55em .7em;border:1px solid ${colors.border};text-align:left}th{font-family:ui-sans-serif,system-ui,sans-serif;background:${colors.page}}.image-alt{color:${colors.muted};font-style:italic}
footer{margin-top:42px;padding-top:22px;border-top:1px solid ${colors.border};color:${colors.muted};font:600 13px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-align:right;text-transform:uppercase}
</style></head><body><section id="canvas"><article id="card">${title}<main>${body}</main>${watermark}</article></section></body></html>`
}

export async function launchBrowser() {
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (fs.existsSync(macChrome) ? macChrome : undefined)
  return chromium.launch({ headless: true, chromiumSandbox: false, executablePath })
}

export async function renderDocument(browser, document, options) {
  const page = await browser.newPage({ viewport: { width: options.width, height: 900 }, deviceScaleFactor: 1 })
  try {
    await page.route('**/*', (route) => route.abort())
    await page.setContent(buildHtml(document, options), { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    const canvas = page.locator('#canvas')
    const height = await canvas.evaluate((element) => Math.ceil(element.getBoundingClientRect().height))
    if (height > MAX_RENDER_HEIGHT) throw new RangeError(`rendered image exceeds ${MAX_RENDER_HEIGHT}px height`)
    const image = await canvas.screenshot({ type: 'png', animations: 'disabled' })
    return { image, height }
  } finally {
    await page.close()
  }
}

export { THEMES }
