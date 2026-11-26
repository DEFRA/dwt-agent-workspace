import { pathToFileURL } from 'node:url'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Return true when a fix version with this name already exists.
 * @param {string} projectKey
 * @param {string} versionName
 * @returns {Promise<boolean>}
 */
export async function checkExistingRelease (projectKey, versionName) {
  if (!projectKey || !versionName) throw new Error('Usage: node check-existing-release.js <project_key> "<version_name>"')
  requireAtlassianEnv(2)
  const key = projectKey.toUpperCase()
  const versions = await jira('GET', `${jiraBaseUrl()}/rest/api/2/project/${key}/versions`)
  if (versions?.errorMessages) throw new Error(`Error: ${versions.errorMessages.join('\n')}`)
  const match = (versions || []).find((item) => item.name === versionName)
  if (!match) {
    console.log(`No release found for: ${versionName}`)
    return false
  }
  console.log('Release already exists')
  console.log(`Name: ${versionName}`)
  console.log(`ID: ${match.id}`)
  console.log(`Released: ${match.released}`)
  console.log(`Archived: ${match.archived}`)
  console.log(`URL: ${jiraBaseUrl()}/projects/${key}/versions/${match.id}`)
  console.log('')
  console.log(`Use edit-jira-release with version ${match.id}.`)
  return true
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  const exists = await checkExistingRelease(argv[0] || '', argv[1] || '')
  if (exists) process.exit(1)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
