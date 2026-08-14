import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import { validateInput } from '../src/renderer.js'

const examplesDir = path.join(process.cwd(), 'examples')
const actorEndpoint = 'https://api.apify.com/v2/acts/ai-coding-radar~markdown-code-to-image/run-sync-get-dataset-items?clean=1'
const outputFields = ['title', 'theme', 'width', 'height', 'format', 'markdownChars', 'storageKey', 'imageUrl', 'generatedAt']

async function readJson(name) {
  return JSON.parse(await fs.readFile(path.join(examplesDir, name), 'utf8'))
}

test('batch fixture follows the public Actor input contract', async () => {
  const input = await readJson('batch-input.json')
  const normalized = validateInput(input)
  assert.equal(normalized.documents.length, 2)
  assert.equal(normalized.theme, 'paper')
  assert.equal(normalized.width, 1080)
  assert.equal(normalized.fontSize, 22)
  assert.equal(normalized.watermark, '')
})

test('n8n recipe uses the public endpoint and runtime-only authorization', async () => {
  const workflow = await readJson('n8n-markdown-code-to-image.json')
  const httpNode = workflow.nodes.find((node) => node.type === 'n8n-nodes-base.httpRequest')
  assert.ok(httpNode)
  assert.equal(httpNode.parameters.method, 'POST')
  assert.equal(httpNode.parameters.url, actorEndpoint)
  assert.equal(httpNode.parameters.jsonBody, '={{ $json }}')
  const authorization = httpNode.parameters.headerParameters.parameters.find(({ name }) => name === 'Authorization')
  assert.match(authorization.value, /APIFY_TOKEN/)

  const outputNode = workflow.nodes.find((node) => node.name === 'Return PNG records')
  assert.ok(outputNode)
  assert.match(outputNode.parameters.jsCode, /imageUrl/)
})

test('Make recipe mirrors the fixture and documents the output contract', async () => {
  const [fixture, recipe] = await Promise.all([
    readJson('batch-input.json'),
    readJson('make-markdown-code-to-image.json'),
  ])
  assert.equal(recipe.request.method, 'POST')
  assert.equal(recipe.request.url, actorEndpoint)
  assert.deepEqual(recipe.request.body, fixture)
  assert.deepEqual(recipe.response.itemFields, outputFields)
  assert.match(recipe.request.authorization.value, /private Make connection/)
})

test('public examples contain no credentials or signed output URLs', async () => {
  const files = ['batch-input.json', 'n8n-markdown-code-to-image.json', 'make-markdown-code-to-image.json']
  const text = (await Promise.all(files.map((file) => fs.readFile(path.join(examplesDir, file), 'utf8')))).join('\n')
  assert.doesNotMatch(text, /gAAAA[A-Za-z0-9_-]{20,}/)
  assert.doesNotMatch(text, /apify_api_[A-Za-z0-9_-]{20,}/i)
  assert.doesNotMatch(text, /(?:[?&](?:token|signature)=|disableRedirect=true)/i)
})

test('README links both public use-case landing pages', async () => {
  const readme = await fs.readFile(path.join(process.cwd(), 'README.md'), 'utf8')
  assert.match(readme, /examples\/render-markdown-and-code-to-a-png/)
  assert.match(readme, /examples\/chatgpt-markdown-answer-to-png/)
})
