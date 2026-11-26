import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Add a fix version to each ticket key.
 * @param {string} versionId
 * @param {string} ticketsCsv
 * @param {string} [outputDir]
 * @returns {Promise<{ assigned: string[], failed: string[] }>}
 */
export async function assignIssues (versionId, ticketsCsv, outputDir = '') {
  if (!versionId || !ticketsCsv) throw new Error('Usage: node assign-issues.js <version_id> "DWTA-154,DWTA-155" [output_dir]')
  requireAtlassianEnv()
  const assigned = []
  const failed = []
  for (const raw of ticketsCsv.split(',')) {
    const ticket = raw.trim().toUpperCase()
    if (!ticket) continue
    const response = await jira('PUT', `${jiraBaseUrl()}/rest/api/2/issue/${ticket}`, {
      update: { fixVersions: [{ add: { id: String(versionId) } }] }
    })
    if (response?.errorMessages || response?.errors) {
      console.log(`Failed: ${ticket} — ${errorText(response) || 'unknown error'}`)
      failed.push(ticket)
      continue
    }
    console.log(`Assigned: ${ticket}`)
    assigned.push(ticket)
  }
  if (outputDir) {
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(join(outputDir, 'assignments.json'), JSON.stringify({ versionId: String(versionId), assigned, failed }, null, 2) + '\n')
  }
  if (failed.length) process.exit(1)
  return { assigned, failed }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await assignIssues(argv[0] || '', argv[1] || '', argv[2] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
