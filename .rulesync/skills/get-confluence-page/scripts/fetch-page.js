import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { confluencePageDir } from '../../lib/tmp.js'
import { childPages } from './child-pages.js'
import { pageText } from './page.js'
import { resolveContentId } from './resolve-content-id.js'

/**
 * Fetch one Confluence page and its child pages into `.tmp/confluence-pages/<id>/`.
 * @param {string} input
 */
export async function fetchPage (input) {
  if (!input) throw new Error('Usage: node fetch-page.js PAGE_ID_OR_URL')
  const pageId = resolveContentId(input)
  const dir = confluencePageDir(pageId)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'page.txt'), (await pageText(pageId, 'full')) + '\n')
  writeFileSync(join(dir, 'page.json'), (await pageText(pageId, 'json')) + '\n')
  await childPages(pageId)
  console.log(`Fetched page into ${dir}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve(fetchPage(process.argv[2] || '')).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
