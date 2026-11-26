import { pathToFileURL } from 'node:url'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { resolveReleaseId } from './resolve-release-id.js'

const FORMATS = new Set(['full', 'summary', 'json'])

/**
 * @param {object} version
 * @returns {string}
 */
function statusOf (version) {
  if (version.archived) return 'Archived'
  if (version.released) return 'Released'
  return 'Unreleased'
}

/**
 * Render fix version metadata.
 * @param {string[]} argv
 * @returns {Promise<string>}
 */
export async function releaseText (argv) {
  const input = argv[0]
  if (!input) throw new Error('Usage: node release.js <version_id_or_url> [format]\n   or: node release.js <project_key> "<version_name>" [format]')
  let versionName = ''
  let format = 'full'
  if (FORMATS.has(argv[1])) format = argv[1]
  else if (argv[1]) {
    versionName = argv[1]
    if (FORMATS.has(argv[2])) format = argv[2]
  }
  requireAtlassianEnv()
  const versionId = versionName ? await resolveReleaseId(input, versionName) : await resolveReleaseId(input)
  const version = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (version?.errorMessages) throw new Error(`Error: ${errorText(version)}`)
  if (format === 'json') return JSON.stringify(version)
  if (format === 'summary') {
    return JSON.stringify({
      id: version.id,
      name: version.name,
      description: version.description || '',
      status: statusOf(version),
      released: version.released,
      archived: version.archived,
      startDate: version.startDate || 'Not set',
      releaseDate: version.releaseDate || 'Not set',
      projectId: version.projectId,
      overdue: version.overdue || false
    }, null, 2)
  }
  return [
    `=== Release ${versionId} ===`,
    `Name: ${version.name}`,
    `Status: ${statusOf(version)}`,
    `Released: ${version.released}`,
    `Archived: ${version.archived}`,
    `Start date: ${version.startDate || 'Not set'}`,
    `Release date: ${version.releaseDate || 'Not set'}`,
    `Overdue: ${version.overdue || false}`,
    `Project ID: ${version.projectId}`,
    '',
    '=== Description ===',
    version.description || 'No description',
    '',
    `URL: ${jiraBaseUrl()}/projects/<project>/versions/${versionId}/tab/release-report-all-issues`
  ].join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  console.log(await releaseText(argv))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
