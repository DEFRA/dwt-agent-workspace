import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { confluenceFolderDir, rejectOutputArg } from '../../lib/tmp.js'
import { pageText } from './page.js'
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
 * Write a Confluence folder and the pages inside it.
 * Writes `.tmp/confluence-folders/<id>/`.
 * @param {string} folderInput
 */
export async function folderContents (folderInput) {
  if (!folderInput) throw new Error('Usage: node folder-contents.js FOLDER_ID_OR_URL')
  requireAtlassianEnv()
  const base = confluenceBaseUrl()
  const maxPages = Number(process.env.CONFLUENCE_MAX_FOLDER_PAGES || 50)
  const folderId = resolveContentId(folderInput)
  const outputDir = confluenceFolderDir(folderId)
  const pagesDir = join(outputDir, 'pages')
  mkdirSync(pagesDir, { recursive: true })
  const folder = await atlassianJson(`${base}/rest/api/content/${folderId}?expand=space,version,ancestors`)
  if (folder?.statusCode) throw new Error(folder.message || 'Unknown error')
  if (folder.type !== 'folder' && folder.type !== 'page') {
    console.error(`Warning: content type is '${folder.type}' (expected folder or page)`)
  }
  writeFileSync(join(outputDir, 'folder.json'), JSON.stringify(folder, null, 2) + '\n')
  const folderLines = [
    `=== Folder ${folderId} ===`,
    `Title: ${folder.title}`,
    `Type: ${folder.type}`,
    `Space: ${folder.space.key}`,
    `URL: ${base}/spaces/${folder.space.key}/folder/${folder.id}`
  ]
  if (folder.ancestors?.length) {
    folderLines.push('', '=== Folder hierarchy ===', columns(folder.ancestors.map((item) => `${item.id}\t${item.title}`)))
  }
  writeFileSync(join(outputDir, 'folder.txt'), folderLines.join('\n') + '\n')
  const pages = []
  let start = 0
  let lastBatch = 0
  while (pages.length < maxPages) {
    const limit = Math.min(50, maxPages - pages.length)
    const response = await atlassianJson(`${base}/rest/api/content/${folderId}/child/page?start=${start}&limit=${limit}&expand=page`)
    if (response?.statusCode) throw new Error(response.message || 'Unknown error')
    const batch = response.results || []
    pages.push(...batch)
    start += batch.length
    lastBatch = batch.length
    if (!batch.length) break
  }
  let truncated = false
  if (pages.length >= maxPages && lastBatch > 0) {
    const probe = await atlassianJson(`${base}/rest/api/content/${folderId}/child/page?start=${pages.length}&limit=1`)
    if ((probe.results || []).length) truncated = true
  }
  const index = [
    `Pages in folder ${folderId}`,
    `Fetched: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    `Total fetched: ${pages.length} (max ${maxPages})`,
    truncated ? 'WARNING: Folder has more pages than fetched. Re-run with CONFLUENCE_MAX_FOLDER_PAGES=<n> to fetch more.' : '',
    ''
  ].filter((line, index, all) => line !== '' || index === all.length - 1)
  if (!pages.length) index.push('  (no pages in folder)')
  for (const page of pages) {
    const pageDir = join(pagesDir, page.id)
    mkdirSync(pageDir, { recursive: true })
    writeFileSync(join(pageDir, 'page.txt'), (await pageText(page.id, 'full')) + '\n')
    writeFileSync(join(pageDir, 'page.json'), (await pageText(page.id, 'json')) + '\n')
    index.push(`  ${page.id} — ${page.title}`)
  }
  writeFileSync(join(pagesDir, 'index.txt'), index.join('\n') + '\n')
  process.stdout.write(folderLines.join('\n') + '\n\n' + index.join('\n') + '\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  rejectOutputArg(argv[1] || '')
  await folderContents(argv[0] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
