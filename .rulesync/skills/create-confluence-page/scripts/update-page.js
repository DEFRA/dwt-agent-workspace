import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { resolveContentId } from '../../get-confluence-page/scripts/resolve-content-id.js'

/**
 * Update an existing Confluence page.
 * @param {string} pageInput
 * @param {string} bodyFile
 * @param {string} [newTitle]
 */
export async function updatePage (pageInput, bodyFile, newTitle = '') {
  if (!pageInput || !bodyFile) throw new Error('Usage: node update-page.js <page_id_or_url> <body_file> ["<new_title>"]')
  let body
  try { body = readFileSync(bodyFile, 'utf8') } catch { throw new Error(`Error: body file not found: ${bodyFile}`) }
  requireAtlassianEnv()
  const base = confluenceBaseUrl()
  const pageId = resolveContentId(pageInput)
  const current = await atlassianJson(`${base}/rest/api/content/${pageId}?expand=space,version,body.storage`)
  if (current?.statusCode) throw new Error(current.message || 'Unknown error')
  const title = newTitle || current.title
  const updated = await atlassianJson(`${base}/rest/api/content/${pageId}?expand=space,version`, {
    method: 'PUT',
    body: {
      id: pageId,
      type: 'page',
      title,
      space: { key: current.space.key },
      version: { number: current.version.number + 1 },
      body: { storage: { value: body, representation: 'storage' } }
    }
  })
  if (updated?.statusCode) throw new Error(updated.message || 'Unknown error')
  console.log('Updated page')
  console.log(`Title: ${title}`)
  console.log(`Version: ${updated.version.number}`)
  console.log(`ID: ${updated.id}`)
  console.log(`URL: ${base}/spaces/${updated.space.key}/pages/${updated.id}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await updatePage(argv[0] || '', argv[1] || '', argv[2] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
