import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { atlassianJson } from '../../lib/atlassian.js'
import { confluenceBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { resolveContentId } from '../../get-confluence-page/scripts/resolve-content-id.js'

/**
 * Create a Confluence page under a parent.
 * @param {string} parentInput
 * @param {string} title
 * @param {string} bodyFile
 */
export async function createPage (parentInput, title, bodyFile) {
  if (!parentInput || !title || !bodyFile) throw new Error('Usage: node create-page.js <parent_id_or_url> "<title>" <body_file>')
  let body
  try { body = readFileSync(bodyFile, 'utf8') } catch { throw new Error(`Error: body file not found: ${bodyFile}`) }
  requireAtlassianEnv()
  const base = confluenceBaseUrl()
  const parentId = resolveContentId(parentInput)
  const parent = await atlassianJson(`${base}/rest/api/content/${parentId}?expand=space`)
  if (parent?.statusCode) throw new Error(parent.message || 'Unknown error')
  const created = await atlassianJson(`${base}/rest/api/content?expand=space,version`, {
    method: 'POST',
    body: {
      type: 'page',
      title,
      ancestors: [{ id: parentId }],
      space: { key: parent.space.key },
      body: { storage: { value: body, representation: 'storage' } }
    }
  })
  if (created?.statusCode) throw new Error(created.message || 'Unknown error')
  console.log(`Created page under "${parent.title}" (parent ${parentId})`)
  console.log(`Title: ${title}`)
  console.log(`ID: ${created.id}`)
  console.log(`URL: ${base}/spaces/${created.space.key}/pages/${created.id}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await createPage(argv[0] || '', argv[1] || '', argv[2] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
