import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { confluenceSearchFile } from '../../lib/tmp.js'

function columns (lines) {
  const rows = lines.filter((line) => line !== '').map((line) => line.split('\t'))
  const widths = []
  for (const row of rows) {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index] || 0, cell.length)
    })
  }
  return rows.map((row) => row.map((cell, index) => {
    if (index === row.length - 1) return cell
    return cell.padEnd(widths[index])
  }).join('  ')).join('\n')
}

/**
 * Search Confluence pages.
 * @param {string[]} argv
 * @returns {Promise<string>}
 */
export async function searchText (argv) {
  const query = argv[0]
  const spaceKey = argv[1] || ''
  const format = argv[2] || 'list'
  if (!query) throw new Error('Usage: node search.js "query" [space_key] [format]')
  requireAtlassianEnv()
  const escaped = query.replaceAll('"', '\\"')
  const cql = spaceKey
    ? `type=page AND space="${spaceKey}" AND (title~"${escaped}" OR text~"${escaped}")`
    : `type=page AND (title~"${escaped}" OR text~"${escaped}")`
  const params = new URLSearchParams({
    cql,
    limit: process.env.CONFLUENCE_SEARCH_LIMIT || '25',
    expand: 'space,version'
  })
  const base = confluenceBaseUrl()
  const response = await atlassianJson(`${base}/rest/api/content/search?${params}`)
  if (response?.statusCode) throw new Error(response.message || 'Unknown error')
  if (format === 'json') return JSON.stringify(response)
  const rows = (response.results || []).map((page) => `${page.id}\t${page.space.key}\t${page.title}\t${base}/spaces/${page.space.key}/pages/${page.id}`)
  const where = spaceKey ? ` in space ${spaceKey}` : ''
  return [`=== Confluence search: "${query}"${where} (${response.size} results) ===`, columns(rows)].join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  const text = await searchText([argv[0] || '', argv[1] || '', 'list'])
  const file = confluenceSearchFile(argv[0] || '', argv[1] || '')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`)
  console.log(text)
  console.log(`\nSaved: ${file}`)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
