import { pathToFileURL } from 'node:url'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { resolveContentId } from './resolve-content-id.js'

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
 * Render one Confluence page.
 * @param {string} input
 * @param {string} [format]
 * @returns {Promise<string>}
 */
export async function pageText (input, format = 'full') {
  if (!input) throw new Error('Usage: node page.js PAGE_ID_OR_URL [format]\nFormats: full (default), summary, json')
  requireAtlassianEnv()
  const pageId = resolveContentId(input)
  const base = confluenceBaseUrl()
  const page = await atlassianJson(`${base}/rest/api/content/${pageId}?expand=body.view,body.storage,version,space,history,metadata.labels,ancestors`)
  if (page?.statusCode) throw new Error(page.message || 'Unknown error')
  if (format === 'json') return JSON.stringify(page)
  if (format === 'summary') {
    return JSON.stringify({
      id: page.id,
      title: page.title,
      space: page.space.key,
      version: page.version.number,
      updated: page.version.when,
      updatedBy: page.version.by.displayName,
      url: `${base}/spaces/${page.space.key}/pages/${page.id}`
    }, null, 2)
  }
  const lines = [
    `=== Page ${pageId} ===`,
    `Title: ${page.title}`,
    `Space: ${page.space.key}`,
    `Version: ${page.version.number} (Updated: ${page.version.when})`,
    `Updated by: ${page.version.by.displayName}`,
    `URL: ${base}/spaces/${page.space.key}/pages/${page.id}`
  ]
  const ancestors = page.ancestors || []
  if (ancestors.length) {
    lines.push('', '=== Page hierarchy ===', columns(ancestors.map((item) => `${item.id}\t${item.title}`)))
  }
  const labels = (page.metadata?.labels?.results || []).map((label) => label.name)
  lines.push('', '=== Labels ===', labels.length ? labels.join('\n') : '(none)', '', '=== Body (HTML) ===', page.body?.view?.value || 'No content')
  return lines.join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  console.log(await pageText(argv[0] || '', argv[1] || 'full'))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
