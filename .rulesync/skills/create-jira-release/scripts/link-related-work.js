import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, loadWorkspaceEnv, requireAtlassianEnv } from '../../lib/env.js'
import { resolveReleaseId } from '../../get-jira-release/scripts/resolve-release-id.js'

/**
 * Add a Related work link unless that URL is already on the fix version.
 * @param {string[]} argv
 * @returns {Promise<object | null>}
 */
export async function linkRelatedWork (argv) {
  loadWorkspaceEnv()
  const versionInput = argv[0]
  const workUrl = argv[1]
  let title = ''
  let category = process.env.JIRA_RELATED_WORK_CATEGORY || 'Documentation'
  let outputFile = ''
  let dryRun = false
  const rest = argv.slice(2)
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === '--title') { title = rest[++index]; continue }
    if (arg === '--category') { category = rest[++index]; continue }
    if (arg === '--dry-run') { dryRun = true; continue }
    if (!outputFile) outputFile = arg
    else throw new Error(`Error: unknown argument: ${arg}`)
  }
  if (!versionInput || !workUrl) {
    throw new Error('Usage: node link-related-work.js <version_id_or_url> <url> [--title "Title"] [--category Documentation] [output.json]')
  }
  requireAtlassianEnv(2)
  const versionId = await resolveReleaseId(versionInput)
  if (!title) title = 'Release notes'
  const existing = await jira('GET', `${jiraBaseUrl()}/rest/api/3/version/${versionId}/relatedwork`)
  if (existing?.statusCode) throw new Error(`Error: ${existing.message || 'Failed to fetch related work'}`)
  const duplicate = (existing || []).find((item) => item.url === workUrl)
  if (duplicate) {
    console.log('Related work already linked')
    console.log(`Title: ${duplicate.title}`)
    console.log(`URL: ${workUrl}`)
    console.log(`ID: ${duplicate.relatedWorkId}`)
    const payload = { status: 'existing', relatedWork: duplicate }
    if (outputFile) writeFileSync(outputFile, JSON.stringify(payload, null, 2) + '\n')
    return payload
  }
  if (dryRun) {
    console.log('Dry run — would add related work')
    console.log(`  Version ID: ${versionId}`)
    console.log(`  Title: ${title}`)
    console.log(`  Category: ${category}`)
    console.log(`  URL: ${workUrl}`)
    return null
  }
  const created = await jira('POST', `${jiraBaseUrl()}/rest/api/3/version/${versionId}/relatedwork`, {
    category, title, url: workUrl
  })
  if (created?.statusCode) throw new Error(`Error: ${created.message || 'Failed to create related work'}`)
  console.log(`Added related work to release ${versionId}`)
  console.log(`Title: ${created.title}`)
  console.log(`Category: ${created.category}`)
  console.log(`URL: ${created.url}`)
  console.log(`ID: ${created.relatedWorkId}`)
  const payload = { status: 'created', relatedWork: created }
  if (outputFile) writeFileSync(outputFile, JSON.stringify(payload, null, 2) + '\n')
  return payload
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((linkRelatedWork)(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
