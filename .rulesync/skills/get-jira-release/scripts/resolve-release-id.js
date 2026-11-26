import { pathToFileURL } from 'node:url'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Print a fix version id from a number, a release URL, or a project key plus a name.
 * @param {string} input
 * @param {string} [versionName]
 * @returns {Promise<string>}
 */
export async function resolveReleaseId (input, versionName = '') {
  if (!input) throw new Error('Usage: node resolve-release-id.js <version_id_or_url> [version_name]')
  if (/^[0-9]+$/.test(input)) return input
  const projectVersion = input.match(/\/projects\/[^/]+\/versions\/([0-9]+)/)
  if (projectVersion) return projectVersion[1]
  const version = input.match(/\/versions\/([0-9]+)/)
  if (version) return version[1]
  if (versionName) {
    requireAtlassianEnv()
    const response = await jira('GET', `${jiraBaseUrl()}/rest/api/2/project/${input}/versions`)
    if (response?.errorMessages) throw new Error(`Error: ${errorText(response)}`)
    const match = (response || []).find((item) => item.name === versionName)
    if (!match) throw new Error(`Error: version '${versionName}' not found in project ${input}`)
    return String(match.id)
  }
  throw new Error(`Error: unable to resolve version ID from input: ${input}\nProvide a numeric ID, release URL, or project key + version name`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  if (!/^[0-9]+$/.test(argv[0] || '') && !argv[0]?.includes('/versions/')) requireAtlassianEnv()
  const id = await resolveReleaseId(argv[0] || '', argv[1] || '')
  console.log(id)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
