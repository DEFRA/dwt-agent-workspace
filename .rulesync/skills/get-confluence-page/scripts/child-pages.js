import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { pageText } from './page.js'

/**
 * Write child pages under a Confluence page.
 * @param {string} pageId
 * @param {string} outputDir
 */
export async function childPages (pageId, outputDir) {
  if (!pageId || !outputDir) throw new Error('Usage: node child-pages.js PAGE_ID <output_dir>')
  requireAtlassianEnv()
  const maxChildren = process.env.CONFLUENCE_MAX_CHILDREN || '10'
  const childrenDir = join(outputDir, 'children')
  mkdirSync(childrenDir, { recursive: true })
  const response = await atlassianJson(`${confluenceBaseUrl()}/rest/api/content/${pageId}/child/page?limit=${maxChildren}&expand=page`)
  if (response?.statusCode) throw new Error(response.message || 'Unknown error')
  const results = response.results || []
  const lines = [
    `Child pages for Confluence page ${pageId}`,
    `Fetched: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    '',
    `Child pages (full content, max ${maxChildren}):`
  ]
  if (!results.length) lines.push('  (none)')
  for (const child of results) {
    const childDir = join(childrenDir, child.id)
    mkdirSync(childDir, { recursive: true })
    writeFileSync(join(childDir, 'page.txt'), (await pageText(child.id, 'full')) + '\n')
    writeFileSync(join(childDir, 'page.json'), (await pageText(child.id, 'json')) + '\n')
    lines.push(`  ${child.id} — ${child.title}`)
  }
  const text = lines.join('\n') + '\n'
  writeFileSync(join(childrenDir, 'index.txt'), text)
  process.stdout.write(text)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await childPages(argv[0] || '', argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
